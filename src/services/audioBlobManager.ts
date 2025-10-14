// Audio Blob Manager - Handles blob URL lifecycle and caching
// Provides reliable blob URL management with automatic cleanup and session restoration

export interface BlobInfo {
  url: string;
  hash: string;
  mimeType: string;
  size: number;
  createdAt: string;
  lastAccessedAt: string;
  accessCount: number;
  isActive: boolean;
}

export interface BlobStats {
  totalBlobs: number;
  activeBlobs: number;
  totalSize: number;
  oldestBlob?: string;
  newestBlob?: string;
  memoryUsage: number;
}

class AudioBlobManager {
  private blobCache: Map<string, BlobInfo> = new Map();
  private blobData: Map<string, Blob> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_BLOB_AGE = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 50; // Maximum number of cached blobs

  constructor() {
    this.startCleanupTimer();
    this.restoreSessionBlobs();
  }

  // Create blob URL from audio data
  createBlobUrl(audioData: ArrayBuffer, mimeType: string, hash: string): string {
    try {
      // Check if we already have a blob URL for this hash
      const existing = this.blobCache.get(hash);
      if (existing && existing.isActive) {
        // Update access info
        existing.lastAccessedAt = new Date().toISOString();
        existing.accessCount++;
        console.log(`Reusing existing blob URL for ${hash}: ${existing.url}`);
        return existing.url;
      }

      // Create new blob and URL
      const blob = new Blob([audioData], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const blobInfo: BlobInfo = {
        url,
        hash,
        mimeType,
        size: audioData.byteLength,
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        accessCount: 1,
        isActive: true
      };

      // Store in cache
      this.blobCache.set(hash, blobInfo);
      this.blobData.set(hash, blob);

      // Enforce cache size limit
      this.enforceCacheLimit();

      console.log(`Created blob URL for ${hash}: ${url} (${(audioData.byteLength / 1024 / 1024).toFixed(2)}MB)`);
      return url;
    } catch (error) {
      console.error('Failed to create blob URL:', error);
      throw new Error(`Failed to create blob URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get existing blob URL for hash
  async getBlobUrl(hash: string): Promise<string | null> {
    const blobInfo = this.blobCache.get(hash);
    
    if (blobInfo && blobInfo.isActive) {
      // Update access info
      blobInfo.lastAccessedAt = new Date().toISOString();
      blobInfo.accessCount++;
      
      // Verify the URL is still valid
      if (await this.validateBlobUrl(blobInfo.url)) {
        console.log(`Retrieved cached blob URL for ${hash}: ${blobInfo.url}`);
        return blobInfo.url;
      } else {
        // URL is invalid, mark as inactive
        blobInfo.isActive = false;
        console.warn(`Blob URL for ${hash} is no longer valid`);
      }
    }

    return null;
  }

  // Recreate blob URL from stored data
  async recreateBlobUrl(hash: string, audioData?: ArrayBuffer, mimeType?: string): Promise<string | null> {
    try {
      // If we have the blob data cached, recreate from that
      const cachedBlob = this.blobData.get(hash);
      if (cachedBlob) {
        const newUrl = URL.createObjectURL(cachedBlob);
        
        // Update cache info
        const blobInfo = this.blobCache.get(hash);
        if (blobInfo) {
          // Revoke old URL if it exists
          if (blobInfo.url) {
            URL.revokeObjectURL(blobInfo.url);
          }
          
          blobInfo.url = newUrl;
          blobInfo.isActive = true;
          blobInfo.lastAccessedAt = new Date().toISOString();
          blobInfo.accessCount++;
        }

        console.log(`Recreated blob URL for ${hash}: ${newUrl}`);
        return newUrl;
      }

      // If audio data is provided, create new blob
      if (audioData && mimeType) {
        return this.createBlobUrl(audioData, mimeType, hash);
      }

      console.warn(`Cannot recreate blob URL for ${hash}: no cached data or provided data`);
      return null;
    } catch (error) {
      console.error(`Failed to recreate blob URL for ${hash}:`, error);
      return null;
    }
  }

  // Validate that a blob URL is still accessible
  private async validateBlobUrl(url: string): Promise<boolean> {
    try {
      // Try to fetch the blob URL with a HEAD request
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      // If fetch fails, the URL is likely revoked
      return false;
    }
  }

  // Revoke blob URL and clean up
  revokeBlobUrl(hash: string): boolean {
    const blobInfo = this.blobCache.get(hash);
    
    if (blobInfo) {
      try {
        if (blobInfo.url) {
          URL.revokeObjectURL(blobInfo.url);
          console.log(`Revoked blob URL for ${hash}: ${blobInfo.url}`);
        }
        
        blobInfo.isActive = false;
        this.blobData.delete(hash);
        
        return true;
      } catch (error) {
        console.error(`Failed to revoke blob URL for ${hash}:`, error);
        return false;
      }
    }

    return false;
  }

  // Revoke blob URL by URL string
  revokeBlobUrlByUrl(url: string): boolean {
    try {
      // Find the hash for this URL
      let targetHash: string | null = null;
      for (const [hash, blobInfo] of this.blobCache.entries()) {
        if (blobInfo.url === url) {
          targetHash = hash;
          break;
        }
      }

      if (targetHash) {
        return this.revokeBlobUrl(targetHash);
      } else {
        // Just revoke the URL directly
        URL.revokeObjectURL(url);
        console.log(`Revoked orphaned blob URL: ${url}`);
        return true;
      }
    } catch (error) {
      console.error('Failed to revoke blob URL:', error);
      return false;
    }
  }

  // Get blob info for hash
  getBlobInfo(hash: string): BlobInfo | null {
    return this.blobCache.get(hash) || null;
  }

  // List all cached blobs
  listBlobs(): BlobInfo[] {
    return Array.from(this.blobCache.values())
      .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());
  }

  // Get blob statistics
  getBlobStats(): BlobStats {
    const blobs = Array.from(this.blobCache.values());
    const activeBlobs = blobs.filter(b => b.isActive);
    
    const stats: BlobStats = {
      totalBlobs: blobs.length,
      activeBlobs: activeBlobs.length,
      totalSize: blobs.reduce((sum, blob) => sum + blob.size, 0),
      memoryUsage: this.estimateMemoryUsage()
    };

    if (blobs.length > 0) {
      const sortedByDate = blobs.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      stats.oldestBlob = sortedByDate[0].hash;
      stats.newestBlob = sortedByDate[sortedByDate.length - 1].hash;
    }

    return stats;
  }

  // Estimate memory usage of cached blobs
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    for (const blob of this.blobData.values()) {
      totalSize += blob.size;
    }
    return totalSize;
  }

  // Cleanup expired blobs
  cleanupExpiredBlobs(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [hash, blobInfo] of this.blobCache.entries()) {
      const age = now - new Date(blobInfo.createdAt).getTime();
      
      if (age > this.MAX_BLOB_AGE || !blobInfo.isActive) {
        this.revokeBlobUrl(hash);
        this.blobCache.delete(hash);
        cleanedCount++;
        console.log(`Cleaned up expired blob: ${hash} (age: ${Math.floor(age / 1000 / 60)}min)`);
      }
    }

    return cleanedCount;
  }

  // Enforce cache size limit using LRU strategy
  private enforceCacheLimit(): void {
    if (this.blobCache.size <= this.MAX_CACHE_SIZE) {
      return;
    }

    // Sort by last accessed time (oldest first)
    const sortedEntries = Array.from(this.blobCache.entries())
      .sort(([, a], [, b]) => 
        new Date(a.lastAccessedAt).getTime() - new Date(b.lastAccessedAt).getTime()
      );

    // Remove oldest entries until we're under the limit
    const toRemove = sortedEntries.slice(0, this.blobCache.size - this.MAX_CACHE_SIZE);
    
    for (const [hash] of toRemove) {
      this.revokeBlobUrl(hash);
      this.blobCache.delete(hash);
      console.log(`Removed blob from cache due to size limit: ${hash}`);
    }
  }

  // Start automatic cleanup timer
  private startCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      const cleaned = this.cleanupExpiredBlobs();
      if (cleaned > 0) {
        console.log(`Automatic cleanup removed ${cleaned} expired blobs`);
      }
    }, this.CLEANUP_INTERVAL);

    console.log('Started automatic blob cleanup timer');
  }

  // Stop automatic cleanup timer
  private stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Stopped automatic blob cleanup timer');
    }
  }

  // Restore session blobs from storage
  async restoreSessionBlobs(): Promise<number> {
    try {
      // This would typically restore from audioStorageManager
      // For now, we'll just log that restoration is attempted
      console.log('Attempting to restore session blobs...');
      
      // In a full implementation, this would:
      // 1. Get list of stored audio files from audioStorageManager
      // 2. For each file, check if we need to recreate blob URLs
      // 3. Recreate blob URLs for recently accessed files
      
      return 0; // Number of restored blobs
    } catch (error) {
      console.error('Failed to restore session blobs:', error);
      return 0;
    }
  }

  // Preload blob for faster access
  async preloadBlob(hash: string, audioData: ArrayBuffer, mimeType: string): Promise<void> {
    try {
      // Create blob URL but don't return it yet
      this.createBlobUrl(audioData, mimeType, hash);
      console.log(`Preloaded blob for ${hash}`);
    } catch (error) {
      console.error(`Failed to preload blob for ${hash}:`, error);
    }
  }

  // Batch create blob URLs
  batchCreateBlobUrls(items: Array<{ hash: string; audioData: ArrayBuffer; mimeType: string }>): Map<string, string> {
    const results = new Map<string, string>();

    for (const item of items) {
      try {
        const url = this.createBlobUrl(item.audioData, item.mimeType, item.hash);
        results.set(item.hash, url);
      } catch (error) {
        console.error(`Failed to create blob URL for ${item.hash}:`, error);
      }
    }

    console.log(`Batch created ${results.size}/${items.length} blob URLs`);
    return results;
  }

  // Clear all blobs
  clearAllBlobs(): void {
    console.log(`Clearing ${this.blobCache.size} cached blobs...`);

    // Revoke all URLs
    for (const [hash] of this.blobCache.entries()) {
      this.revokeBlobUrl(hash);
    }

    // Clear caches
    this.blobCache.clear();
    this.blobData.clear();

    console.log('All blobs cleared');
  }

  // Get blob by hash (for direct access)
  getBlob(hash: string): Blob | null {
    return this.blobData.get(hash) || null;
  }

  // Check if blob exists
  hasBlob(hash: string): boolean {
    return this.blobCache.has(hash) && this.blobCache.get(hash)!.isActive;
  }

  // Update blob access time (for external access tracking)
  updateBlobAccess(hash: string): void {
    const blobInfo = this.blobCache.get(hash);
    if (blobInfo) {
      blobInfo.lastAccessedAt = new Date().toISOString();
      blobInfo.accessCount++;
    }
  }

  // Get most accessed blobs
  getMostAccessedBlobs(limit: number = 10): BlobInfo[] {
    return Array.from(this.blobCache.values())
      .filter(blob => blob.isActive)
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  // Get recently created blobs
  getRecentBlobs(limit: number = 10): BlobInfo[] {
    return Array.from(this.blobCache.values())
      .filter(blob => blob.isActive)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Cleanup on destruction
  destroy(): void {
    this.stopCleanupTimer();
    this.clearAllBlobs();
    console.log('AudioBlobManager destroyed');
  }
}

// Export singleton instance
export const audioBlobManager = new AudioBlobManager();
export default audioBlobManager;