/**
 * Example usage of Pinata API Testing Infrastructure
 * Demonstrates how to use the testing system
 */

import { 
  PinataTestController,
  PinataTestConfigManager,
  TestDataManager,
  initializePinataTestingSystem,
  createQuickTestConfig,
  runBasicHealthCheck
} from './pinataTestIndex';

/**
 * Example: Basic test execution
 */
export async function exampleBasicTest(): Promise<void> {
  console.log('=== Basic Test Example ===');
  
  try {
    // Initialize the testing system
    const controller = await initializePinataTestingSystem();
    
    // Run a full test suite
    const results = await controller.runFullTestSuite();
    
    console.log('Test Results:', {
      overall: results.overall,
      duration: `${results.duration}ms`,
      summary: results.summary,
    });
    
  } catch (error) {
    console.error('Basic test failed:', error);
  }
}

/**
 * Example: Configuration management
 */
export async function exampleConfigurationManagement(): Promise<void> {
  console.log('=== Configuration Management Example ===');
  
  try {
    const configManager = PinataTestConfigManager.getInstance();
    
    // Load configuration
    const config = await configManager.loadConfiguration();
    console.log('Configuration loaded:', {
      hasCredentials: !!config.pinataCredentials.apiKey,
      gatewayCount: config.gateways.length,
      testFileTypes: Object.keys(config.testFiles),
    });
    
    // Validate configuration
    const validation = configManager.validateConfiguration();
    console.log('Validation result:', validation);
    
    // Export configuration (without sensitive data)
    const exportedConfig = configManager.exportConfiguration();
    console.log('Configuration exported (length):', exportedConfig.length);
    
  } catch (error) {
    console.error('Configuration management failed:', error);
  }
}

/**
 * Example: Test data generation
 */
export async function exampleTestDataGeneration(): Promise<void> {
  console.log('=== Test Data Generation Example ===');
  
  try {
    const dataManager = TestDataManager.getInstance();
    
    // Generate test audio files
    const audioFiles = await dataManager.generateTestAudioFiles();
    console.log(`Generated ${audioFiles.length} test audio files`);
    
    // Create scenario-specific files
    const scenarioFiles = await dataManager.createScenarioFiles();
    console.log('Scenario files created:', {
      small: scenarioFiles.small.length,
      medium: scenarioFiles.medium.length,
      large: scenarioFiles.large.length,
      corrupted: scenarioFiles.corrupted.length,
    });
    
    // Get file statistics
    const stats = dataManager.getFileStatistics();
    console.log('File statistics:', stats);
    
    // Validate a test file
    if (audioFiles.length > 0) {
      const validation = dataManager.validateTestFile(audioFiles[0]);
      console.log('File validation:', validation);
    }
    
    // Clean up
    dataManager.cleanup();
    console.log('Test data cleaned up');
    
  } catch (error) {
    console.error('Test data generation failed:', error);
  }
}

/**
 * Example: Scheduled testing
 */
export async function exampleScheduledTesting(): Promise<void> {
  console.log('=== Scheduled Testing Example ===');
  
  try {
    const controller = await initializePinataTestingSystem();
    
    // Schedule tests to run every 5 minutes (300000ms)
    controller.schedulePeriodicTests(300000);
    console.log('Scheduled tests every 5 minutes');
    
    // Wait for a bit to see some results
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check test history
    const history = controller.getTestHistory();
    console.log(`Test history contains ${history.length} results`);
    
    // Get statistics
    const stats = controller.getTestStatistics();
    console.log('Test statistics:', stats);
    
    // Stop scheduled tests
    controller.stopScheduledTests();
    console.log('Scheduled tests stopped');
    
  } catch (error) {
    console.error('Scheduled testing failed:', error);
  }
}

/**
 * Example: Health check
 */
export async function exampleHealthCheck(): Promise<void> {
  console.log('=== Health Check Example ===');
  
  try {
    const isHealthy = await runBasicHealthCheck();
    console.log('System health check:', isHealthy ? 'PASS' : 'FAIL');
    
  } catch (error) {
    console.error('Health check failed:', error);
  }
}

/**
 * Example: Quick configuration setup
 */
export async function exampleQuickSetup(): Promise<void> {
  console.log('=== Quick Setup Example ===');
  
  try {
    await createQuickTestConfig();
    console.log('Quick configuration setup completed');
    
  } catch (error) {
    console.error('Quick setup failed:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('Running all Pinata testing examples...\n');
  
  await exampleQuickSetup();
  console.log('');
  
  await exampleConfigurationManagement();
  console.log('');
  
  await exampleTestDataGeneration();
  console.log('');
  
  await exampleBasicTest();
  console.log('');
  
  await exampleHealthCheck();
  console.log('');
  
  // Note: Skipping scheduled testing example to avoid long-running processes
  console.log('=== All Examples Completed ===');
}

// Export for easy testing
export const examples = {
  basic: exampleBasicTest,
  config: exampleConfigurationManagement,
  data: exampleTestDataGeneration,
  scheduled: exampleScheduledTesting,
  health: exampleHealthCheck,
  quickSetup: exampleQuickSetup,
  all: runAllExamples,
};