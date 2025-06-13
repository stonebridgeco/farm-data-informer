#!/usr/bin/env node

console.log('🛰️ Testing USGS M2M API with Correct Endpoint Structure...\n');

// USGS M2M API credentials
const USGS_M2M_USERNAME = 'login-token';
const USGS_M2M_PASSWORD = 'DtIMKzKLmqs4O8egW7SzAvUCxYoF7PXQtnqn@ps7CM5sYqvTO1Bt@lwmLW!L2JQY';
const USGS_M2M_BASE_URL = 'https://m2m.cr.usgs.gov/api/api/json/stable';

async function testUSGSLogin() {
  try {
    console.log('🔐 Testing USGS M2M Login...');
    
    // The login endpoint doesn't need /login suffix for M2M API
    const response = await fetch(`${USGS_M2M_BASE_URL}/login-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: USGS_M2M_USERNAME,
        token: USGS_M2M_PASSWORD
      })
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const errorText = await response.text();
      console.log('❌ Login failed');
      console.log('Error:', errorText);
      
      // Try alternative login method
      return await testAlternativeLogin();
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    return await testAlternativeLogin();
  }
}

async function testAlternativeLogin() {
  try {
    console.log('\n🔄 Trying alternative login method...');
    
    // Try without /login-token suffix, just the token directly
    const response = await fetch(`${USGS_M2M_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: USGS_M2M_PASSWORD
      })
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Alternative login successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const errorText = await response.text();
      console.log('❌ Alternative login failed');
      console.log('Error:', errorText);
      return null;
    }
    
  } catch (error) {
    console.log('❌ Alternative login error:', error.message);
    return null;
  }
}

async function main() {
  const loginResult = await testUSGSLogin();
  
  console.log('\n' + '='.repeat(50));
  console.log('🛰️ USGS M2M API TEST SUMMARY');
  console.log('='.repeat(50));
  
  if (loginResult && !loginResult.errorCode) {
    console.log('✅ USGS M2M API access confirmed!');
    console.log('✅ Token is valid and working');
    console.log('\nNext steps:');
    console.log('- Implement USGS M2M service in FarmMap');
    console.log('- Add Landsat imagery layers');
    console.log('- Integrate agricultural indices (NDVI)');
  } else {
    console.log('❌ Unable to authenticate with USGS M2M API');
    console.log('\nPossible solutions:');
    console.log('- Verify token format with USGS documentation');
    console.log('- Check if account has M2M API access enabled');
    console.log('- Contact USGS support for API access verification');
    console.log('- Use token through different authentication method');
  }
}

main().catch(console.error);
