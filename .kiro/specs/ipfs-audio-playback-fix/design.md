# Design Document

## Overview

The IPFS audio playback fix addresses critical issues in the current implementation where uploaded audio files cannot be played back reliably. The main problems are:

1. **Mock Hash Generation**: The system generates fake IPFS hashes instead of content-based ones
2. **Blob URL Management**: Blob URLs are created but not properly maintained across sessions
3. **Storage Persistence**: Audio data is not reliably stored for long-term access
4. **Playback Resolution**: The audio player cannot resolve IPFS hashes to playable URLs

The solution involves implementing a robust local audio storage system with proper hash generation, persistent blob management, and reliable playback URL resolution.

## Architecture

### Core Components

1. **Enhanced IPFS Service**: Improved storage and retrieval mechanisms
2. **Audio Blob Manager**: Handles blob URL lifecycle and persistence
3. **Playback URL Resolver**: Maps IPFS hashes to playable URLs
4. **Storage Manager**: Manages localStorage and IndexedDB for audio persistence
5. **Audio Player Integration**: Enhanced player components with better error handling

### Data Flow

```
Audio Upload → Content Hash → Blob Storage → Metadata Storage → Playback Resolution
     ↓              ↓             ↓              ↓                    ↓
  File Read → SHA-256 Hash → IndexedDB → localStorage → Blob URL Creation
```

## Components and Interfaces

### 1. Enhanced IPFS Service

**Purpose**: Provide reliable audio storage and retrieval with proper hash generation.

**Key Methods**:
- `uploadAudioFile(file: File)`: Store audio with content-based hash
- `getPlayableUrl(hash: string)`: Resolve hash to playable URL
- `validateAudioAccess(hash: string)`: Check if audio is accessible
- `cleanupExpiredBlobs()`: Manage blob URL lifecycle

**Storage Strategy**:
- **IndexedDB**: Store actual audio file data (larger capacity)
- **localStorage**: Store metadata and hash mappings (quick access)
- **Memory Cache**: Store active blob URLs (session-based)

### 2. Audio Blob Manager

**Purpose**: Manage blob URL creation, caching, and cleanup.

```typescript
interface AudioBlobManager {
  createBlobUrl(audioData: ArrayBuffer, mimeType: string): string;
  getBlobUrl(hash: string): Promise<string | null>;
  revokeBlobUrl(url: string): void;
  cleanupExpiredUrls(): void;
  restoreSessionBlobs(): Promise<void>;
}
```

**Features**:
- Automatic blob URL cleanup to prevent memory leaks
- Session restoration for previously uploaded files
- Fallback mechanisms when blob URLs become invalid

### 3. Playback URL Resolver

**Purpose**: Provide a unified interface for resolving any audio source to a playable URL.

```typescript
interface PlaybackUrlResolver {
  resolveAudioUrl(source: AudioSource): Promise<string>;
  validateUrl(url: string): Promise<boolean>;
  getOptimalQuality(availableQualities: AudioQuality[]): AudioQuality;
}

type AudioSource = {
  type: 'ipfs' | 'http' | 'blob';
  identifier: string;
  qualities?: AudioQuality[];
};
```

### 4. Storage Manager

**Purpose**: Handle persistent storage across different browser storage mechanisms.

**Storage Hierarchy**:
1. **IndexedDB** (Primary): Large audio files (up to several GB)
2. **localStorage** (Secondary): Metadata and small data (up to 10MB)
3. **Memory Cache** (Tertiary): Active session data

**Features**:
- Automatic fallback between storage methods
- Storage quota management
- Data migration and cleanup utilities

### 5. Enhanced Audio Player Components

**IPFSAudioPlayer Enhancements**:
- Better error handling with specific error types
- Loading state management with progress indicators
- Automatic retry mechanisms for failed loads
- Debug mode for troubleshooting

## Data Models

### Audio File Storage Model

```typescript
interface StoredAudioFile {
  hash: string;                    // Content-based SHA-256 hash
  originalName: string;            // Original filename
  mimeType: string;               // Audio MIME type
  size: number;                   // File size in bytes
  audioData: ArrayBuffer;         // Raw audio data
  metadata: AudioMetadata;        // Extracted metadata
  uploadedAt: string;            // ISO timestamp
  lastAccessedAt: string;        // ISO timestamp
  blobUrl?: string;              // Current blob URL (if active)
  storageLocation: 'indexeddb' | 'localstorage' | 'memory';
}
```

