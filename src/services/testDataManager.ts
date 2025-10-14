/**
 * Test Data Manager for Pinata API testing
 * Handles generation, validation, and cleanup of test data
 */

import { TestMetadata, ValidationResult } from '../types/pinataTest';

export class TestDataManager {
  private static instance: TestDataManager;
  private generatedFiles: Map<string, File> = new Map();
  private testMetadata: Map<string, TestMetadata> = new Map();

  private constructor() {}

  public static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  /**
   * Generate test audio files of various formats and sizes
   */
  public async generateTestAudioFiles(): Promise<File[]> {
    const files: File[] = [];
    
    // Generate different audio formats
    const formats = [
      { ext: 'mp3', type: 'audio/mpeg', header: [0xFF, 0xFB] },
      { ext: 'wav', type: 'audio/wav', header: [0x52, 0x49, 0x46, 0x46] },
      { ext: 'flac', type: 'audio/flac', header: [0x66, 0x4C, 0x61, 0x43] },
      { ext: 'm4a', type: 'audio/mp4', header: [0x00, 0x00, 0x00, 0x20] },
    ];

    // Generate different file sizes (in KB)
    const sizes = [100, 500, 1024, 5120]; // 100KB, 500KB, 1MB, 5MB

    for (const format of formats) {
      for (const sizeKB of sizes) {
        const file = await this.generateAudioFile(
          `test-${format.ext}-${sizeKB}kb`,
          format.ext,
          format.type,
          sizeKB * 1024,
          format.header
        );
        files.push(file);
        this.generatedFiles.set(file.name, file);
      }
    }

    return files;
  }

  /**
   * Generate a single audio file with specified parameters
   */
  public async generateAudioFile(
    name: string,
    extension: string,
    mimeType: string,
    sizeBytes: number,
    headerBytes?: number[]
  ): Promise<File> {
    const buffer = new ArrayBuffer(sizeBytes);
    const view = new Uint8Array(buffer);

    // Add format-specific header if provided
    if (headerBytes) {
      for (let i = 0; i < Math.min(headerBytes.length, sizeBytes); i++) {
        view[i] = headerBytes[i];
      }
    }

    // Fill the rest with pseudo-random audio-like data
    for (let i = headerBytes?.length || 0; i < sizeBytes; i++) {
      // Generate sine wave-like pattern for more realistic audio data
      const frequency = 440; // A4 note
      const sampleRate = 44100;
      const amplitude = 127;
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * amplitude + 128;
      view[i] = Math.floor(sample) % 256;
    }

    const fileName = `${name}.${extension}`;
    const file = new File([buffer], fileName, { type: mimeType });
    
    // Store metadata
    const metadata = this.createTestMetadata(file);
    this.testMetadata.set(fileName, metadata);
    
    return file;
  }

  /**
   * Create test metadata for a file
   */
  public createTestMetadata(file: File): TestMetadata {
    const testId = this.generateTestId();
    
    return {
      testId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadTimestamp: new Date().toISOString(),
      testPurpose: 'Pinata API testing',
      expectedDuration: this.estimateTestDuration(file.size),
    };
  }

