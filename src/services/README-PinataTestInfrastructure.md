# Pinata API Testing Infrastructure

This directory contains the core testing infrastructure for Pinata API integration testing. The system provides comprehensive testing capabilities for authentication, file uploads, retrieval, pinning operations, and performance monitoring.

## Core Components

### 1. Type Definitions (`pinataTest.ts`)
- **TestResult**: Individual test execution results
- **TestSuiteResult**: Complete test suite execution results
- **TestConfiguration**: System configuration and credentials
- **PerformanceMetrics**: Performance measurement data
- **Various specialized result types**: For authentication, uploads, retrieval, etc.

### 2. Configuration Management (`pinataTestConfig.ts`)
- **PinataTestConfigManager**: Singleton class for configuration management
- Loads configuration from environment variables
- Validates configuration completeness and correctness
- Generates test files and manages test data
- Supports environment-specific overrides

### 3. Base Test Runner (`pinataTestRunner.ts`)
- **BasePinataTestRunner**: Abstract base class for all test runners
- Provides common functionality: timing, error handling, retries
- Implements performance measurement and error categorization
- Supports parallel and sequential test execution
- Includes exponential backoff retry logic

### 4. Test Controller (`pinataTestController.ts`)
- **PinataTestController**: Main orchestrator for all tests
- Manages test execution lifecycle
- Provides test scheduling and history tracking
- Exports test results and statistics
- Singleton pattern for centralized control

### 5. Test Data Manager (`testDataManager.ts`)
- **TestDataManager**: Handles test file generation and validation
- Creates audio files of various formats and sizes
- Generates corrupted files for error testing
- Validates file integrity and format compliance
- Manages test metadata and cleanup

### 6. Main Export Index (`pinataTestIndex.ts`)
- Centralized export point for all testing components
- Provides convenience functions for common operations
- Includes system initialization and health check utilities

### 7. Usage Examples (`pinataTestExample.ts`)
- Comprehensive examples of how to use the testing system
- Demonstrates configuration management, test execution, and data generation
- Shows scheduled testing and health check implementations

## Quick Start

```typescript
import { initializePinataTestingSystem, runBasicHealthCheck } from './pinataTestIndex';

// Initialize the testing system
const controller = await initializePinataTestingSystem();

// Run a complete test suite
const results = await controller.runFullTestSuite();
console.log('Test results:', results.summary);

// Run a health check
const isHealthy = await runBasicHealthCheck();
console.log('System healthy:', isHealthy);
```

## Configuration

The system requires the following environment variables:
- `VITE_PINATA_API_KEY`: Your Pinata API key
- `VITE_PINATA_SECRET_KEY`: Your Pinata secret key

## Features

### Test Types Supported
- **Authentication**: API key validation and connectivity testing
- **Upload**: File upload testing with various formats and sizes
- **Retrieval**: File retrieval and gateway performance testing
- **Pinning**: Pin/unpin operations and status checking
- **Metadata**: Metadata handling and search functionality
- **Performance**: Speed and efficiency measurements
- **Error Handling**: Edge cases and failure scenarios

### Performance Monitoring
- Upload/download speed measurement
- Gateway latency comparison
- API response time tracking
- Success rate calculation
- Trend analysis and recommendations

### Error Handling
- Automatic retry with exponential backoff
- Error categorization and classification
- Fallback mechanisms for failed operations
- Comprehensive error reporting

### Test Data Management
- Automatic generation of test audio files
- Support for multiple audio formats (MP3, WAV, FLAC, M4A)
- Various file sizes for performance testing
- Corrupted file generation for error testing
- Metadata validation and cleanup

## Architecture

The system follows a modular architecture with clear separation of concerns:

1. **Configuration Layer**: Manages settings and validation
2. **Execution Layer**: Handles test running and orchestration
3. **Data Layer**: Manages test files and metadata
4. **Results Layer**: Processes and stores test outcomes
5. **Utility Layer**: Provides common functionality and helpers

## Next Steps

This infrastructure provides the foundation for implementing specific test runners:
- Authentication Tester (Task 2.1)
- Upload Tester (Task 3.1)
- Retrieval Tester (Task 4.1)
- Pinning Tester (Task 5.1)
- Performance Monitor (Task 7.1)
- Error Handler (Task 8.1)

Each specific tester will extend the `BasePinataTestRunner` class and implement the `runSpecificTests()` method for their particular testing domain.

## Testing the Infrastructure

To test the infrastructure itself, you can run the examples:

```typescript
import { examples } from './pinataTestExample';

// Run all examples
await examples.all();

// Or run specific examples
await examples.config();
await examples.data();
await examples.basic();
```

This will validate that all components are working correctly and provide sample output for each major functionality area.