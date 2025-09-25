// Error Handling and Recovery Service for Yellow SDK Integration

import { analyticsService } from './analyticsService';
import { yellowSDKService } from './yellowSDKService';

export interface ErrorContext {
  service: string;
  operation: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ErrorReport {
  id: string;
  type: 'connection' | 'authentication' | 'payment' | 'content' | 'nft' | 'system' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  context: ErrorContext;
  recoveryAttempts: number;
  resolved: boolean;
  resolvedAt?: Date;
  userImpact: 'none' | 'minor' | 'major' | 'blocking';
}

export interface RecoveryStrategy {
  type: string;
  maxAttempts: number;
  backoffMs: number;
  condition?: (error: Error, context: ErrorContext) => boolean;
  action: (error: Error, context: ErrorContext, attempt: number) => Promise<boolean>;
}

class ErrorHandlingService {
  private errorReports: Map<string, ErrorReport> = new Map();
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: number; isOpen: boolean }> = new Map();

  constructor() {
    this.initializeRecoveryStrategies();
    this.setupGlobalErrorHandlers();
  }

  private initializeRecoveryStrategies() {
    // WebSocket connection recovery
    this.recoveryStrategies.set('websocket_connection', {
      type: 'websocket_connection',
      maxAttempts: 5,
      backoffMs: 1000,
      condition: (error) => error.message.includes('WebSocket') || error.message.includes('connection'),
      action: async (error, context, attempt) => {
        console.log(`Attempting WebSocket reconnection (attempt ${attempt})`);
        try {
          await yellowSDKService.initializeConnection();
          return true;
        } catch (reconnectError) {
          console.error('WebSocket reconnection failed:', reconnectError);
          return false;
        }
      }
    });

    // Authentication recovery
    this.recoveryStrategies.set('authentication', {
      type: 'authentication',
      maxAttempts: 3,
      backoffMs: 2000,
      condition: (error) => error.message.includes('authentication') || error.message.includes('unauthorized'),
      action: async (error, context, attempt) => {
        console.log(`Attempting authentication recovery (attempt ${attempt})`);
        try {
          // Clear existing session and prompt for re-authentication
          yellowSDKService.clearSession();
          // In a real app, this would trigger a re-authentication flow
          return false; // Require user intervention
        } catch (authError) {
          console.error('Authentication recovery failed:', authError);
          return false;
        }
      }
    });

    // Payment channel recovery
    this.recoveryStrategies.set('payment_channel', {
      type: 'payment_channel',
      maxAttempts: 3,
      backoffMs: 3000,
      condition: (error) => error.message.includes('payment channel') || error.message.includes('insufficient'),
      action: async (error, context, attempt) => {
        console.log(`Attempting payment channel recovery (attempt ${attempt})`);
        try {
          // Try to create a new payment channel
          await yellowSDKService.createPaymentChannel();
          return true;
        } catch (channelError) {
          console.error('Payment channel recovery failed:', channelError);
          return false;
        }
      }
    });

    // Network request retry
    this.recoveryStrategies.set('network_request', {
      type: 'network_request',
      maxAttempts: 3,
      backoffMs: 1000,
      condition: (error) => error.message.includes('fetch') || error.message.includes('network'),
      action: async (error, context, attempt) => {
        console.log(`Retrying network request (attempt ${attempt})`);
        // This would be handled by the specific service making the request
        return false; // Let the calling service handle the retry
      }
    });

    // IPFS gateway failover
    this.recoveryStrategies.set('ipfs_gateway', {
      type: 'ipfs_gateway',
      maxAttempts: 3,
      backoffMs: 500,
      condition: (error) => error.message.includes('IPFS') || error.message.includes('gateway'),
      action: async (error, context, attempt) => {
        console.log(`Attempting IPFS gateway failover (attempt ${attempt})`);
        try {
          // Switch to next available gateway
          // This would be implemented in the IPFS service
          return true;
        } catch (ipfsError) {
          console.error('IPFS gateway failover failed:', ipfsError);
          return false;
        }
      }
    });
  }

