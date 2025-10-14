/**
 * Core TypeScript interfaces for Pinata API testing infrastructure
 * Defines all test components, results, and configuration types
 */

// Base test result interface
export interface TestResult {
  testName: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  details: any;
  error?: string;
  metrics?: PerformanceMetrics;
}

// Test suite result interface
export interface TestSuiteResult {
  overall: 'pass' | 'fail' | 'warning';
  timestamp: string;
  duration: number;
  tests: TestResult[];
  summary: TestSummary;
}

// Test summary interface
export interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  successRate: number;
}

// Test types enumeration
export type TestType = 
  | 'authentication'
  | 'upload'
  | 'retrieval'
  | 'pinning'
  | 'metadata'
  | 'performance'
  | 'error-handling';

// Performance metrics interface
export interface PerformanceMetrics {
  uploadSpeed: number; // MB/s
  downloadSpeed: number; // MB/s
  gatewayLatency: number; // ms
  apiResponseTime: number; // ms
  successRate: number; // percentage
}

// Authentication test result
export interface AuthTestResult {
  valid: boolean;
  keyType: 'admin' | 'pinning' | 'gateway';
  permissions: string[];
  expirationDate?: string;
}

// Connectivity test result
export interface ConnectivityResult {
  connected: boolean;
  responseTime: number;
  error?: string;
}

// API limits result
export interface ApiLimitsResult {
  currentUsage: number;
  monthlyLimit: number;
  remainingQuota: number;
  resetDate: string;
}

// Upload test result
export interface UploadTestResult {
  success: boolean;
  ipfsHash?: string;
  uploadTime: number;
  fileSize: number;
  metadata?: PinataMetadata;
  error?: string;
}

// Batch upload result
export interface BatchUploadResult {
  totalFiles: number;
  successfulUploads: number;
  failedUploads: number;
  results: UploadTestResult[];
  totalTime: number;
}

// Large file upload result
export interface LargeFileResult {
  success: boolean;
  ipfsHash?: string;
  uploadTime: number;
  fileSize: number;
  chunksUsed?: number;
  error?: string;
}

// Metadata upload result
export interface MetadataUploadResult {
  success: boolean;
  metadataSize: number;
  uploadTime: number;
  error?: string;
}

// Retrieval test result
export interface RetrievalResult {
  accessible: boolean;
  responseTime: number;
  fileSize: number;
  contentType: string;
  gateway: string;
  error?: string;
}

// Gateway performance result
export interface GatewayPerformanceResult {
  gatewayResults: Array<{
    gateway: string;
    responseTime: number;
    success: boolean;
    error?: string;
  }>;
  fastestGateway: string;
  averageResponseTime: number;
}

// Streaming test result
export interface StreamingResult {
  supportsRangeRequests: boolean;
  streamingLatency: number;
  bufferEfficiency: number;
  error?: string;
}

// Cache efficiency result
export interface CacheResult {
  cacheHitRate: number;
  averageCacheResponseTime: number;
  cacheMissResponseTime: number;
  efficiency: number;
}

// Pin operation result
export interface PinResult {
  success: boolean;
  pinDate?: string;
  pinSize?: number;
  error?: string;
}

// Unpin operation result
export interface UnpinResult {
  success: boolean;
  unpinDate?: string;
  error?: string;
}

// Pin status result
export interface PinStatusResult {
  isPinned: boolean;
  pinDate?: string;
  pinSize?: number;
  metadata?: any;
}

// Pin list result
export interface PinListResult {
  totalPins: number;
  pins: Array<{
    ipfsHash: string;
    pinDate: string;
    size: number;
    metadata?: any;
  }>;
  totalSize: number;
}

// Upload options interface
export interface UploadOptions {
  customMetadata?: Record<string, any>;
  pinataOptions?: PinataOptions;
  progressCallback?: (progress: number) => void;
}

// Pinata options interface
export interface PinataOptions {
  cidVersion?: 0 | 1;
  wrapWithDirectory?: boolean;
  customPinPolicy?: {
    regions: Array<{
      id: string;
      desiredReplicationCount: number;
    }>;
  };
}

// Pinata metadata interface
export interface PinataMetadata {
  name?: string;
  keyvalues?: Record<string, string | number>;
}

// Performance report interface
export interface PerformanceReport {
  timestamp: string;
  metrics: PerformanceMetrics;
  trends: PerformanceTrends;
  recommendations: string[];
}

// Performance trends interface
export interface PerformanceTrends {
  uploadSpeedTrend: 'improving' | 'declining' | 'stable';
  latencyTrend: 'improving' | 'declining' | 'stable';
  successRateTrend: 'improving' | 'declining' | 'stable';
  comparisonPeriod: string;
}

// Upload speed measurement
export interface UploadSpeed {
  mbps: number;
  category: 'slow' | 'average' | 'fast' | 'excellent';
}

// Latency result
export interface LatencyResult {
  gateway: string;
  latency: number;
  status: 'excellent' | 'good' | 'poor' | 'timeout';
}

// API performance result
export interface ApiPerformanceResult {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
}

// Test metadata interface
export interface TestMetadata {
  testId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadTimestamp: string;
  testPurpose: string;
  expectedDuration?: number;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Error categories
export type ErrorCategory = 
  | 'authentication'
  | 'upload'
  | 'retrieval'
  | 'pinning'
  | 'network'
  | 'validation'
  | 'quota'
  | 'unknown';

// Failed operation interface
export interface FailedOperation {
  operation: string;
  parameters: any;
  error: Error;
  retryCount: number;
  maxRetries: number;
}

// Test configuration interface
export interface TestConfiguration {
  pinataCredentials: {
    apiKey: string;
    secretKey: string;
  };
  testFiles: {
    small: File; // < 1MB
    medium: File; // 1-10MB
    large: File; // > 10MB
    formats: File[]; // Various audio formats
  };
  gateways: string[];
  performanceBaselines: {
    maxUploadTime: number;
    maxRetrievalTime: number;
    minSuccessRate: number;
  };
  testOptions: {
    retryAttempts: number;
    timeoutDuration: number;
    concurrentUploads: number;
  };
}

// Test runner configuration
export interface TestRunnerConfig {
  testTypes: TestType[];
  parallel: boolean;
  timeout: number;
  retries: number;
  verbose: boolean;
}

// Test execution context
export interface TestExecutionContext {
  testId: string;
  startTime: number;
  configuration: TestConfiguration;
  results: TestResult[];
  currentTest?: string;
}