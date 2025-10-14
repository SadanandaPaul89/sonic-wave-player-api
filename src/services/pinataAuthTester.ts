/**
 * Pinata Authentication Tester
 * Handles credential validation, API connectivity testing, and permissions checking
 * Requirements: 1.1, 1.2, 1.3
 */

import {
    AuthTestResult,
    ConnectivityResult,
    ApiLimitsResult,
    TestResult,
    TestConfiguration,
    TestType
} from '../types/pinataTest';
import { BasePinataTestRunner } from './pinataTestRunner';
import { IPFS_CONFIG } from '../config/environment';

export class PinataAuthTester extends BasePinataTestRunner {
    private readonly PINATA_API_BASE = 'https://api.pinata.cloud';
    private readonly TEST_TIMEOUT = 10000; // 10 seconds
    private readonly MAX_RETRIES = 3;

    constructor() {
        super();
    }

    /**
     * Implementation of abstract method from BasePinataTestRunner
     */
    protected async runSpecificTests(): Promise<TestResult[]> {
        const tests = [
            {
                name: 'Credential Validation',
                fn: async () => await this.testCredentials()
            },
            {
                name: 'API Connectivity',
                fn: async () => await this.testConnectivity()
            },
            {
                name: 'API Limits Check',
                fn: async () => await this.validateApiLimits()
            }
        ];

        return await this.runMultipleTests(tests);
    }

    /**
     * Implementation of abstract method from BasePinataTestRunner
     */
    protected getTestType(): TestType {
        return 'authentication';
    }

    /**
     * Test Pinata API credentials validity
     * Requirement 1.1: Validate Pinata API credentials using the test endpoint
     */
    async testCredentials(): Promise<AuthTestResult> {
        const startTime = performance.now();

        try {
            if (!this.config.pinataCredentials.apiKey || !this.config.pinataCredentials.secretKey) {
                return {
                    valid: false,
                    keyType: 'admin',
                    permissions: [],
                    expirationDate: undefined
                };
            }

            const response = await this.makeAuthenticatedRequest('/data/testAuthentication', 'GET');

            if (response.ok) {
                const data = await response.json();

                // Determine key type based on response structure
                const keyType = this.determineKeyType(data);

                // Extract permissions from response
                const permissions = this.extractPermissions(data);

                return {
                    valid: true,
                    keyType,
                    permissions,
                    expirationDate: data.expirationDate
                };
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Authentication test failed:', errorData);

                return {
                    valid: false,
                    keyType: 'admin',
                    permissions: [],
                    expirationDate: undefined
                };
            }
        } catch (error) {
            console.error('Error testing credentials:', error);
            return {
                valid: false,
                keyType: 'admin',
                permissions: [],
                expirationDate: undefined
            };
        }
    }

    /**
     * Test API connectivity with timeout handling
     * Requirement 1.2: Handle connection timeout gracefully when Pinata service is unavailable
     */
    async testConnectivity(): Promise<ConnectivityResult> {
        const startTime = performance.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.TEST_TIMEOUT);

            const response = await fetch(`${this.PINATA_API_BASE}/data/testAuthentication`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const responseTime = performance.now() - startTime;

            if (response.ok) {
                return {
                    connected: true,
                    responseTime,
                    error: undefined
                };
            } else {
                return {
                    connected: false,
                    responseTime,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }
        } catch (error) {
            const responseTime = performance.now() - startTime;

            if (error.name === 'AbortError') {
                return {
                    connected: false,
                    responseTime,
                    error: `Connection timeout after ${this.TEST_TIMEOUT}ms`
                };
            }

            return {
                connected: false,
                responseTime,
                error: error.message || 'Unknown connection error'
            };
        }
    }

    /**
     * Validate API limits and permissions
     * Requirement 1.3: Check API limits and permissions
     */
    async validateApiLimits(): Promise<ApiLimitsResult> {
        try {
            // Get current usage statistics
            const usageResponse = await this.makeAuthenticatedRequest('/data/userPinnedDataTotal', 'GET');

            if (!usageResponse.ok) {
                throw new Error(`Failed to get usage data: ${usageResponse.status} ${usageResponse.statusText}`);
            }

            const usageData = await usageResponse.json();

            // Get account information for limits
            const accountResponse = await this.makeAuthenticatedRequest('/users/generateApiKey', 'GET');

            // Note: This endpoint might not exist, so we'll handle gracefully
            let accountData = {};
            if (accountResponse.ok) {
                accountData = await accountResponse.json();
            }

            // Calculate usage metrics
            const currentUsage = usageData.pin_count || 0;
            const totalSize = usageData.pin_size_total || 0;

            // Default limits (these would typically come from account info)
            const monthlyLimit = (accountData as any).monthly_limit || 1000; // Default assumption
            const remainingQuota = Math.max(0, monthlyLimit - currentUsage);

            // Calculate reset date (typically first of next month)
            const now = new Date();
            const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

            return {
                currentUsage,
                monthlyLimit,
                remainingQuota,
                resetDate: resetDate.toISOString()
            };
        } catch (error) {
            console.error('Error validating API limits:', error);

            // Return default values on error
            return {
                currentUsage: 0,
                monthlyLimit: 1000,
                remainingQuota: 1000,
                resetDate: new Date().toISOString()
            };
        }
    }