  /**
   * Validate a test file
   */
  public validateTestFile(file: File): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size === 0) {
      errors.push('File is empty');
    }
    if (file.size > 100 * 1024 * 1024) { // 100MB
      warnings.push('File is very large and may take a long time to upload');
    }

    // Check file type
    const supportedTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/flac',
      'audio/mp4',
      'audio/ogg',
      'audio/webm',
    ];

    if (!supportedTypes.includes(file.type)) {
      warnings.push(`File type ${file.type} may not be supported`);
    }

    // Check file name
    if (!file.name || file.name.trim() === '') {
      errors.push('File name is required');
    }
    if (file.name.length > 255) {
      warnings.push('File name is very long');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate corrupted test files for error testing
   */
  public async generateCorruptedFiles(): Promise<File[]> {
    const corruptedFiles: File[] = [];

    // Empty file
    const emptyFile = new File([], 'corrupted-empty.mp3', { type: 'audio/mpeg' });
    corruptedFiles.push(emptyFile);

    // File with wrong header
    const wrongHeaderBuffer = new ArrayBuffer(1024);
    const wrongHeaderView = new Uint8Array(wrongHeaderBuffer);
    wrongHeaderView.fill(0xFF); // Invalid header
    const wrongHeaderFile = new File([wrongHeaderBuffer], 'corrupted-header.mp3', { type: 'audio/mpeg' });
    corruptedFiles.push(wrongHeaderFile);

    // Truncated file (header only)
    const truncatedBuffer = new ArrayBuffer(10);
    const truncatedView = new Uint8Array(truncatedBuffer);
    truncatedView[0] = 0xFF;
    truncatedView[1] = 0xFB; // Valid MP3 header but truncated
    const truncatedFile = new File([truncatedBuffer], 'corrupted-truncated.mp3', { type: 'audio/mpeg' });
    corruptedFiles.push(truncatedFile);

    // File with invalid MIME type
    const validBuffer = new ArrayBuffer(1024);
    const validView = new Uint8Array(validBuffer);
    validView[0] = 0xFF;
    validView[1] = 0xFB;
    const invalidMimeFile = new File([validBuffer], 'corrupted-mime.mp3', { type: 'text/plain' });
    corruptedFiles.push(invalidMimeFile);

    return corruptedFiles;
  }

  /**
   * Get metadata for a test file
   */
  public getTestMetadata(fileName: string): TestMetadata | undefined {
    return this.testMetadata.get(fileName);
  }

  /**
   * Get all generated files
   */
  public getGeneratedFiles(): File[] {
    return Array.from(this.generatedFiles.values());
  }

  /**
   * Clean up generated test files and metadata
   */
  public cleanup(): void {
    this.generatedFiles.clear();
    this.testMetadata.clear();
  }

  /**
   * Get file statistics
   */
  public getFileStatistics(): {
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    fileTypes: Record<string, number>;
  } {
    const files = Array.from(this.generatedFiles.values());
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;
    
    const fileTypes: Record<string, number> = {};
    files.forEach(file => {
      fileTypes[file.type] = (fileTypes[file.type] || 0) + 1;
    });

    return {
      totalFiles,
      totalSize,
      averageSize,
      fileTypes,
    };
  }

  /**
   * Create test files for specific scenarios
   */
  public async createScenarioFiles(): Promise<{
    small: File[];
    medium: File[];
    large: File[];
    corrupted: File[];
  }> {
    const small = await Promise.all([
      this.generateAudioFile('small-mp3', 'mp3', 'audio/mpeg', 100 * 1024), // 100KB
      this.generateAudioFile('small-wav', 'wav', 'audio/wav', 150 * 1024), // 150KB
    ]);

    const medium = await Promise.all([
      this.generateAudioFile('medium-mp3', 'mp3', 'audio/mpeg', 2 * 1024 * 1024), // 2MB
      this.generateAudioFile('medium-flac', 'flac', 'audio/flac', 3 * 1024 * 1024), // 3MB
    ]);

    const large = await Promise.all([
      this.generateAudioFile('large-wav', 'wav', 'audio/wav', 15 * 1024 * 1024), // 15MB
      this.generateAudioFile('large-flac', 'flac', 'audio/flac', 20 * 1024 * 1024), // 20MB
    ]);

    const corrupted = await this.generateCorruptedFiles();

    return { small, medium, large, corrupted };
  }

  /**
   * Generate a unique test ID
   */
  private generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Estimate test duration based on file size
   */
  private estimateTestDuration(fileSize: number): number {
    // Rough estimation: 1MB per second upload + processing time
    const uploadTime = (fileSize / (1024 * 1024)) * 1000; // ms
    const processingTime = 2000; // 2 seconds base processing time
    return Math.ceil(uploadTime + processingTime);
  }
}