  private setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        service: 'global',
        operation: 'unhandled_promise_rejection',
        timestamp: new Date()
      });
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.handleError(new Error(event.message), {
        service: 'global',
        operation: 'global_error',
        timestamp: new Date(),
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
  }

  // Main error handling method
  async handleError(error: Error, context: ErrorContext): Promise<void> {
    const errorReport = this.createErrorReport(error, context);
    this.errorReports.set(errorReport.id, errorReport);

    // Log error for analytics
    analyticsService.trackEvent('error', {
      errorId: errorReport.id,
      type: errorReport.type,
      severity: errorReport.severity,
      message: errorReport.message,
      service: context.service,
      operation: context.operation
    }, context.userId, context.sessionId);

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(context.service)) {
      console.warn(`Circuit breaker open for ${context.service}, skipping recovery`);
      return;
    }

    // Attempt recovery
    const recovered = await this.attemptRecovery(error, context, errorReport);
    
    if (recovered) {
      errorReport.resolved = true;
      errorReport.resolvedAt = new Date();
      console.log(`Error recovered: ${errorReport.id}`);
    } else {
      this.updateCircuitBreaker(context.service, false);
      console.error(`Error recovery failed: ${errorReport.id}`);
    }
  }

  private createErrorReport(error: Error, context: ErrorContext): ErrorReport {
    const errorType = this.classifyError(error, context);
    const severity = this.determineSeverity(error, context);
    const userImpact = this.assessUserImpact(error, context);

    return {
      id: this.generateErrorId(),
      type: errorType,
      severity,
      message: error.message,
      stack: error.stack,
      context,
      recoveryAttempts: 0,
      resolved: false,
      userImpact
    };
  }

  private classifyError(error: Error, context: ErrorContext): ErrorReport['type'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('websocket') || message.includes('connection')) {
      return 'connection';
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'authentication';
    }
    if (message.includes('payment') || message.includes('transaction')) {
      return 'payment';
    }
    if (message.includes('content') || message.includes('ipfs')) {
      return 'content';
    }
    if (message.includes('nft') || message.includes('token')) {
      return 'nft';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    
    return 'system';
  }

  private determineSeverity(error: Error, context: ErrorContext): ErrorReport['severity'] {
    const message = error.message.toLowerCase();
    
    // Critical errors that break core functionality
    if (message.includes('websocket') || message.includes('authentication')) {
      return 'critical';
    }
    
    // High severity errors that impact user experience
    if (message.includes('payment') || message.includes('transaction')) {
      return 'high';
    }
    
    // Medium severity errors that cause inconvenience
    if (message.includes('content') || message.includes('ipfs')) {
      return 'medium';
    }
    
    // Low severity errors that are mostly cosmetic
    return 'low';
  }

  private assessUserImpact(error: Error, context: ErrorContext): ErrorReport['userImpact'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('websocket') || message.includes('authentication')) {
      return 'blocking';
    }
    if (message.includes('payment') || message.includes('transaction')) {
      return 'major';
    }
    if (message.includes('content') || message.includes('ipfs')) {
      return 'minor';
    }
    
    return 'none';
  }

  private async attemptRecovery(
    error: Error, 
    context: ErrorContext, 
    errorReport: ErrorReport
  ): Promise<boolean> {
    // Find applicable recovery strategies
    const strategies = Array.from(this.recoveryStrategies.values())
      .filter(strategy => !strategy.condition || strategy.condition(error, context));

    for (const strategy of strategies) {
      console.log(`Attempting recovery with strategy: ${strategy.type}`);
      
      for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
        errorReport.recoveryAttempts++;
        
        try {
          // Apply backoff delay
          if (attempt > 1) {
            await this.delay(strategy.backoffMs * Math.pow(2, attempt - 1));
          }
          
          const success = await strategy.action(error, context, attempt);
          
          if (success) {
            console.log(`Recovery successful with strategy: ${strategy.type}`);
            this.updateCircuitBreaker(context.service, true);
            return true;
          }
        } catch (recoveryError) {
          console.error(`Recovery attempt ${attempt} failed:`, recoveryError);
        }
      }
    }
    
    return false;
  }

  // Circuit breaker implementation
  private isCircuitBreakerOpen(service: string): boolean {
    const breaker = this.circuitBreakers.get(service);
    if (!breaker) return false;
    
    const now = Date.now();
    const timeSinceLastFailure = now - breaker.lastFailure;
    
    // Reset circuit breaker after 5 minutes
    if (timeSinceLastFailure > 5 * 60 * 1000) {
      breaker.failures = 0;
      breaker.isOpen = false;
    }
    
    return breaker.isOpen;
  }

  private updateCircuitBreaker(service: string, success: boolean): void {
    let breaker = this.circuitBreakers.get(service);
    
    if (!breaker) {
      breaker = { failures: 0, lastFailure: 0, isOpen: false };
      this.circuitBreakers.set(service, breaker);
    }
    
    if (success) {
      breaker.failures = 0;
      breaker.isOpen = false;
    } else {
      breaker.failures++;
      breaker.lastFailure = Date.now();
      
      // Open circuit breaker after 5 consecutive failures
      if (breaker.failures >= 5) {
        breaker.isOpen = true;
        console.warn(`Circuit breaker opened for service: ${service}`);
      }
    }
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getErrorReports(
    type?: ErrorReport['type'],
    severity?: ErrorReport['severity'],
    resolved?: boolean
  ): ErrorReport[] {
    return Array.from(this.errorReports.values()).filter(report => {
      if (type && report.type !== type) return false;
      if (severity && report.severity !== severity) return false;
      if (resolved !== undefined && report.resolved !== resolved) return false;
      return true;
    });
  }

  getErrorReport(id: string): ErrorReport | undefined {
    return this.errorReports.get(id);
  }

  markErrorResolved(id: string): boolean {
    const report = this.errorReports.get(id);
    if (report) {
      report.resolved = true;
      report.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  getSystemHealth(): {
    totalErrors: number;
    criticalErrors: number;
    unresolvedErrors: number;
    circuitBreakers: Array<{ service: string; isOpen: boolean; failures: number }>;
    errorRate: number;
  } {
    const reports = Array.from(this.errorReports.values());
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    const recentReports = reports.filter(r => r.context.timestamp.getTime() > last24Hours);
    
    return {
      totalErrors: reports.length,
      criticalErrors: reports.filter(r => r.severity === 'critical').length,
      unresolvedErrors: reports.filter(r => !r.resolved).length,
      circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([service, breaker]) => ({
        service,
        isOpen: breaker.isOpen,
        failures: breaker.failures
      })),
      errorRate: recentReports.length / Math.max(1, reports.length)
    };
  }

  // Clear old error reports
  clearOldErrors(olderThanDays: number = 7): void {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    for (const [id, report] of this.errorReports.entries()) {
      if (report.context.timestamp.getTime() < cutoffTime && report.resolved) {
        this.errorReports.delete(id);
      }
    }
    
    console.log(`Cleared resolved errors older than ${olderThanDays} days`);
  }

  // Export error reports
  exportErrorReports(): string {
    const reports = Array.from(this.errorReports.values());
    return JSON.stringify({
      reports,
      systemHealth: this.getSystemHealth(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}

export const errorHandlingService = new ErrorHandlingService();
export default errorHandlingService;