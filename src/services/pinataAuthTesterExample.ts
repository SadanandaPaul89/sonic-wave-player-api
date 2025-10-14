/**
 * Example usage of PinataAuthTester
 * Demonstrates how to use the authentication testing functionality
 */

import { PinataAuthTester } from './pinataAuthTester';
import { PinataTestConfigManager } from './pinataTestConfig';

/**
 * Example: Basic authentication testing
 */
export async function exampleBasicAuthTest(): Promise<void> {
  console.log('=== Pinata Authentication Test Example ===\n');

  try {
    // Initialize configuration
    const configManager = PinataTestConfigManager.getInstance();
    await configManager.loadConfiguration();
    configManager.loadRunnerConfiguration();

    // Create authentication tester
    const authTester = new PinataAuthTester();

    // Run individual tests
    console.log('1. Testing API credentials...');
    const credentialsResult = await authTester.testCredentials();
    console.log('Credentials test result:', {
      valid: credentialsResult.valid,
      keyType: credentialsResult.keyType,
      permissions: credentialsResult.permissions
    });

    console.log('\n2. Testing API connectivity...');
    const connectivityResult = await authTester.testConnectivity();
    console.log('Connectivity test result:', {
      connected: connectivityResult.connected,
      responseTime: `${connectivityResult.responseTime.toFixed(2)}ms`,
      error: connectivityResult.error
    });

    console.log('\n3. Testing API limits...');
    const limitsResult = await authTester.validateApiLimits();
    console.log('API limits result:', {
      currentUsage: limitsResult.currentUsage,
      monthlyLimit: limitsResult.monthlyLimit,
      remainingQuota: limitsResult.remainingQuota,
      resetDate: new Date(limitsResult.resetDate).toLocaleDateString()
    });

    console.log('\n=== Individual Tests Complete ===\n');

  } catch (error) {
    console.error('Error running authentication tests:', error);
  }
}

/**
 * Example: Comprehensive authentication test
 */
export async function exampleComprehensiveAuthTest(): Promise<void> {
  console.log('=== Comprehensive Authentication Test ===\n');

  try {
    // Initialize configuration
    const configManager = PinataTestConfigManager.getInstance();
    await configManager.loadConfiguration();
    configManager.loadRunnerConfiguration();

    // Create authentication tester
    const authTester = new PinataAuthTester();

    // Run comprehensive test
    console.log('Running comprehensive authentication test...');
    const result = await authTester.runAuthenticationTest();

    console.log('\nTest Result Summary:');
    console.log(`- Test Name: ${result.testName}`);
    console.log(`- Status: ${result.status}`);
    console.log(`- Duration: ${result.duration.toFixed(2)}ms`);
    
    if (result.error) {
      console.log(`- Error: ${result.error}`);
    }

    if (result.metrics) {
      console.log(`- API Response Time: ${result.metrics.apiResponseTime.toFixed(2)}ms`);
      console.log(`- Success Rate: ${result.metrics.successRate}%`);
    }

    console.log('\nDetailed Results:');
    if (result.details.credentials) {
      console.log('- Credentials:', {
        valid: result.details.credentials.valid,
        keyType: result.details.credentials.keyType,
        permissions: result.details.credentials.permissions.length
      });
    }

    if (result.details.connectivity) {
      console.log('- Connectivity:', {
        connected: result.details.connectivity.connected,
        responseTime: `${result.details.connectivity.responseTime.toFixed(2)}ms`
      });
    }

    if (result.details.apiLimits) {
      console.log('- API Limits:', {
        usage: `${result.details.apiLimits.currentUsage}/${result.details.apiLimits.monthlyLimit}`,
        remaining: result.details.apiLimits.remainingQuota
      });
    }

    console.log('\n=== Comprehensive Test Complete ===\n');

  } catch (error) {
    console.error('Error running comprehensive authentication test:', error);
  }
}

/**
 * Example: Test with retry logic
 */
export async function exampleRetryLogicTest(): Promise<void> {
  console.log('=== Retry Logic Test Example ===\n');

  try {
    // Initialize configuration
    const configManager = PinataTestConfigManager.getInstance();
    await configManager.loadConfiguration();
    configManager.loadRunnerConfiguration();

    // Create authentication tester
    const authTester = new PinataAuthTester();

    console.log('Testing retry logic with connectivity test...');
    
    // Use the retry mechanism
    const result = await authTester.testWithRetry(
      async () => {
        return await authTester.testConnectivity();
      },
      3 // Max 3 retries
    );

    console.log('Retry test result:', {
      connected: result.connected,
      responseTime: `${result.responseTime.toFixed(2)}ms`,
      error: result.error
    });

    console.log('\n=== Retry Logic Test Complete ===\n');

  } catch (error) {
    console.error('Error testing retry logic:', error);
  }
}

/**
 * Example: Full test suite using the base runner
 */
export async function exampleFullTestSuite(): Promise<void> {
  console.log('=== Full Authentication Test Suite ===\n');

  try {
    // Initialize configuration
    const configManager = PinataTestConfigManager.getInstance();
    await configManager.loadConfiguration();
    configManager.loadRunnerConfiguration();

    // Create authentication tester
    const authTester = new PinataAuthTester();

    console.log('Running full authentication test suite...');
    const suiteResult = await authTester.runTests();

    console.log('\nTest Suite Results:');
    console.log(`- Overall Status: ${suiteResult.overall}`);
    console.log(`- Total Duration: ${suiteResult.duration.toFixed(2)}ms`);
    console.log(`- Timestamp: ${suiteResult.timestamp}`);

    console.log('\nTest Summary:');
    console.log(`- Total Tests: ${suiteResult.summary.totalTests}`);
    console.log(`- Passed: ${suiteResult.summary.passed}`);
    console.log(`- Failed: ${suiteResult.summary.failed}`);
    console.log(`- Skipped: ${suiteResult.summary.skipped}`);
    console.log(`- Success Rate: ${suiteResult.summary.successRate.toFixed(1)}%`);

    console.log('\nIndividual Test Results:');
    suiteResult.tests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.testName}`);
      console.log(`   Status: ${test.status}`);
      console.log(`   Duration: ${test.duration.toFixed(2)}ms`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });

    console.log('\n=== Full Test Suite Complete ===\n');

  } catch (error) {
    console.error('Error running full test suite:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllAuthExamples(): Promise<void> {
  console.log('🚀 Running all Pinata Authentication Test examples...\n');

  await exampleBasicAuthTest();
  await exampleComprehensiveAuthTest();
  await exampleRetryLogicTest();
  await exampleFullTestSuite();

  console.log('✅ All authentication test examples completed!');
}

// Individual functions are already exported above