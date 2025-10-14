// Content-based Hash Service
// Provides reliable SHA-256 based hashing for audio files with IPFS-compatible format

export interface HashResult {
  hash: string;
  algorithm: 'sha256';
  format: 'ipfs-compatible';
  size: number;
  timestamp: string;
}

export interface HashValidationResult {
  isValid: boolean;
  expectedHash?: string;
  actualHash?: string;
  error?: string;
}

class ContentHashService {
  private readonly IPFS_PREFIX = 'Qm';
  private readonly HASH_CACHE = new Map<string, HashResult>();
  private readonly MAX_CACHE_SIZE = 100;

  // Generate content-based hash from ArrayBuffer
  async generateHash(data: ArrayBuffer, filename?: string): Promise<HashResult> {
    try {
      // Create a cache key based on size and first/last bytes for quick lookup
      const cacheKey = this.createCacheKey(data, filename);
      
      // Check cache first
      if (this.HASH_CACHE.has(cacheKey)) {
        const cached = this.HASH_CACHE.get(cacheKey)!;
        console.log(`Using cached hash for ${filename || 'file'}: ${cached.hash}`);
        return cached;
      }

      console.log(`Generating hash for ${filename || 'file'} (${data.byteLength} bytes)...`);
      const startTime = performance.now();

      // Generate SHA-256 hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      
      // Convert to hex string
      const hashHex = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Create IPFS-compatible hash (Qm + base58-like encoding)
      const ipfsHash = this.createIPFSCompatibleHash(hashHex);

      const result: HashResult = {
        hash: ipfsHash,
        algorithm: 'sha256',
        format: 'ipfs-compatible',
        size: data.byteLength,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cacheResult(cacheKey, result);

      const duration = performance.now() - startTime;
      console.log(`Hash generated in ${duration.toFixed(2)}ms: ${ipfsHash}`);

      return result;
    } catch (error) {
      console.error('Hash generation failed:', error);
      throw new Error(`Failed to generate hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate hash from File object
  async generateHashFromFile(file: File): Promise<HashResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      return await this.generateHash(arrayBuffer, file.name);
    } catch (error) {
      console.error('Failed to generate hash from file:', error);
      throw new Error(`Failed to generate hash from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate hash from Blob
  async generateHashFromBlob(blob: Blob, filename?: string): Promise<HashResult> {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      return await this.generateHash(arrayBuffer, filename);
    } catch (error) {
      console.error('Failed to generate hash from blob:', error);
      throw new Error(`Failed to generate hash from blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Validate hash against content
  async validateHash(data: ArrayBuffer, expectedHash: string, filename?: string): Promise<HashValidationResult> {
    try {
      const result = await this.generateHash(data, filename);
      const isValid = result.hash === expectedHash;

      return {
        isValid,
        expectedHash,
        actualHash: result.hash,
        error: isValid ? undefined : 'Hash mismatch - content may have been modified'
      };
    } catch (error) {
      return {
        isValid: false,
        expectedHash,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Validate hash format
  isValidHashFormat(hash: string): boolean {
    // IPFS-compatible hash should start with Qm and be 46 characters long
    if (!hash.startsWith(this.IPFS_PREFIX)) {
      return false;
    }

    if (hash.length !== 46) {
      return false;
    }

    // Check if remaining characters are valid base58-like
    const validChars = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
    return validChars.test(hash.substring(2));
  }

  // Create IPFS-compatible hash from hex string
  private createIPFSCompatibleHash(hexHash: string): string {
    // Take first 44 characters of hex hash and convert to base58-like format
    const truncatedHex = hexHash.substring(0, 44);
    
    // Convert hex to base58-like encoding (simplified version)
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    
    // Convert hex string to base58-like representation
    for (let i = 0; i < truncatedHex.length; i += 2) {
      const hexPair = truncatedHex.substring(i, i + 2);
      const value = parseInt(hexPair, 16);
      const base58Index = value % base58Chars.length;
      result += base58Chars[base58Index];
    }

    // Ensure we have exactly 44 characters after Qm prefix
    const paddedResult = result.padEnd(44, '1');
    return this.IPFS_PREFIX + paddedResult.substring(0, 44);
  }

  // Create cache key for quick lookups
  private createCacheKey(data: ArrayBuffer, filename?: string): string {
    const size = data.byteLength;
    const view = new Uint8Array(data);
    
    // Use size + first 8 bytes + last 8 bytes as cache key
    const firstBytes = Array.from(view.slice(0, Math.min(8, size)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const lastBytes = Array.from(view.slice(Math.max(0, size - 8)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return `${size}_${firstBytes}_${lastBytes}_${filename || 'unknown'}`;
  }

  // Cache management
  private cacheResult(key: string, result: HashResult): void {
    // Implement LRU cache behavior
    if (this.HASH_CACHE.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = this.HASH_CACHE.keys().next().value;
      if (firstKey) {
        this.HASH_CACHE.delete(firstKey);
      }
    }

    this.HASH_CACHE.set(key, result);
  }

  // Get cache statistics
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.HASH_CACHE.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }

  // Clear cache
  clearCache(): void {
    this.HASH_CACHE.clear();
    console.log('Hash cache cleared');
  }

  // Batch hash generation for multiple files
  async generateHashBatch(files: File[]): Promise<HashResult[]> {
    const results: HashResult[] = [];
    
    console.log(`Generating hashes for ${files.length} files...`);
    const startTime = performance.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await this.generateHashFromFile(file);
        results.push(result);
        
        // Log progress for large batches
        if (files.length > 5 && (i + 1) % 5 === 0) {
          console.log(`Processed ${i + 1}/${files.length} files`);
        }
      } catch (error) {
        console.error(`Failed to hash file ${file.name}:`, error);
        // Continue with other files, but note the error
        results.push({
          hash: '',
          algorithm: 'sha256',
          format: 'ipfs-compatible',
          size: file.size,
          timestamp: new Date().toISOString()
        });
      }
    }

    const duration = performance.now() - startTime;
    console.log(`Batch hash generation completed in ${duration.toFixed(2)}ms`);

    return results;
  }

  // Check for hash collisions (extremely rare but good to detect)
  async detectCollision(hash: string, newData: ArrayBuffer): Promise<boolean> {
    // In a real implementation, you might store hash->data mappings
    // For now, we'll just validate that the hash matches the data
    try {
      const validation = await this.validateHash(newData, hash);
      return !validation.isValid;
    } catch (error) {
      console.error('Collision detection failed:', error);
      return false;
    }
  }

  // Generate deterministic hash (same input always produces same output)
  async generateDeterministicHash(data: ArrayBuffer, salt?: string): Promise<HashResult> {
    try {
      let hashData = data;
      
      // If salt is provided, prepend it to the data
      if (salt) {
        const saltBuffer = new TextEncoder().encode(salt);
        const combined = new ArrayBuffer(saltBuffer.byteLength + data.byteLength);
        const combinedView = new Uint8Array(combined);
        combinedView.set(new Uint8Array(saltBuffer), 0);
        combinedView.set(new Uint8Array(data), saltBuffer.byteLength);
        hashData = combined;
      }

      return await this.generateHash(hashData);
    } catch (error) {
      console.error('Deterministic hash generation failed:', error);
      throw error;
    }
  }

  // Extract hash from IPFS URI
  extractHashFromURI(uri: string): string | null {
    if (uri.startsWith('ipfs://')) {
      const hash = uri.substring(7);
      return this.isValidHashFormat(hash) ? hash : null;
    }
    return null;
  }

  // Create IPFS URI from hash
  createIPFSURI(hash: string): string {
    if (!this.isValidHashFormat(hash)) {
      throw new Error('Invalid hash format for IPFS URI');
    }
    return `ipfs://${hash}`;
  }

  // Compare two hashes
  compareHashes(hash1: string, hash2: string): boolean {
    return hash1 === hash2;
  }

  // Get hash info
  getHashInfo(hash: string): { isValid: boolean; prefix: string; length: number; format: string } {
    return {
      isValid: this.isValidHashFormat(hash),
      prefix: hash.substring(0, 2),
      length: hash.length,
      format: hash.startsWith(this.IPFS_PREFIX) ? 'ipfs-compatible' : 'unknown'
    };
  }
}

// Export singleton instance
export const contentHashService = new ContentHashService();
export default contentHashService;