### Audio Metadata Model

```typescript
interface AudioMetadata {
  title: string;
  artist: string;
  album?: string;
  duration: number;              // Duration in seconds
  bitrate?: number;             // Bitrate in kbps
  sampleRate?: number;          // Sample rate in Hz
  channels?: number;            // Number of audio channels
  format: string;               // Audio format (MP3, WAV, etc.)
  genre?: string;
  year?: number;
  artwork?: string;             // Base64 encoded artwork or URL
}
```

## Error Handling

### Error Types

1. **StorageError**: Issues with storing/retrieving audio data
2. **PlaybackError**: Problems during audio playback
3. **HashError**: Hash generation or validation failures
4. **NetworkError**: IPFS gateway or network issues
5. **FormatError**: Unsupported audio formats

### Error Recovery Strategies

1. **Storage Fallback**: IndexedDB → localStorage → memory cache
2. **URL Regeneration**: Recreate blob URLs when they become invalid
3. **Alternative Gateways**: Try multiple IPFS gateways for public content
4. **Format Conversion**: Attempt to play unsupported formats via Web Audio API
5. **User Notification**: Clear error messages with suggested actions

### Retry Logic

```typescript
interface RetryConfig {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
}

const audioRetryConfig: RetryConfig = {
  maxAttempts: 3,
  backoffMultiplier: 2,
  initialDelay: 1000,
  maxDelay: 10000
};
```

## Testing Strategy

### Unit Tests

1. **Hash Generation**: Verify consistent content-based hashing
2. **Storage Operations**: Test IndexedDB and localStorage operations
3. **Blob Management**: Test blob URL creation and cleanup
4. **URL Resolution**: Test various audio source resolution scenarios
5. **Error Handling**: Test all error conditions and recovery paths

### Integration Tests

1. **Upload-to-Playback Flow**: Complete user journey testing
2. **Storage Persistence**: Test data survival across browser sessions
3. **Player Integration**: Test with existing music player components
4. **Performance**: Test with various file sizes and formats
5. **Browser Compatibility**: Test across different browsers

### Test Data

- **Small Audio Files**: < 1MB for quick testing
- **Large Audio Files**: > 50MB to test storage limits
- **Various Formats**: MP3, WAV, FLAC, AAC, OGG
- **Corrupted Files**: Test error handling
- **Network Conditions**: Simulate slow/failed connections

## Performance Considerations

### Storage Optimization

1. **Lazy Loading**: Load audio data only when needed for playback
2. **Compression**: Use browser-native compression for stored data
3. **Cleanup Policies**: Remove old/unused files based on access patterns
4. **Batch Operations**: Group storage operations for better performance

### Memory Management

1. **Blob URL Lifecycle**: Automatic cleanup of unused blob URLs
2. **Audio Buffer Management**: Release audio buffers after playback
3. **Cache Size Limits**: Implement LRU cache for active audio files
4. **Garbage Collection**: Trigger cleanup during idle periods

### Network Optimization

1. **Progressive Loading**: Stream audio data as it becomes available
2. **Quality Selection**: Choose optimal quality based on network conditions
3. **Preloading**: Preload frequently accessed tracks
4. **Gateway Selection**: Use fastest available IPFS gateway

## Security Considerations

### Data Validation

1. **File Type Validation**: Verify audio file types and reject malicious files
2. **Size Limits**: Enforce reasonable file size limits
3. **Content Scanning**: Basic validation of audio file headers
4. **Hash Verification**: Verify content integrity using hashes

### Storage Security

1. **Origin Isolation**: Ensure audio data is isolated per origin
2. **Quota Management**: Prevent storage exhaustion attacks
3. **Cleanup Policies**: Regular cleanup of old/unused data
4. **Error Information**: Avoid leaking sensitive information in errors

## Migration Strategy

### Existing Data Handling

1. **Legacy Hash Migration**: Convert existing mock hashes to content-based ones
2. **Storage Format Upgrade**: Migrate from localStorage-only to IndexedDB
3. **Metadata Enhancement**: Enrich existing metadata with new fields
4. **Backward Compatibility**: Support existing audio references during transition

### Deployment Phases

1. **Phase 1**: Deploy new storage system alongside existing one
2. **Phase 2**: Migrate existing audio files to new system
3. **Phase 3**: Update player components to use new system
4. **Phase 4**: Remove legacy code and cleanup old data