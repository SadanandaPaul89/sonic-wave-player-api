# Requirements Document

## Introduction

This feature implements a comprehensive user role management system that differentiates between artist and normal user accounts. The system controls access to music uploading capabilities, manages NFT minting with limits and subscription plans, and ensures proper access control throughout the application. Artists can upload music while normal users can listen to IPFS-based audio and receive NFTs with usage limits that require subscription plans to continue.

## Requirements

### Requirement 1

**User Story:** As a user, I want to connect my wallet and have my account type (artist vs normal) determined automatically, so that I can access the appropriate features for my role.

#### Acceptance Criteria

1. WHEN a user connects their wallet THEN the system SHALL determine if they are an artist or normal user
2. WHEN the user role is determined THEN the system SHALL display appropriate UI elements based on their role
3. WHEN an artist connects THEN the system SHALL show music upload capabilities
4. WHEN a normal user connects THEN the system SHALL hide music upload capabilities
5. IF the role determination fails THEN the system SHALL default to normal user permissions

### Requirement 2

**User Story:** As an artist, I want to upload music to IPFS after connecting my wallet, so that I can share my content with listeners.

#### Acceptance Criteria

1. WHEN an artist connects their wallet THEN the system SHALL display music upload interface
2. WHEN an artist uploads music THEN the system SHALL store it on IPFS
3. WHEN music upload is successful THEN the system SHALL confirm the upload to the artist
4. IF a normal user attempts to access upload features THEN the system SHALL deny access with appropriate messaging
5. WHEN an artist uploads music THEN the system SHALL associate it with their wallet address

### Requirement 3

**User Story:** As a normal user, I want to listen to IPFS-based audio content after connecting my wallet, so that I can enjoy music on the platform.

#### Acceptance Criteria

1. WHEN a normal user connects their wallet THEN the system SHALL display available music content
2. WHEN a normal user plays music THEN the system SHALL stream from IPFS successfully
3. WHEN a normal user accesses music THEN the system SHALL track their listening activity
4. WHEN music is played THEN the system SHALL provide standard playback controls
5. IF IPFS content is unavailable THEN the system SHALL display appropriate error messaging

### Requirement 4

**User Story:** As a normal user, I want to receive NFTs when I listen to music, so that I can collect digital assets as rewards for engagement.

#### Acceptance Criteria

1. WHEN a normal user listens to music THEN the system SHALL initiate NFT minting process
2. WHEN NFT minting is triggered THEN the system SHALL mint an NFT to the user's wallet
3. WHEN NFT is minted successfully THEN the system SHALL notify the user
4. WHEN NFT minting fails THEN the system SHALL log the error and continue playback
5. WHEN a user receives an NFT THEN the system SHALL track it against their minting limit

### Requirement 5

**User Story:** As a normal user, I want to have a weekly limit on NFT minting, so that the platform can manage resource usage and encourage subscription upgrades.

#### Acceptance Criteria

1. WHEN a normal user reaches their weekly NFT limit THEN the system SHALL stop minting new NFTs
2. WHEN the weekly limit is reached THEN the system SHALL display subscription upgrade options
3. WHEN a week passes THEN the system SHALL reset the user's NFT minting limit
4. WHEN a user is near their limit THEN the system SHALL warn them about approaching the limit
5. IF a user attempts to mint beyond their limit THEN the system SHALL prevent minting and show upgrade messaging

### Requirement 6

**User Story:** As a normal user, I want to purchase a subscription plan to continue receiving NFTs after reaching my weekly limit, so that I can maintain my collecting activity.

#### Acceptance Criteria

1. WHEN a user reaches their NFT limit THEN the system SHALL display available subscription plans
2. WHEN a user selects a subscription plan THEN the system SHALL initiate the payment process
3. WHEN payment is successful THEN the system SHALL upgrade the user's account and reset their limits
4. WHEN a subscription is active THEN the system SHALL allow continued NFT minting
5. WHEN a subscription expires THEN the system SHALL revert to the standard weekly limits

### Requirement 7

**User Story:** As a system administrator, I want to track user roles and NFT minting activity, so that I can monitor platform usage and manage resources effectively.

#### Acceptance Criteria

1. WHEN users interact with the platform THEN the system SHALL log their role and activities
2. WHEN NFTs are minted THEN the system SHALL track minting counts per user
3. WHEN subscription events occur THEN the system SHALL record payment and upgrade activities
4. WHEN limits are reached THEN the system SHALL log limit enforcement actions
5. WHEN errors occur THEN the system SHALL log detailed error information for debugging

### Requirement 8

**User Story:** As a user, I want clear visual indicators of my account type and current NFT minting status, so that I understand my capabilities and limitations on the platform.

#### Acceptance Criteria

1. WHEN a user is logged in THEN the system SHALL display their account type (artist/normal)
2. WHEN a normal user is active THEN the system SHALL show their current NFT minting count and limit
3. WHEN a user has an active subscription THEN the system SHALL display subscription status and benefits
4. WHEN limits are approaching THEN the system SHALL provide clear warnings and upgrade options
5. WHEN account status changes THEN the system SHALL update all relevant UI indicators immediately