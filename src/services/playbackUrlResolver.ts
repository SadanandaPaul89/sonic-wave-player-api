// Playback URL Resolver - Unified interface for resolving audio sources to playable URLs
// Provides multiple fallback strategies and retry mechanisms

import { audioStorageManager } from './audioStorageManager';
import { audioBlobManager } from './audioBlobManager';
import { contentHashService } from './contentHashService';

export type AudioSourceType = 'ipfs' | 'http' | 'blob' | 'storage';

export interface AudioSource {
  type: AudioSourceType;
  identifier: string; // hash, URL, or blob URL
  qualities?: AudioQuality[];
  metadata?: AudioSourceMetadata;
}

export interface AudioQuality {
  format: 'mobile' | 'streaming' | 'high_quality' | 'original';
  bitrate: string;
  size: number;
  uri: string;
}

export interface AudioSourceMetadata {
  title?: string;
  artist?: string;
  duration?: number;
  mimeType?: string;
  originalFilename?: string;
}

export interface ResolutionResult {
  url: string;
  source: AudioSource;
  strategy: ResolutionStrategy;
  quality: AudioQuality | null;
  cached: boolean;
  latency: number;
}

export interface ResolutionError {
  source: AudioSource;
  strategy: ResolutionStrategy;
  error: string;
  retryable: boolean;
}

export type ResolutionStrategy = 
  | 'blob_cache'
  | 'storage_direct'
  | 'storage_recreate'
  | 'ipfs_gateway'
  | 'http_direct'
  | 'fallback_demo';

export interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

export interface NetworkConditions {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

class PlaybackUrlResolver {
  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
    maxDelay: 10000
  };

