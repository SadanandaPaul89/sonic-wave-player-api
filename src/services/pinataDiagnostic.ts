/**
 * Pinata Diagnostic Tool
 * Tests Pinata API connection and uploads to help troubleshoot dashboard issues
 */

import { IPFS_CONFIG } from '@/config/environment';

interface PinataDiagnosticResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export class PinataDiagnostic {
  private results: PinataDiagnosticResult[] = [];

  /**
   * Run comprehensive Pinata diagnostics
   */
  async runDiagnostics(): Promise<PinataDiagnosticResult[]> {
    this.results = [];
    
    console.log('🔍 Starting Pinata Diagnostics...\n');

    // Step 1: Check credentials
    await this.checkCredentials();
    
    // Step 2: Test authentication
    await this.testAuthentication();
    
    // Step 3: Check account info
    await this.checkAccountInfo();
    
    // Step 4: List existing pins
    await this.listPins();
    
    // Step 5: Test file upload
    await this.testFileUpload();

    // Print results
    this.printResults();
    
    return this.results;
  }

  /**
   * Step 1: Check if credentials are configured
   */
  private async checkCredentials(): Promise<void> {
    const step = 'Check Credentials';
    
    try {
      const hasApiKey = !!IPFS_CONFIG.pinata.apiKey;
      const hasSecretKey = !!IPFS_CONFIG.pinata.secretKey;
      const hasJWT = !!IPFS_CONFIG.pinata.jwt;
      
      if (hasJWT) {
        this.addResult(step, true, 'Pinata JWT token found in environment (recommended)', {
          jwtLength: IPFS_CONFIG.pinata.jwt.length,
          authMethod: 'JWT'
        });
      } else if (hasApiKey && hasSecretKey) {
        this.addResult(step, true, 'Pinata API key/secret found in environment (legacy)', {
          apiKeyLength: IPFS_CONFIG.pinata.apiKey.length,
          secretKeyLength: IPFS_CONFIG.pinata.secretKey.length,
          authMethod: 'API Key/Secret'
        });
      } else {
        this.addResult(step, false, 'Missing Pinata credentials', {
          hasApiKey,
          hasSecretKey,
          hasJWT
        });
      }
    } catch (error) {
      this.addResult(step, false, 'Error checking credentials', undefined, error.message);
    }
  }

  /**
   * Step 2: Test authentication with Pinata API
   */
  private async testAuthentication(): Promise<void> {
    const step = 'Test Authentication';
    
    try {
      // Use JWT authentication if available, fallback to API key/secret
      const headers: Record<string, string> = {};
      
      if (IPFS_CONFIG.pinata.jwt) {
        headers['Authorization'] = `Bearer ${IPFS_CONFIG.pinata.jwt}`;
      } else if (IPFS_CONFIG.pinata.apiKey && IPFS_CONFIG.pinata.secretKey) {
        headers['pinata_api_key'] = IPFS_CONFIG.pinata.apiKey;
        headers['pinata_secret_api_key'] = IPFS_CONFIG.pinata.secretKey;
      } else {
        this.addResult(step, false, 'No authentication credentials available');
        return;
      }

      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        this.addResult(step, true, 'Authentication successful', data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.addResult(step, false, `Authentication failed: ${response.status} ${response.statusText}`, errorData);
      }
    } catch (error) {
      this.addResult(step, false, 'Network error during authentication', undefined, error.message);
    }
  }

