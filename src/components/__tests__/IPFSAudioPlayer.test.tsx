// Unit tests for Enhanced IPFSAudioPlayer

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import IPFSAudioPlayer from '../IPFSAudioPlayer';
import { playbackUrlResolver } from '@/services/playbackUrlResolver';
import { simpleIPFSService } from '@/services/ipfsServiceSimple';
import { web3Service } from '@/services/web3Service';

// Mock dependencies
jest.mock('@/services/playbackUrlResolver');
jest.mock('@/services/ipfsServiceSimple');
jest.mock('@/services/web3Service');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      data-testid={props['data-testid']}
      {...props}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, max, disabled, ...props }: any) => (
    <input
      type="range"
      value={value?.[0] || 0}
      onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
      max={max}
      disabled={disabled}
      data-testid="slider"
      {...props}
    />
  ),
}));

// Mock HTML Audio element
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 180,
  volume: 1,
  src: '',
  error: null,
  buffered: {
    length: 1,
    end: jest.fn(() => 90),
  },
};

Object.defineProperty(window, 'HTMLAudioElement', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockAudio),
});

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    downlink: 10,
  },
  writable: true,
});

describe('Enhanced IPFSAudioPlayer', () => {
  const mockAudioFiles = {
    high_quality: {
      uri: 'ipfs://QmTestHash123_320',
      format: 'MP3' as const,
      bitrate: '320kbps',
      size: 8000000,
    },
    streaming: {
      uri: 'ipfs://QmTestHash123_192',
      format: 'MP3' as const,
      bitrate: '192kbps',
      size: 5000000,
    },
    mobile: {
      uri: 'ipfs://QmTestHash123_128',
      format: 'MP3' as const,
      bitrate: '128kbps',
      size: 3000000,
    },
  };

  const defaultProps = {
    audioFiles: mockAudioFiles,
    title: 'Test Song',
    artist: 'Test Artist',
    artwork: 'https://example.com/artwork.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (playbackUrlResolver.resolveAudioUrl as jest.Mock).mockResolvedValue({
      url: 'https://ipfs.io/ipfs/QmTestHash123',
      strategy: 'ipfs_gateway',
      quality: null,
      cached: false,
      latency: 100,
    });

    (simpleIPFSService.validateAudioAccess as jest.Mock).mockResolvedValue(true);
    (web3Service.getCurrentAccount as jest.Mock).mockReturnValue('0x123');
    (web3Service.checkNFTOwnership as jest.Mock).mockResolvedValue(true);
    (web3Service.connectWallet as jest.Mock).mockResolvedValue(undefined);

    // Reset audio mock
    mockAudio.play.mockResolvedValue(undefined);
    mockAudio.error = null;
  });

  describe('Rendering', () => {
    test('should render basic player interface', () => {
      render(<IPFSAudioPlayer {...defaultProps} />);

      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument(); // Play button
    });

    test('should show NFT exclusive badge when NFT contract provided', () => {
      render(
        <IPFSAudioPlayer 
          {...defaultProps} 
          nftContract="0x123" 
          tokenId="1" 
        />
      );

      expect(screen.getByText('NFT Exclusive')).toBeInTheDocument();
    });

    test('should show network quality information', () => {
      render(<IPFSAudioPlayer {...defaultProps} />);

      expect(screen.getByText(/streaming.*192kbps/)).toBeInTheDocument();
    });
  });

  describe('Audio Loading', () => {
    test('should load audio file on mount', async () => {
      render(<IPFSAudioPlayer {...defaultProps} />);

      await waitFor(() => {
        expect(playbackUrlResolver.resolveAudioUrl).toHaveBeenCalledWith({
          type: 'ipfs',
          identifier: 'QmTestHash123_192',
          qualities: expect.any(Array),
          metadata: expect.objectContaining({
            title: 'Test Song',
            artist: 'Test Artist',
          }),
        });
      });
    });

    test('should show loading state during audio resolution', async () => {
      (playbackUrlResolver.resolveAudioUrl as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<IPFSAudioPlayer {...defaultProps} />);

      expect(screen.getByText(/Resolving audio source/)).toBeInTheDocument();
    });

    test('should show ready state when audio is loaded', async () => {
      render(<IPFSAudioPlayer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should display network error with retry option', async () => {
      (playbackUrlResolver.resolveAudioUrl as jest.Mock).mockRejectedValue(
        new Error('Network error occurred')
      );

      render(<IPFSAudioPlayer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Network connection issue')).toBeInTheDocument();
        expect(screen.getByText(/Retry.*3 attempts left/)).toBeInTheDocument();
      });
    });

    test('should display access error for NFT-gated content', async () => {
      (web3Service.checkNFTOwnership as jest.Mock).mockResolvedValue(false);

      render(
        <IPFSAudioPlayer 
          {...defaultProps} 
          nftContract="0x123" 
          tokenId="1" 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('NFT Required')).toBeInTheDocument();
        expect(screen.getByText(/You need to own this NFT/)).toBeInTheDocument();
      });
    });

    test('should handle retry functionality', async () => {
      let callCount = 0;
      (playbackUrlResolver.resolveAudioUrl as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          url: 'https://ipfs.io/ipfs/QmTestHash123',
          strategy: 'ipfs_gateway',
          quality: null,
          cached: false,
          latency: 100,
        });
      });

      render(<IPFSAudioPlayer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Retry.*3 attempts left/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Retry.*3 attempts left/));

      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });

      expect(callCount).toBe(2);
    });

    test('should stop retrying after maximum attempts', async () => {
      (playbackUrlResolver.resolveAudioUrl as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      render(<IPFSAudioPlayer {...defaultProps} />);

      // Wait for initial error
      await waitFor(() => {
        expect(screen.getByText(/Retry.*3 attempts left/)).toBeInTheDocument();
      });

      // Click retry 3 times
      for (let i = 0; i < 3; i++) {
        const retryButton = screen.queryByText(/Retry.*\d+ attempts left/);
        if (retryButton) {
          fireEvent.click(retryButton);
          await waitFor(() => {}, { timeout: 100 });
        }
      }

      await waitFor(() => {
        expect(screen.getByText('Maximum retry attempts reached')).toBeInTheDocument();
      });
    });
  });

  describe('Playback Controls', () => {
    test('should toggle play/pause', async () => {
      render(<IPFSAudioPlayer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });

      const playButton = screen.getByRole('button');
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(mockAudio.play).toHaveBeenCalled();
      });
    });

    test('should handle playback errors', async () => {
      mockAudio.play.mockRejectedValue(new Error('Playback failed'));

      render(<IPFSAudioPlayer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Ready')).toBeInTheDocument();
      });

      const playButton = screen.getByRole('button');
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to start playback')).toBeInTheDocument();
      });
    });

    test('should handle volume control', async () => {
      render(<IPFSAudioPlayer {...defaultProps} />);

      const volumeSlider = screen.getAllByTestId('slider')[1]; // Second slider is volume
      fireEvent.change(volumeSlider, { target: { value: '0.5' } });

      expect(mockAudio.volume).toBe(0.5);
    });
  });

  describe('Debug Mode', () => {
    test('should toggle debug panel', async () => {
      render(<IPFSAudioPlayer {...defaultProps} />);

      const debugButton = screen.getByText('Debug');
      fireEvent.click(debugButton);

      expect(screen.getByText('Debug Information')).toBeInTheDocument();
      expect(screen.getByText(/Audio URL:/)).toBeInTheDocument();
      expect(screen.getByText(/Loading Stage:/)).toBeInTheDocument();
    });

    test('should show error details in debug mode', async () => {
      (playbackUrlResolver.resolveAudioUrl as jest.Mock).mockRejectedValue(
        new Error('Detailed error message')
      );

      render(<IPFSAudioPlayer {...defaultProps} />);

      // Enable debug mode
      const debugButton = screen.getByText('Debug');
      fireEvent.click(debugButton);

      await waitFor(() => {
        expect(screen.getByText('Detailed error message')).toBeInTheDocument();
      });
    });

    test('should provide debug actions', async () => {
      render(<IPFSAudioPlayer {...defaultProps} />);

      const debugButton = screen.getByText('Debug');
      fireEvent.click(debugButton);

      expect(screen.getByText('Force Reload')).toBeInTheDocument();
      expect(screen.getByText('Test Access')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Test Access'));

      await waitFor(() => {
        expect(simpleIPFSService.validateAudioAccess).toHaveBeenCalled();
      });
    });
  });

  describe('Network Quality Adaptation', () => {
    test('should select high quality for fast connection', () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 15,
        },
        writable: true,
      });

      render(<IPFSAudioPlayer {...defaultProps} />);

      expect(screen.getByText(/high_quality.*320kbps/)).toBeInTheDocument();
    });

    test('should select mobile quality for slow connection', () => {
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
        },
        writable: true,
      });

      render(<IPFSAudioPlayer {...defaultProps} />);

      expect(screen.getByText(/mobile.*128kbps/)).toBeInTheDocument();
    });
  });

  describe('NFT Access Control', () => {
    test('should check NFT ownership for gated content', async () => {
      render(
        <IPFSAudioPlayer 
          {...defaultProps} 
          nftContract="0x123" 
          tokenId="1" 
        />
      );

      await waitFor(() => {
        expect(web3Service.checkNFTOwnership).toHaveBeenCalledWith(
          '0x123',
          '1',
          '0x123'
        );
      });
    });

    test('should show connect wallet for non-connected users', async () => {
      (web3Service.getCurrentAccount as jest.Mock).mockReturnValue(null);

      render(
        <IPFSAudioPlayer 
          {...defaultProps} 
          nftContract="0x123" 
          tokenId="1" 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Connect Wallet'));

      expect(web3Service.connectWallet).toHaveBeenCalled();
    });
  });

  describe('Audio Events', () => {
    test('should handle audio time updates', () => {
      render(<IPFSAudioPlayer {...defaultProps} />);

      // Simulate time update
      const timeUpdateHandler = mockAudio.addEventListener.mock.calls
        .find(call => call[0] === 'timeupdate')?.[1];

      if (timeUpdateHandler) {
        mockAudio.currentTime = 60;
        timeUpdateHandler();
      }

      // Check if time is displayed (would need to check slider value in real implementation)
      expect(mockAudio.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
    });

    test('should handle audio errors', async () => {
      render(<IPFSAudioPlayer {...defaultProps} />);

      // Simulate audio error
      const errorHandler = mockAudio.addEventListener.mock.calls
        .find(call => call[0] === 'error')?.[1];

      if (errorHandler) {
        mockAudio.error = { code: 2, message: 'Network error' }; // MEDIA_ERR_NETWORK
        errorHandler();
      }

      await waitFor(() => {
        expect(screen.getByText('Network error during playback')).toBeInTheDocument();
      });
    });
  });
});