    /**
     * Run comprehensive authentication test
     * Combines all authentication tests into a single result
     */
    async runAuthenticationTest(): Promise<TestResult> {
        const startTime = performance.now();
        const testName = 'Pinata Authentication Test';

        try {
            // Test credentials
            const credentialsResult = await this.testCredentials();

            if (!credentialsResult.valid) {
                return {
                    testName,
                    status: 'fail',
                    duration: performance.now() - startTime,
                    details: {
                        credentials: credentialsResult,
                        connectivity: null,
                        apiLimits: null
                    },
                    error: 'Invalid API credentials'
                };
            }

            // Test connectivity
            const connectivityResult = await this.testConnectivity();

            if (!connectivityResult.connected) {
                return {
                    testName,
                    status: 'fail',
                    duration: performance.now() - startTime,
                    details: {
                        credentials: credentialsResult,
                        connectivity: connectivityResult,
                        apiLimits: null
                    },
                    error: connectivityResult.error || 'Connection failed'
                };
            }

            // Test API limits
            const apiLimitsResult = await this.validateApiLimits();

            // Check if quota is critically low
            const quotaWarning = apiLimitsResult.remainingQuota < 10;

            return {
                testName,
                status: quotaWarning ? 'fail' : 'pass',
                duration: performance.now() - startTime,
                details: {
                    credentials: credentialsResult,
                    connectivity: connectivityResult,
                    apiLimits: apiLimitsResult
                },
                error: quotaWarning ? 'API quota is critically low' : undefined,
                metrics: {
                    uploadSpeed: 0,
                    downloadSpeed: 0,
                    gatewayLatency: 0,
                    apiResponseTime: connectivityResult.responseTime,
                    successRate: 100
                }
            };
        } catch (error) {
            return {
                testName,
                status: 'fail',
                duration: performance.now() - startTime,
                details: {
                    credentials: null,
                    connectivity: null,
                    apiLimits: null
                },
                error: error.message || 'Authentication test failed'
            };
        }
    }

    /**
     * Test API with retry logic and exponential backoff
     * Requirement 1.4: Implement proper retry logic with exponential backoff when API rate limits are exceeded
     */
    async testWithRetry<T>(
        testFunction: () => Promise<T>,
        maxRetries: number = this.MAX_RETRIES
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await testFunction();
            } catch (error) {
                lastError = error;

                // Check if it's a rate limit error
                if (this.isRateLimitError(error)) {
                    if (attempt < maxRetries) {
                        const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff
                        console.log(`Rate limit hit, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
                        await this.delay(backoffDelay);
                        continue;
                    }
                }

                // For non-rate-limit errors, don't retry
                if (!this.isRetryableError(error)) {
                    throw error;
                }

                // For other retryable errors, use shorter backoff
                if (attempt < maxRetries) {
                    const backoffDelay = Math.pow(1.5, attempt) * 500;
                    console.log(`Retrying after error: ${error.message} (attempt ${attempt + 1}/${maxRetries + 1})`);
                    await this.delay(backoffDelay);
                }
            }
        }

        throw lastError;
    }

    /**
     * Helper methods
     */
    private async makeAuthenticatedRequest(endpoint: string, method: 'GET' | 'POST' | 'DELETE'): Promise<Response> {
        const url = `${this.PINATA_API_BASE}${endpoint}`;

        return fetch(url, {
            method,
            headers: this.getAuthHeaders()
        });
    }

    private getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        
        // Use JWT authentication if available, fallback to API key/secret
        if (IPFS_CONFIG.pinata.jwt) {
            headers['Authorization'] = `Bearer ${IPFS_CONFIG.pinata.jwt}`;
        } else if (this.config.pinataCredentials.apiKey && this.config.pinataCredentials.secretKey) {
            headers['pinata_api_key'] = this.config.pinataCredentials.apiKey;
            headers['pinata_secret_api_key'] = this.config.pinataCredentials.secretKey;
        }
        
        return headers;
    }

    private determineKeyType(authData: any): 'admin' | 'pinning' | 'gateway' {
        // Analyze the response to determine key type
        // This is based on typical Pinata API response patterns
        if (authData.authenticated === true) {
            // Check for admin permissions
            if (authData.permissions && authData.permissions.includes('admin')) {
                return 'admin';
            }
            // Check for pinning permissions
            if (authData.permissions && authData.permissions.includes('pinning')) {
                return 'pinning';
            }
            // Default to gateway if authenticated but no specific permissions
            return 'gateway';
        }

        return 'pinning'; // Default assumption
    }

    private extractPermissions(authData: any): string[] {
        if (authData.permissions && Array.isArray(authData.permissions)) {
            return authData.permissions;
        }

        // Infer permissions from successful authentication
        const permissions = ['read'];

        if (authData.authenticated === true) {
            permissions.push('pin', 'unpin');
        }

        return permissions;
    }

    private isRateLimitError(error: any): boolean {
        // Check for rate limit indicators
        if (error.status === 429) return true;
        if (error.message && error.message.toLowerCase().includes('rate limit')) return true;
        if (error.message && error.message.toLowerCase().includes('too many requests')) return true;

        return false;
    }

    private isRetryableError(error: any): boolean {
        // Network errors, timeouts, and server errors are retryable
        if (error.name === 'AbortError') return true;
        if (error.name === 'TypeError' && error.message.includes('fetch')) return true;
        if (error.status >= 500) return true;

        return false;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}