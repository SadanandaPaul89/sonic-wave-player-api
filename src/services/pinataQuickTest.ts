/**
 * Quick Pinata Test - Console-based diagnostic
 * Run this in browser console to quickly test Pinata connection
 */

import { IPFS_CONFIG } from '@/config/environment';

/**
 * Quick test function that can be called from browser console
 */
export async function quickPinataTest(): Promise<void> {
  console.log('🔍 Quick Pinata Test Starting...\n');

  // Test 1: Check credentials
  console.log('1. Checking credentials...');
  if (!IPFS_CONFIG.pinata.jwt && (!IPFS_CONFIG.pinata.apiKey || !IPFS_CONFIG.pinata.secretKey)) {
    console.error('❌ Missing Pinata credentials in environment variables');
    console.log('   Make sure VITE_PINATA_JWT or (VITE_PINATA_API_KEY and VITE_PINATA_SECRET_KEY) are set in .env.local');
    return;
  }
  
  if (IPFS_CONFIG.pinata.jwt) {
    console.log('✅ JWT token found (recommended)');
  } else {
    console.log('✅ API key/secret found (legacy)');
  }

  // Test 2: Test authentication
  console.log('\n2. Testing authentication...');
  try {
    // Use JWT authentication if available, fallback to API key/secret
    const headers: Record<string, string> = {};
    
    if (IPFS_CONFIG.pinata.jwt) {
      headers['Authorization'] = `Bearer ${IPFS_CONFIG.pinata.jwt}`;
    } else {
      headers['pinata_api_key'] = IPFS_CONFIG.pinata.apiKey;
      headers['pinata_secret_api_key'] = IPFS_CONFIG.pinata.secretKey;
    }

    const authResponse = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Authentication successful:', authData);
    } else {
      console.error('❌ Authentication failed:', authResponse.status, authResponse.statusText);
      const errorData = await authResponse.json().catch(() => ({}));
      console.log('Error details:', errorData);
      return;
    }
  } catch (error) {
    console.error('❌ Network error during authentication:', error);
    return;
  }

  // Test 3: Check account info
  console.log('\n3. Checking account info...');
  try {
    // Use JWT authentication if available, fallback to API key/secret
    const accountHeaders: Record<string, string> = {};
    
    if (IPFS_CONFIG.pinata.jwt) {
      accountHeaders['Authorization'] = `Bearer ${IPFS_CONFIG.pinata.jwt}`;
    } else {
      accountHeaders['pinata_api_key'] = IPFS_CONFIG.pinata.apiKey;
      accountHeaders['pinata_secret_api_key'] = IPFS_CONFIG.pinata.secretKey;
    }

    const accountResponse = await fetch('https://api.pinata.cloud/data/userPinnedDataTotal', {
      method: 'GET',
      headers: accountHeaders
    });

    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      console.log('✅ Account info:', {
        totalPins: accountData.pin_count,
        totalSize: `${(accountData.pin_size_total / 1024 / 1024).toFixed(2)} MB`,
        sizeWithReplications: `${(accountData.pin_size_with_replications_total / 1024 / 1024).toFixed(2)} MB`
      });
    } else {
      console.warn('⚠️  Could not get account info:', accountResponse.status);
    }
  } catch (error) {
    console.warn('⚠️  Error getting account info:', error);
  }

  // Test 4: List recent pins
  console.log('\n4. Listing recent pins...');
  try {
    // Use JWT authentication if available, fallback to API key/secret
    const pinsHeaders: Record<string, string> = {};
    
    if (IPFS_CONFIG.pinata.jwt) {
      pinsHeaders['Authorization'] = `Bearer ${IPFS_CONFIG.pinata.jwt}`;
    } else {
      pinsHeaders['pinata_api_key'] = IPFS_CONFIG.pinata.apiKey;
      pinsHeaders['pinata_secret_api_key'] = IPFS_CONFIG.pinata.secretKey;
    }

    const pinsResponse = await fetch('https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=5', {
      method: 'GET',
      headers: pinsHeaders
    });

    if (pinsResponse.ok) {
      const pinsData = await pinsResponse.json();
      console.log(`✅ Found ${pinsData.count} total pins`);
      
      if (pinsData.rows && pinsData.rows.length > 0) {
        console.log('Recent pins:');
        pinsData.rows.slice(0, 3).forEach((pin: any, index: number) => {
          console.log(`  ${index + 1}. ${pin.ipfs_pin_hash}`);
          console.log(`     Size: ${(pin.size / 1024).toFixed(2)} KB`);
          console.log(`     Date: ${new Date(pin.date_pinned).toLocaleDateString()}`);
          console.log(`     Name: ${pin.metadata?.name || 'Unnamed'}`);
        });
      } else {
        console.log('   No pins found in your account');
      }
    } else {
      console.warn('⚠️  Could not list pins:', pinsResponse.status);
    }
  } catch (error) {
    console.warn('⚠️  Error listing pins:', error);
  }

  // Test 5: Upload a small test file
  console.log('\n5. Testing file upload...');
  try {
    const testData = {
      message: 'Pinata quick test file',
      timestamp: new Date().toISOString(),
      testId: Math.random().toString(36).substring(7)
    };

    const testFile = new File([JSON.stringify(testData, null, 2)], 'pinata-quick-test.json', {
      type: 'application/json'
    });

    const formData = new FormData();
    formData.append('file', testFile);

    const metadata = JSON.stringify({
      name: 'Pinata Quick Test',
      keyvalues: {
        purpose: 'quick-test',
        timestamp: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Use JWT authentication if available, fallback to API key/secret
    const uploadHeaders: Record<string, string> = {};
    
    if (IPFS_CONFIG.pinata.jwt) {
      uploadHeaders['Authorization'] = `Bearer ${IPFS_CONFIG.pinata.jwt}`;
    } else {
      uploadHeaders['pinata_api_key'] = IPFS_CONFIG.pinata.apiKey;
      uploadHeaders['pinata_secret_api_key'] = IPFS_CONFIG.pinata.secretKey;
    }

    const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: uploadHeaders,
      body: formData
    });

    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      console.log('✅ Test file uploaded successfully!');
      console.log('   IPFS Hash:', uploadData.IpfsHash);
      console.log('   Size:', uploadData.PinSize, 'bytes');
      console.log('   Gateway URL:', `https://gateway.pinata.cloud/ipfs/${uploadData.IpfsHash}`);
      console.log('\n🎉 All tests passed! Your Pinata integration is working.');
      console.log('   Check your Pinata dashboard at https://app.pinata.cloud to see the uploaded file.');
    } else {
      const errorData = await uploadResponse.json().catch(() => ({}));
      console.error('❌ Upload failed:', uploadResponse.status, uploadResponse.statusText);
      console.log('Error details:', errorData);
    }
  } catch (error) {
    console.error('❌ Error during upload test:', error);
  }

  console.log('\n📊 Quick test completed!');
}

/**
 * Make the function available globally for console access
 */
if (typeof window !== 'undefined') {
  (window as any).quickPinataTest = quickPinataTest;
}

export default quickPinataTest;