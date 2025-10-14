/**
 * Test configuration management system for Pinata API testing
 * Handles loading, validation, and management of test configurations
 */

import { TestConfiguration, TestRunnerConfig, ValidationResult } from '../types/pinataTest';

export class PinataTestConfigManager {
  private static instance: PinataTestConfigManager;
  private config: TestConfiguration | null = null;
  private runnerConfig: TestRunnerConfig | null = null;

  private constructor() {}

  public static getInstance(): PinataTestConfigManager {
    if (!PinataTestConfigManager.instance) {
      PinataTestConfigManager.instance = new PinataTestConfigManager();
    }
    return PinataTestConfigManager.instance;
  }

  /**
   * Load test configuration from environment variables and defaults
   */
  public async loadConfiguration(): Promise<TestConfiguration> {
    const config: TestConfiguration = {
      pinataCredentials: {
        apiKey: process.env.VITE_PINATA_API_KEY || '',
        secretKey: process.env.VITE_PINATA_SECRET_KEY || '',
      },
      testFiles: {
        small: await this.generateTestFile('small', 0.5), // 0.5MB
        medium: await this.generateTestFile('medium', 5), // 5MB
        large: await this.generateTestFile('large', 15), // 15MB
        formats: await this.generateAudioFormatFiles(),
      },
      gateways: [
        'https://gateway.pinata.cloud',
        'https://ipfs.io',
        'https://cloudflare-ipfs.com',
        'https://dweb.link',
      ],
      performanceBaselines: {
        maxUploadTime: 30000, // 30 seconds
        maxRetrievalTime: 5000, // 5 seconds
        minSuccessRate: 95, // 95%
      },
      testOptions: {
        retryAttempts: 3,
        timeoutDuration: 60000, // 60 seconds
        concurrentUploads: 3,
      },
    };

    this.config = config;
    return config;
  }

  /**
   * Load test runner configuration
   */
  public loadRunnerConfiguration(): TestRunnerConfig {
    const runnerConfig: TestRunnerConfig = {
      testTypes: ['authentication', 'upload', 'retrieval', 'pinning', 'metadata', 'performance'],
      parallel: true,
      timeout: 300000, // 5 minutes
      retries: 2,
      verbose: process.env.NODE_ENV === 'development',
    };

    this.runnerConfig = runnerConfig;
    return runnerConfig;
  }

  /**
   * Validate the current configuration
   */
  public validateConfiguration(config?: TestConfiguration): ValidationResult {
    const configToValidate = config || this.config;
    
    if (!configToValidate) {
      return {
        isValid: false,
        errors: ['Configuration not loaded'],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate Pinata credentials
    if (!configToValidate.pinataCredentials.apiKey) {
      errors.push('Pinata API key is required');
    }
    if (!configToValidate.pinataCredentials.secretKey) {
      errors.push('Pinata secret key is required');
    }

    // Validate test files
    if (!configToValidate.testFiles.small) {
      warnings.push('Small test file not configured');
    }
    if (!configToValidate.testFiles.medium) {
      warnings.push('Medium test file not configured');
    }
    if (!configToValidate.testFiles.large) {
      warnings.push('Large test file not configured');
    }

    // Validate gateways
    if (configToValidate.gateways.length === 0) {
      warnings.push('No IPFS gateways configured');
    }

    // Validate performance baselines
    if (configToValidate.performanceBaselines.maxUploadTime <= 0) {
      errors.push('Max upload time must be positive');
    }
    if (configToValidate.performanceBaselines.minSuccessRate < 0 || 
        configToValidate.performanceBaselines.minSuccessRate > 100) {
      errors.push('Min success rate must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get the current configuration
   */
  public getConfiguration(): TestConfiguration | null {
    return this.config;
  }

  /**
   * Get the current runner configuration
   */
  public getRunnerConfiguration(): TestRunnerConfig | null {
    return this.runnerConfig;
  }

  /**
   * Update configuration values
   */
  public updateConfiguration(updates: Partial<TestConfiguration>): void {
    if (this.config) {
      this.config = { ...this.config, ...updates };
    }
  }

  /**
   * Reset configuration to defaults
   */
  public async resetConfiguration(): Promise<void> {
    this.config = null;
    this.runnerConfig = null;
    await this.loadConfiguration();
    this.loadRunnerConfiguration();
  }

  /**
   * Generate a test file of specified size (in MB)
   */
  private async generateTestFile(type: string, sizeMB: number): Promise<File> {
    const sizeBytes = sizeMB * 1024 * 1024;
    const buffer = new ArrayBuffer(sizeBytes);
    const view = new Uint8Array(buffer);
    
    // Fill with pseudo-random data to simulate audio content
    for (let i = 0; i < sizeBytes; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }

    return new File([buffer], `test-${type}-${sizeMB}mb.mp3`, {
      type: 'audio/mpeg',
    });
  }

  /**
   * Generate test files for various audio formats
   */
  private async generateAudioFormatFiles(): Promise<File[]> {
    const formats = [
      { ext: 'mp3', type: 'audio/mpeg' },
      { ext: 'wav', type: 'audio/wav' },
      { ext: 'flac', type: 'audio/flac' },
      { ext: 'm4a', type: 'audio/mp4' },
    ];

    const files: File[] = [];
    
    for (const format of formats) {
      const sizeBytes = 1024 * 1024; // 1MB
      const buffer = new ArrayBuffer(sizeBytes);
      const view = new Uint8Array(buffer);
      
      // Fill with format-specific header simulation
      for (let i = 0; i < sizeBytes; i++) {
        view[i] = Math.floor(Math.random() * 256);
      }

      const file = new File([buffer], `test-audio.${format.ext}`, {
        type: format.type,
      });
      
      files.push(file);
    }

    return files;
  }

  /**
   * Export configuration as JSON
   */
  public exportConfiguration(): string {
    if (!this.config) {
      throw new Error('No configuration loaded');
    }

    // Create a serializable version (excluding File objects)
    const exportConfig = {
      ...this.config,
      testFiles: {
        small: { name: this.config.testFiles.small.name, size: this.config.testFiles.small.size },
        medium: { name: this.config.testFiles.medium.name, size: this.config.testFiles.medium.size },
        large: { name: this.config.testFiles.large.name, size: this.config.testFiles.large.size },
        formats: this.config.testFiles.formats.map(f => ({ name: f.name, size: f.size, type: f.type })),
      },
    };

    return JSON.stringify(exportConfig, null, 2);
  }

  /**
   * Get environment-specific configuration overrides
   */
  public getEnvironmentOverrides(): Partial<TestConfiguration> {
    const overrides: Partial<TestConfiguration> = {};

    // Development environment overrides
    if (process.env.NODE_ENV === 'development') {
      overrides.testOptions = {
        retryAttempts: 1,
        timeoutDuration: 30000,
        concurrentUploads: 1,
      };
    }

    // Production environment overrides
    if (process.env.NODE_ENV === 'production') {
      overrides.performanceBaselines = {
        maxUploadTime: 60000, // More lenient in production
        maxRetrievalTime: 10000,
        minSuccessRate: 90,
      };
    }

    return overrides;
  }
}