  private readonly IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://dweb.link/ipfs/'
  ];

  private readonly DEMO_AUDIO_URL = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
  
  private gatewayLatencies: Map<string, number> = new Map();
  private resolutionCache: Map<string, ResolutionResult> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Main resolution method with fallback strategies
  async resolveAudioUrl(source: AudioSource, retryConfig?: RetryConfig): Promise<ResolutionResult> {
    const config = { ...this.DEFAULT_RETRY_CONFIG, ...retryConfig };
    const startTime = performance.now();
    
    console.log(`Resolving audio URL for ${source.type}:${source.identifier}`);

    // Check cache first
    const cacheKey = this.getCacheKey(source);
    const cached = this.resolutionCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      console.log(`Using cached resolution for ${source.identifier}`);
      return {
        ...cached,
        latency: performance.now() - startTime,
        cached: true
      };
    }

    // Define resolution strategies based on source type
    const strategies = this.getResolutionStrategies(source);
    
    let lastError: ResolutionError | null = null;

    // Try each strategy with retry logic
    for (const strategy of strategies) {
      try {
        const result = await this.executeStrategyWithRetry(source, strategy, config);
        
        if (result) {
          result.latency = performance.now() - startTime;
          result.cached = false;
          
          // Cache successful result
          this.cacheResult(cacheKey, result);
          
          console.log(`Successfully resolved ${source.identifier} using ${strategy} in ${result.latency.toFixed(2)}ms`);
          return result;
        }
      } catch (error) {
        lastError = {
          source,
          strategy,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryable: this.isRetryableError(error)
        };
        
        console.warn(`Strategy ${strategy} failed for ${source.identifier}:`, lastError.error);
      }
    }

    // All strategies failed, throw the last error
    throw new Error(`Failed to resolve audio URL for ${source.identifier}: ${lastError?.error || 'All strategies failed'}`);
  }

  // Get resolution strategies based on source type
  private getResolutionStrategies(source: AudioSource): ResolutionStrategy[] {
    switch (source.type) {
      case 'ipfs':
        return ['blob_cache', 'storage_direct', 'storage_recreate', 'ipfs_gateway', 'fallback_demo'];
      case 'storage':
        return ['blob_cache', 'storage_direct', 'storage_recreate', 'fallback_demo'];
      case 'blob':
        return ['blob_cache', 'http_direct', 'fallback_demo'];
      case 'http':
        return ['http_direct', 'fallback_demo'];
      default:
        return ['fallback_demo'];
    }
  }

  // Execute strategy with retry logic
  private async executeStrategyWithRetry(
    source: AudioSource, 
    strategy: ResolutionStrategy, 
    config: RetryConfig
  ): Promise<ResolutionResult | null> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        const result = await this.executeStrategy(source, strategy);
        if (result) {
          return result;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (!this.isRetryableError(error) || attempt === config.maxAttempts) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );
        
        console.log(`Attempt ${attempt} failed for ${strategy}, retrying in ${delay}ms...`);
        await this.delay(delay);
      }
    }

    if (lastError) {
      throw lastError;
    }

    return null;
  }

  // Execute individual resolution strategy
  private async executeStrategy(source: AudioSource, strategy: ResolutionStrategy): Promise<ResolutionResult | null> {
    const startTime = performance.now();

    switch (strategy) {
      case 'blob_cache':
        return await this.resolveBlobCache(source, startTime);
      
      case 'storage_direct':
        return await this.resolveStorageDirect(source, startTime);
      
      case 'storage_recreate':
        return await this.resolveStorageRecreate(source, startTime);
      
      case 'ipfs_gateway':
        return await this.resolveIPFSGateway(source, startTime);
      
      case 'http_direct':
        return await this.resolveHttpDirect(source, startTime);
      
      case 'fallback_demo':
        return await this.resolveFallbackDemo(source, startTime);
      
      default:
        throw new Error(`Unknown resolution strategy: ${strategy}`);
    }
  }

  // Strategy: Check blob cache
  private async resolveBlobCache(source: AudioSource, startTime: number): Promise<ResolutionResult | null> {
    const url = await audioBlobManager.getBlobUrl(source.identifier);
    
    if (url) {
      return {
        url,
        source,
        strategy: 'blob_cache',
        quality: this.getOptimalQuality(source.qualities),
        cached: true,
        latency: performance.now() - startTime
      };
    }

    return null;
  }

  // Strategy: Direct storage access
  private async resolveStorageDirect(source: AudioSource, startTime: number): Promise<ResolutionResult | null> {
    const storedFile = await audioStorageManager.getAudioFile(source.identifier);
    
    if (storedFile) {
      // Create blob URL from stored data
      const url = audioBlobManager.createBlobUrl(
        storedFile.audioData,
        storedFile.mimeType,
        storedFile.hash
      );

      return {
        url,
        source,
        strategy: 'storage_direct',
        quality: this.getOptimalQuality(source.qualities),
        cached: false,
        latency: performance.now() - startTime
      };
    }

    return null;
  }

  // Strategy: Recreate from storage
  private async resolveStorageRecreate(source: AudioSource, startTime: number): Promise<ResolutionResult | null> {
    const storedFile = await audioStorageManager.getAudioFile(source.identifier);
    
    if (storedFile) {
      const url = await audioBlobManager.recreateBlobUrl(
        source.identifier,
        storedFile.audioData,
        storedFile.mimeType
      );

      if (url) {
        return {
          url,
          source,
          strategy: 'storage_recreate',
          quality: this.getOptimalQuality(source.qualities),
          cached: false,
          latency: performance.now() - startTime
        };
      }
    }

    return null;
  }

  // Strategy: IPFS gateway resolution
  private async resolveIPFSGateway(source: AudioSource, startTime: number): Promise<ResolutionResult | null> {
    const hash = contentHashService.extractHashFromURI(source.identifier) || source.identifier;
    
    if (!contentHashService.isValidHashFormat(hash)) {
      throw new Error(`Invalid IPFS hash format: ${hash}`);
    }

    // Try gateways in order of performance
    const sortedGateways = this.getSortedGateways();
    
    for (const gateway of sortedGateways) {
      try {
        const url = `${gateway}${hash}`;
        const isValid = await this.validateUrl(url);
        
        if (isValid) {
          // Update gateway performance
          this.updateGatewayLatency(gateway, performance.now() - startTime);
          
          return {
            url,
            source,
            strategy: 'ipfs_gateway',
            quality: this.getOptimalQuality(source.qualities),
            cached: false,
            latency: performance.now() - startTime
          };
        }
      } catch (error) {
        console.warn(`IPFS gateway ${gateway} failed:`, error);
        continue;
      }
    }

    return null;
  }

  // Strategy: Direct HTTP access
  private async resolveHttpDirect(source: AudioSource, startTime: number): Promise<ResolutionResult | null> {
    const url = source.identifier;
    
    if (await this.validateUrl(url)) {
      return {
        url,
        source,
        strategy: 'http_direct',
        quality: this.getOptimalQuality(source.qualities),
        cached: false,
        latency: performance.now() - startTime
      };
    }

    return null;
  }

  // Strategy: Fallback demo audio
  private async resolveFallbackDemo(source: AudioSource, startTime: number): Promise<ResolutionResult | null> {
    console.warn(`Using fallback demo audio for ${source.identifier}`);
    
    return {
      url: this.DEMO_AUDIO_URL,
      source,
      strategy: 'fallback_demo',
      quality: null,
      cached: false,
      latency: performance.now() - startTime
    };
  }

  // Validate URL accessibility
  async validateUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Get optimal quality based on network conditions
  getOptimalQuality(qualities?: AudioQuality[]): AudioQuality | null {
    if (!qualities || qualities.length === 0) {
      return null;
    }

    const networkConditions = this.getNetworkConditions();
    
    // Select quality based on network conditions
    if (networkConditions.effectiveType === '4g' && networkConditions.downlink > 10) {
      return qualities.find(q => q.format === 'high_quality') || qualities[0];
    } else if (networkConditions.effectiveType === '3g' || networkConditions.downlink > 1) {
      return qualities.find(q => q.format === 'streaming') || qualities[0];
    } else {
      return qualities.find(q => q.format === 'mobile') || qualities[0];
    }
  }

  // Get current network conditions
  private getNetworkConditions(): NetworkConditions {
    const connection = (navigator as any).connection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 100,
        saveData: connection.saveData || false
      };
    }

    // Default values
    return {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false
    };
  }

  // Get sorted gateways by performance
  private getSortedGateways(): string[] {
    return [...this.IPFS_GATEWAYS].sort((a, b) => {
      const latencyA = this.gatewayLatencies.get(a) || Infinity;
      const latencyB = this.gatewayLatencies.get(b) || Infinity;
      return latencyA - latencyB;
    });
  }

  // Update gateway performance metrics
  private updateGatewayLatency(gateway: string, latency: number): void {
    const currentLatency = this.gatewayLatencies.get(gateway) || latency;
    // Use exponential moving average
    const newLatency = currentLatency * 0.7 + latency * 0.3;
    this.gatewayLatencies.set(gateway, newLatency);
  }

  // Check if error is retryable
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const retryableErrors = [
        'NetworkError',
        'TimeoutError',
        'AbortError',
        'Failed to fetch'
      ];
      
      return retryableErrors.some(retryable => 
        error.message.includes(retryable) || error.name.includes(retryable)
      );
    }
    
    return false;
  }

  // Cache management
  private getCacheKey(source: AudioSource): string {
    return `${source.type}:${source.identifier}`;
  }

  private cacheResult(key: string, result: ResolutionResult): void {
    // Add timestamp for TTL
    const cachedResult = {
      ...result,
      timestamp: Date.now()
    };
    
    this.resolutionCache.set(key, cachedResult as ResolutionResult);
    
    // Cleanup old cache entries
    this.cleanupCache();
  }

  private isCacheValid(result: ResolutionResult): boolean {
    const timestamp = (result as any).timestamp;
    if (!timestamp) return false;
    
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  private cleanupCache(): void {
    const now = Date.now();
    
    for (const [key, result] of this.resolutionCache.entries()) {
      const timestamp = (result as any).timestamp;
      if (!timestamp || now - timestamp > this.CACHE_TTL) {
        this.resolutionCache.delete(key);
      }
    }
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Batch resolution
  async resolveMultipleUrls(sources: AudioSource[]): Promise<Map<string, ResolutionResult | Error>> {
    const results = new Map<string, ResolutionResult | Error>();
    
    const promises = sources.map(async (source) => {
      try {
        const result = await this.resolveAudioUrl(source);
        results.set(source.identifier, result);
      } catch (error) {
        results.set(source.identifier, error instanceof Error ? error : new Error('Unknown error'));
      }
    });

    await Promise.all(promises);
    return results;
  }

  // Preload audio for faster playback
  async preloadAudio(source: AudioSource): Promise<void> {
    try {
      const result = await this.resolveAudioUrl(source);
      
      // Create a hidden audio element to preload
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = result.url;
      
      console.log(`Preloaded audio: ${source.identifier}`);
    } catch (error) {
      console.warn(`Failed to preload audio: ${source.identifier}`, error);
    }
  }

  // Get resolution statistics
  getResolutionStats(): {
    cacheSize: number;
    gatewayLatencies: Record<string, number>;
    cacheHitRate?: number;
  } {
    return {
      cacheSize: this.resolutionCache.size,
      gatewayLatencies: Object.fromEntries(this.gatewayLatencies),
    };
  }

  // Clear caches
  clearCache(): void {
    this.resolutionCache.clear();
    this.gatewayLatencies.clear();
    console.log('Playback URL resolver cache cleared');
  }
}

// Export singleton instance
export const playbackUrlResolver = new PlaybackUrlResolver();
export default playbackUrlResolver;