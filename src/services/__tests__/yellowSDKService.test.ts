// Unit tests for Yellow SDK Service

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { yellowSDKService } from '../yellowSDKService';
import { UserSession, PaymentChannel } from '@/types/yellowSDK';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send(data: string) {
    // Mock send - could be extended to simulate responses
    console.log('Mock WebSocket send:', data);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000, reason }));
    }
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  // Helper method to simulate errors
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe('YellowSDKService', () => {
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    // Reset service state
    yellowSDKService.disconnect();
    vi.clearAllMocks();
  });

  afterEach(() => {
    yellowSDKService.disconnect();
  });

  describe('Connection Management', () => {
    it('should initialize connection successfully', async () => {
      const connectionPromise = yellowSDKService.initializeConnection();
      
      // Wait for connection to be established
      await expect(connectionPromise).resolves.toBeUndefined();
      expect(yellowSDKService.getConnectionStatus()).toBe(true);
    });

    it('should handle connection errors', async () => {
      // Mock WebSocket to fail immediately
      const originalWebSocket = global.WebSocket;
      global.WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            this.simulateError();
          }, 50);
        }
      } as any;

      await expect(yellowSDKService.initializeConnection()).rejects.toThrow('Connection failed');
      
      // Restore original WebSocket
      global.WebSocket = originalWebSocket;
    });

    it('should emit connected event on successful connection', async () => {
      const connectedCallback = vi.fn();
      yellowSDKService.on('connected', connectedCallback);

      await yellowSDKService.initializeConnection();

      expect(connectedCallback).toHaveBeenCalled();
    });

    it('should handle disconnection and emit disconnected event', async () => {
      const disconnectedCallback = vi.fn();
      yellowSDKService.on('disconnected', disconnectedCallback);

      await yellowSDKService.initializeConnection();
      yellowSDKService.disconnect();

      expect(disconnectedCallback).toHaveBeenCalled();
      expect(yellowSDKService.getConnectionStatus()).toBe(false);
    });
  });

  describe('Authentication', () => {
    beforeEach(async () => {
      await yellowSDKService.initializeConnection();
    });

    it('should authenticate user successfully', async () => {
      const walletAddress = '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4';
      const signature = 'mock_signature';

      // Start authentication
      const authPromise = yellowSDKService.authenticateUser(walletAddress, signature);

      // Simulate authentication response
      setTimeout(() => {
        const ws = (yellowSDKService as any).ws as MockWebSocket;
        ws.simulateMessage({
          type: 'auth',
          payload: {
            walletAddress,
            signature,
            timestamp: Date.now()
          },
          timestamp: Date.now(),
          id: 'auth_test'
        });
      }, 100);

      const session = await authPromise;

      expect(session).toBeDefined();
      expect(session.walletAddress).toBe(walletAddress);
      expect(yellowSDKService.getAuthenticationStatus()).toBe(true);
    });

    it('should emit authenticated event', async () => {
      const authenticatedCallback = vi.fn();
      yellowSDKService.on('authenticated', authenticatedCallback);

      const walletAddress = '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4';
      const authPromise = yellowSDKService.authenticateUser(walletAddress, 'signature');

      setTimeout(() => {
        const ws = (yellowSDKService as any).ws as MockWebSocket;
        ws.simulateMessage({
          type: 'auth',
          payload: { walletAddress, signature: 'signature', timestamp: Date.now() },
          timestamp: Date.now(),
          id: 'auth_test'
        });
      }, 100);

      await authPromise;

      expect(authenticatedCallback).toHaveBeenCalled();
    });

    it('should timeout authentication if no response', async () => {
      const walletAddress = '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4';
      
      await expect(
        yellowSDKService.authenticateUser(walletAddress, 'signature')
      ).rejects.toThrow('Authentication timeout');
    }, 15000);
  });

  describe('Payment Channels', () => {
    beforeEach(async () => {
      await yellowSDKService.initializeConnection();
      
      // Authenticate first
      const authPromise = yellowSDKService.authenticateUser('0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', 'signature');
      setTimeout(() => {
        const ws = (yellowSDKService as any).ws as MockWebSocket;
        ws.simulateMessage({
          type: 'auth',
          payload: { walletAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', signature: 'signature', timestamp: Date.now() },
          timestamp: Date.now(),
          id: 'auth_test'
        });
      }, 100);
      await authPromise;
    });

    it('should create payment channel successfully', async () => {
      const channelPromise = yellowSDKService.createPaymentChannel();

      setTimeout(() => {
        const ws = (yellowSDKService as any).ws as MockWebSocket;
        ws.simulateMessage({
          type: 'channel_update',
          payload: {
            channelId: 'channel_123',
            balance: 1000,
            lockedBalance: 0,
            lastTransaction: null
          },
          timestamp: Date.now(),
          id: 'channel_test'
        });
      }, 100);

      const channel = await channelPromise;

      expect(channel).toBeDefined();
      expect(channel.channelId).toBe('channel_123');
      expect(channel.balance).toBe(1000);
    });

    it('should process transactions', async () => {
      // First create a channel
      const channelPromise = yellowSDKService.createPaymentChannel();
      setTimeout(() => {
        const ws = (yellowSDKService as any).ws as MockWebSocket;
        ws.simulateMessage({
          type: 'channel_update',
          payload: {
            channelId: 'channel_123',
            balance: 1000,
            lockedBalance: 0,
            lastTransaction: null
          },
          timestamp: Date.now(),
          id: 'channel_test'
        });
      }, 100);
      await channelPromise;

      // Now process a transaction
      const transactionPromise = yellowSDKService.processTransaction(100, 'content_123');

      setTimeout(() => {
        const ws = (yellowSDKService as any).ws as MockWebSocket;
        ws.simulateMessage({
          type: 'transaction',
          payload: {
            transaction: {
              id: 'tx_123',
              channelId: 'channel_123',
              amount: 100,
              contentId: 'content_123',
              timestamp: Date.now(),
              type: 'payment',
              status: 'confirmed'
            },
            newBalance: 900
          },
          timestamp: Date.now(),
          id: 'transaction_test'
        });
      }, 100);

      const transaction = await transactionPromise;

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(100);
      expect(transaction.contentId).toBe('content_123');
      expect(yellowSDKService.getBalance()).toBe(900);
    });
  });

  describe('Event Handling', () => {
    it('should handle error messages', async () => {
      const errorCallback = vi.fn();
      yellowSDKService.on('error', errorCallback);

      await yellowSDKService.initializeConnection();

      const ws = (yellowSDKService as any).ws as MockWebSocket;
      ws.simulateMessage({
        type: 'error',
        payload: {
          code: 'TEST_ERROR',
          message: 'Test error message'
        },
        timestamp: Date.now(),
        id: 'error_test'
      });

      expect(errorCallback).toHaveBeenCalledWith({
        type: 'error',
        payload: {
          code: 'TEST_ERROR',
          message: 'Test error message'
        },
        timestamp: expect.any(Number),
        id: 'error_test'
      });
    });

    it('should handle unknown message types gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await yellowSDKService.initializeConnection();

      const ws = (yellowSDKService as any).ws as MockWebSocket;
      ws.simulateMessage({
        type: 'unknown_type',
        payload: {},
        timestamp: Date.now(),
        id: 'unknown_test'
      });

      expect(consoleSpy).toHaveBeenCalledWith('Unknown message type:', 'unknown_type');
      
      consoleSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    it('should return correct connection status', () => {
      expect(yellowSDKService.getConnectionStatus()).toBe(false);
    });

    it('should return correct authentication status', () => {
      expect(yellowSDKService.getAuthenticationStatus()).toBe(false);
    });

    it('should return current session', () => {
      expect(yellowSDKService.getCurrentSession()).toBeNull();
    });

    it('should return current balance', () => {
      expect(yellowSDKService.getBalance()).toBe(0);
    });
  });
});