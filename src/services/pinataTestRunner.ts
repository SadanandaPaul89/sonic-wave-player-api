/**
 * Base test runner class with common functionality for Pinata API testing
 * Provides core test execution, result management, and error handling
 */

import { 
  TestResult, 
  TestSuiteResult, 
  TestType, 
  TestConfiguration, 
  TestRunnerConfig,
  TestExecutionContext,
  TestSummary,
  PerformanceMetrics,
  ErrorCategory,
  FailedOperation
} from '../types/pinataTest';
import { PinataTestConfigManager } from './pinataTestConfig';

export abstract class BasePinataTestRunner {
  protected config: TestConfiguration;
  protected runnerConfig: TestRunnerConfig;
  protected context: TestExecutionContext;
  protected results: TestResult[] = [];
  protected startTime: number = 0;

  constructor() {
    const configManager = PinataTestConfigManager.getInstance();
    this.config = configManager.getConfiguration()!;
    this.runnerConfig = configManager.getRunnerConfiguration()!;
    
    this.context = {
      testId: this.generateTestId(),
      startTime: Date.now(),
      configuration: this.config,
      results: [],
    };
  }

  /**
   * Abstract method to be implemented by specific test runners
   */
  protected abstract runSpecificTests(): Promise<TestResult[]>;

  /**
   * Get the test type for this runner
   */
  protected abstract getTestType(): TestType;

  /**
   * Run the complete test suite
   */
  public async runTests(): Promise<TestSuiteResult> {
    this.startTime = Date.now();
    this.results = [];
    this.context.startTime = this.startTime;

    try {
      // Validate configuration before running tests
      const configManager = PinataTestConfigManager.getInstance();
      const validation = configManager.validateConfiguration();
      
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Configuration warnings:', validation.warnings);
      }

      // Run the specific tests
      this.results = await this.runSpecificTests();

      // Calculate overall result
      const summary = this.calculateSummary();
      const overall = this.determineOverallStatus(summary);

      return {
        overall,
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        tests: this.results,
        summary,
      };

    } catch (error) {
      // Handle unexpected errors
      const errorResult: TestResult = {
        testName: 'Test Suite Execution',
        status: 'fail',
        duration: Date.now() - this.startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      return {
        overall: 'fail',
        timestamp: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        tests: [errorResult],
        summary: {
          totalTests: 1,
          passed: 0,
          failed: 1,
          skipped: 0,
          successRate: 0,
        },
      };
    }
  }

  /**
   * Run a single test with error handling and timing
   */
  protected async runSingleTest(
    testName: string,
    testFunction: () => Promise<any>,
    timeout?: number
  ): Promise<TestResult> {
    const testStartTime = Date.now();
    this.context.currentTest = testName;

    try {
      // Set up timeout if specified
      const timeoutMs = timeout || this.runnerConfig.timeout;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), timeoutMs);
      });

      // Run the test with timeout
      const result = await Promise.race([
        testFunction(),
        timeoutPromise,
      ]);

      const duration = Date.now() - testStartTime;

      return {
        testName,
        status: 'pass',
        duration,
        details: result,
      };

    } catch (error) {
      const duration = Date.now() - testStartTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return {
        testName,
        status: 'fail',
        duration,
        details: { error: errorMessage },
        error: errorMessage,
      };
    } finally {
      this.context.currentTest = undefined;
    }
  }

  /**
   * Run multiple tests in parallel or sequence
   */
  protected async runMultipleTests(
    tests: Array<{ name: string; fn: () => Promise<any>; timeout?: number }>
  ): Promise<TestResult[]> {
    if (this.runnerConfig.parallel) {
      // Run tests in parallel
      const promises = tests.map(test => 
        this.runSingleTest(test.name, test.fn, test.timeout)
      );
      return Promise.all(promises);
    } else {
      // Run tests sequentially
      const results: TestResult[] = [];
      for (const test of tests) {
        const result = await this.runSingleTest(test.name, test.fn, test.timeout);
        results.push(result);
      }
      return results;
    }
  }

  /**
   * Retry a failed operation with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.testOptions.retryAttempts,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Measure performance metrics for an operation
   */
  protected async measurePerformance<T>(
    operation: () => Promise<T>,
    operationType: string
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    try {
      const result = await operation();
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const metrics: PerformanceMetrics = {
        uploadSpeed: 0, // To be calculated by specific implementations
        downloadSpeed: 0, // To be calculated by specific implementations
        gatewayLatency: endTime - startTime,
        apiResponseTime: endTime - startTime,
        successRate: 100, // Success if we reach here
      };

      return { result, metrics };
    } catch (error) {
      const endTime = performance.now();
      
      const metrics: PerformanceMetrics = {
        uploadSpeed: 0,
        downloadSpeed: 0,
        gatewayLatency: endTime - startTime,
        apiResponseTime: endTime - startTime,
        successRate: 0,
      };

      throw error;
    }
  }

  /**
   * Categorize an error for better handling
   */
  protected categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return 'authentication';
    }
    if (message.includes('timeout') || message.includes('network')) {
      return 'network';
    }
    if (message.includes('quota') || message.includes('limit')) {
      return 'quota';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    if (message.includes('upload')) {
      return 'upload';
    }
    if (message.includes('retrieval') || message.includes('download')) {
      return 'retrieval';
    }
    if (message.includes('pin')) {
      return 'pinning';
    }

    return 'unknown';
  }

  /**
   * Log test progress and results
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.runnerConfig.verbose && level === 'info') {
      return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'info':
        console.log(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'error':
        console.error(logMessage, data || '');
        break;
    }
  }

  /**
   * Calculate test summary statistics
   */
  private calculateSummary(): TestSummary {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;
    const successRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;

    return {
      totalTests,
      passed,
      failed,
      skipped,
      successRate,
    };
  }

  /**
   * Determine overall test suite status
   */
  private determineOverallStatus(summary: TestSummary): 'pass' | 'fail' | 'warning' {
    if (summary.failed > 0) {
      return 'fail';
    }
    if (summary.successRate < this.config.performanceBaselines.minSuccessRate) {
      return 'warning';
    }
    return 'pass';
  }

  /**
   * Generate a unique test ID
   */
  private generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current test context
   */
  public getContext(): TestExecutionContext {
    return { ...this.context, results: [...this.results] };
  }

  /**
   * Add a test result to the current context
   */
  protected addResult(result: TestResult): void {
    this.results.push(result);
    this.context.results.push(result);
  }

  /**
   * Clean up resources after test execution
   */
  protected async cleanup(): Promise<void> {
    // Override in specific implementations if cleanup is needed
    this.log('info', 'Test cleanup completed');
  }
}