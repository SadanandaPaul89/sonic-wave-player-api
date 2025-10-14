/**
 * Main Pinata Test Controller
 * Central orchestrator for all Pinata API tests
 */

import { 
  TestSuiteResult, 
  TestType, 
  TestResult,
  TestConfiguration,
  TestRunnerConfig
} from '../types/pinataTest';
import { PinataTestConfigManager } from './pinataTestConfig';
import { BasePinataTestRunner } from './pinataTestRunner';

export class PinataTestController {
  private static instance: PinataTestController;
  private configManager: PinataTestConfigManager;
  private testHistory: TestSuiteResult[] = [];
  private scheduledTests: NodeJS.Timeout | null = null;

  private constructor() {
    this.configManager = PinataTestConfigManager.getInstance();
  }

  public static getInstance(): PinataTestController {
    if (!PinataTestController.instance) {
      PinataTestController.instance = new PinataTestController();
    }
    return PinataTestController.instance;
  }

  /**
   * Initialize the test controller
   */
  public async initialize(): Promise<void> {
    try {
      await this.configManager.loadConfiguration();
      this.configManager.loadRunnerConfiguration();
      
      const validation = this.configManager.validateConfiguration();
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      console.log('Pinata Test Controller initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Pinata Test Controller:', error);
      throw error;
    }
  }

  /**
   * Run the complete test suite
   */
  public async runFullTestSuite(): Promise<TestSuiteResult> {
    console.log('Starting full Pinata API test suite...');
    
    const startTime = Date.now();
    const allResults: TestResult[] = [];
    
    try {
      // Get configuration
      const config = this.configManager.getConfiguration();
      const runnerConfig = this.configManager.getRunnerConfiguration();
      
      if (!config || !runnerConfig) {
        throw new Error('Configuration not loaded');
      }

      // Create a mock test runner for now (will be replaced by actual implementations)
      const mockRunner = new MockPinataTestRunner();
      const suiteResult = await mockRunner.runTests();
      
      // Store in history
      this.testHistory.push(suiteResult);
      
      // Keep only last 50 test results
      if (this.testHistory.length > 50) {
        this.testHistory = this.testHistory.slice(-50);
      }

      console.log(`Test suite completed in ${suiteResult.duration}ms with status: ${suiteResult.overall}`);
      return suiteResult;

    } catch (error) {
      const errorResult: TestSuiteResult = {
        overall: 'fail',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        tests: [{
          testName: 'Test Suite Initialization',
          status: 'fail',
          duration: Date.now() - startTime,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
        summary: {
          totalTests: 1,
          passed: 0,
          failed: 1,
          skipped: 0,
          successRate: 0,
        },
      };

      this.testHistory.push(errorResult);
      return errorResult;
    }
  }

  /**
   * Run a specific type of test
   */
  public async runSpecificTest(testType: TestType): Promise<TestResult> {
    console.log(`Running specific test: ${testType}`);
    
    const startTime = Date.now();
    
    try {
      // Create appropriate test runner based on type
      const runner = this.createTestRunner(testType);
      const suiteResult = await runner.runTests();
      
      // Return the first result (since we're running a specific test)
      return suiteResult.tests[0] || {
        testName: testType,
        status: 'skip',
        duration: Date.now() - startTime,
        details: { message: 'No test implementation found' },
      };

    } catch (error) {
      return {
        testName: testType,
        status: 'fail',
        duration: Date.now() - startTime,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Schedule periodic test execution
   */
  public schedulePeriodicTests(intervalMs: number): void {
    // Clear existing scheduled tests
    if (this.scheduledTests) {
      clearInterval(this.scheduledTests);
    }

    console.log(`Scheduling periodic tests every ${intervalMs}ms`);
    
    this.scheduledTests = setInterval(async () => {
      try {
        console.log('Running scheduled test suite...');
        await this.runFullTestSuite();
      } catch (error) {
        console.error('Scheduled test execution failed:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop scheduled tests
   */
  public stopScheduledTests(): void {
    if (this.scheduledTests) {
      clearInterval(this.scheduledTests);
      this.scheduledTests = null;
      console.log('Scheduled tests stopped');
    }
  }

  /**
   * Get test execution history
   */
  public getTestHistory(): TestSuiteResult[] {
    return [...this.testHistory];
  }

  /**
   * Get the latest test results
   */
  public getLatestResults(): TestSuiteResult | null {
    return this.testHistory.length > 0 ? this.testHistory[this.testHistory.length - 1] : null;
  }

  /**
   * Clear test history
   */
  public clearHistory(): void {
    this.testHistory = [];
    console.log('Test history cleared');
  }

  /**
   * Get test statistics
   */
  public getTestStatistics(): {
    totalRuns: number;
    averageSuccessRate: number;
    averageDuration: number;
    lastRunStatus: string;
  } {
    if (this.testHistory.length === 0) {
      return {
        totalRuns: 0,
        averageSuccessRate: 0,
        averageDuration: 0,
        lastRunStatus: 'none',
      };
    }

    const totalRuns = this.testHistory.length;
    const averageSuccessRate = this.testHistory.reduce((sum, result) => 
      sum + result.summary.successRate, 0) / totalRuns;
    const averageDuration = this.testHistory.reduce((sum, result) => 
      sum + result.duration, 0) / totalRuns;
    const lastRunStatus = this.testHistory[this.testHistory.length - 1].overall;

    return {
      totalRuns,
      averageSuccessRate,
      averageDuration,
      lastRunStatus,
    };
  }

  /**
   * Export test results as JSON
   */
  public exportResults(includeHistory: boolean = false): string {
    const data = {
      latestResults: this.getLatestResults(),
      statistics: this.getTestStatistics(),
      ...(includeHistory && { history: this.testHistory }),
      exportTimestamp: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Create appropriate test runner for the given test type
   */
  private createTestRunner(testType: TestType): BasePinataTestRunner {
    // For now, return a mock runner
    // In future tasks, this will create specific runners for each test type
    return new MockPinataTestRunner();
  }
}

/**
 * Mock test runner for initial implementation
 * Will be replaced by actual test runners in subsequent tasks
 */
class MockPinataTestRunner extends BasePinataTestRunner {
  protected getTestType(): TestType {
    return 'authentication';
  }

  protected async runSpecificTests(): Promise<TestResult[]> {
    // Mock test implementation
    const tests = [
      {
        name: 'Configuration Validation',
        fn: async () => {
          const configManager = PinataTestConfigManager.getInstance();
          const validation = configManager.validateConfiguration();
          
          if (!validation.isValid) {
            throw new Error(`Configuration invalid: ${validation.errors.join(', ')}`);
          }
          
          return { 
            valid: true, 
            warnings: validation.warnings,
            message: 'Configuration validation passed'
          };
        }
      },
      {
        name: 'Test Infrastructure Setup',
        fn: async () => {
          // Simulate infrastructure setup
          await new Promise(resolve => setTimeout(resolve, 100));
          return { 
            setup: true,
            message: 'Test infrastructure initialized successfully'
          };
        }
      }
    ];

    return this.runMultipleTests(tests);
  }
}