  /**
   * Step 3: Get account information
   */
  private async checkAccountInfo(): Promise<void> {
    const step = 'Check Account Info';
    
    try {
      // Use JWT authentication if available, fallback to API key/secret
      const headers: Record<string, string> = {};
      
      if (IPFS_CONFIG.pinata.jwt) {
        headers['Authorization'] = `Bearer ${IPFS_CONFIG.pinata.jwt}`;
      } else if (IPFS_CONFIG.pinata.apiKey && IPFS_CONFIG.pinata.secretKey) {
        headers['pinata_api_key'] = IPFS_CONFIG.pinata.apiKey;
        headers['pinata_secret_api_key'] = IPFS_CONFIG.pinata.secretKey;
      } else {
        this.addResult(step, false, 'No authentication credentials available');
        return;
      }

      const response = await fetch('https://api.pinata.cloud/data/userPinnedDataTotal', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        this.addResult(step, true, 'Account info retrieved', {
          pinCount: data.pin_count,
          pinSizeTotal: data.pin_size_total,
          pinSizeWithReplicationsTotal: data.pin_size_with_replications_total
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.addResult(step, false, `Failed to get account info: ${response.status}`, errorData);
      }
    } catch (error) {
      this.addResult(step, false, 'Error getting account info', undefined, error.message);
    }
  }

  /**
   * Step 4: List existing pins
   */
  private async listPins(): Promise<void> {
    const step = 'List Pins';
    
    try {
      // Use JWT authentication if available, fallback to API key/secret
      const headers: Record<string, string> = {};
      
      if (IPFS_CONFIG.pinata.jwt) {
        headers['Authorization'] = `Bearer ${IPFS_CONFIG.pinata.jwt}`;
      } else if (IPFS_CONFIG.pinata.apiKey && IPFS_CONFIG.pinata.secretKey) {
        headers['pinata_api_key'] = IPFS_CONFIG.pinata.apiKey;
        headers['pinata_secret_api_key'] = IPFS_CONFIG.pinata.secretKey;
      } else {
        this.addResult(step, false, 'No authentication credentials available');
        return;
      }

      const response = await fetch('https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=10', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        this.addResult(step, true, `Found ${data.count} pins`, {
          count: data.count,
          pins: data.rows?.slice(0, 3).map((pin: any) => ({
            ipfsHash: pin.ipfs_pin_hash,
            size: pin.size,
            dateUploaded: pin.date_pinned,
            metadata: pin.metadata
          }))
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.addResult(step, false, `Failed to list pins: ${response.status}`, errorData);
      }
    } catch (error) {
      this.addResult(step, false, 'Error listing pins', undefined, error.message);
    }
  }

  /**
   * Step 5: Test file upload
   */
  private async testFileUpload(): Promise<void> {
    const step = 'Test File Upload';
    
    try {
      // Create a small test file
      const testContent = JSON.stringify({
        message: 'Pinata diagnostic test file',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substring(7)
      }, null, 2);
      
      const testFile = new File([testContent], 'pinata-diagnostic-test.json', {
        type: 'application/json'
      });

      const formData = new FormData();
      formData.append('file', testFile);

      const metadata = JSON.stringify({
        name: 'Pinata Diagnostic Test',
        keyvalues: {
          purpose: 'diagnostic',
          timestamp: new Date().toISOString()
        }
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append('pinataOptions', options);

      // Use JWT authentication if available, fallback to API key/secret
      const headers: Record<string, string> = {};
      
      if (IPFS_CONFIG.pinata.jwt) {
        headers['Authorization'] = `Bearer ${IPFS_CONFIG.pinata.jwt}`;
      } else if (IPFS_CONFIG.pinata.apiKey && IPFS_CONFIG.pinata.secretKey) {
        headers['pinata_api_key'] = IPFS_CONFIG.pinata.apiKey;
        headers['pinata_secret_api_key'] = IPFS_CONFIG.pinata.secretKey;
      } else {
        this.addResult(step, false, 'No authentication credentials available');
        return;
      }

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers,
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        this.addResult(step, true, 'Test file uploaded successfully!', {
          ipfsHash: data.IpfsHash,
          pinSize: data.PinSize,
          timestamp: data.Timestamp,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.addResult(step, false, `Upload failed: ${response.status} ${response.statusText}`, errorData);
      }
    } catch (error) {
      this.addResult(step, false, 'Error during test upload', undefined, error.message);
    }
  }

  /**
   * Add a result to the diagnostics
   */
  private addResult(step: string, success: boolean, message: string, data?: any, error?: string): void {
    this.results.push({
      step,
      success,
      message,
      data,
      error
    });
  }

  /**
   * Print formatted results to console
   */
  private printResults(): void {
    console.log('\n📊 Pinata Diagnostic Results:');
    console.log('================================\n');

    this.results.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${icon} ${result.step}`);
      console.log(`   ${result.message}`);
      
      if (result.data) {
        console.log('   Data:', JSON.stringify(result.data, null, 2));
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      console.log('');
    });

    // Summary
    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    
    console.log(`📈 Summary: ${successCount}/${totalCount} tests passed`);
    
    if (successCount === totalCount) {
      console.log('🎉 All diagnostics passed! Your Pinata integration should be working.');
    } else {
      console.log('⚠️  Some diagnostics failed. Check the errors above for troubleshooting.');
    }
  }

  /**
   * Quick test method for immediate feedback
   */
  static async quickTest(): Promise<boolean> {
    const diagnostic = new PinataDiagnostic();
    const results = await diagnostic.runDiagnostics();
    return results.every(r => r.success);
  }
}

/**
 * Convenience function to run diagnostics
 */
export async function runPinataDiagnostics(): Promise<PinataDiagnosticResult[]> {
  const diagnostic = new PinataDiagnostic();
  return await diagnostic.runDiagnostics();
}

/**
 * Quick test function
 */
export async function testPinataConnection(): Promise<boolean> {
  return await PinataDiagnostic.quickTest();
}