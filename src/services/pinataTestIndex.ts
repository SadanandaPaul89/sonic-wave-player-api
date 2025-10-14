/**
 * Pinata API Testing Infrastructure - Main Export Index
 * Provides centralized access to all testing components
 */

// Core types and interfaces
export * from '../types/pinataTest';

// Configuration management
export { PinataTestConfigManager } from './pinataTestConfig';

// Base test runner
export { BasePinataTestRunner } from './pinataTestRunner';

// Main test controller
export { PinataTestController } from './pinataTestController';

// Test data management
export { TestDataManager } from './testDataManager';

// Authentication tester
export { PinataAuthTester } from './pinataAuthTester';

// Authentication tester examples
export * from './pinataAuthTesterExample';

// Import the classes for use in convenience functions
import { PinataTestController } from './pinataTestController';
import { PinataTestConfigManager } from './pinataTestConfig';

// Convenience function to initialize the testing system
export async function initializePinataTestingSystem(): Promise<PinataTestController> {
  const controller = PinataTestController.getInstance();
  await controller.initialize();
  return controller;
}

// Convenience function to create a quick test configuration
export async function createQuickTestConfig(): Promise<void> {
  const configManager = PinataTestConfigManager.getInstance();
  await configManager.loadConfiguration();
  configManager.loadRunnerConfiguration();
  
  const validation = configManager.validateConfiguration();
  if (!validation.isValid) {
    console.warn('Configuration validation warnings:', validation.warnings);
    throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
  }
  
  console.log('Quick test configuration created successfully');
}

// Convenience function to run a basic health check
export async function runBasicHealthCheck(): Promise<boolean> {
  try {
    const controller = await initializePinataTestingSystem();
    const result = await controller.runSpecificTest('authentication');
    return result.status === 'pass';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}