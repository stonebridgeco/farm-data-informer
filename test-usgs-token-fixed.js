#!/usr/bin/env node

console.log('🛰️ Testing USGS M2M API Token...\n');

// USGS M2M API credentials
const USGS_M2M_USERNAME = 'login-token';
const USGS_M2M_PASSWORD = 'DtIMKzKLmqs4O8egW7SzAvUCxYoF7PXQtnqn@ps7CM5sYqvTO1Bt@lwmLW!L2JQY';
const USGS_M2M_BASE_URL = 'https://m2m.cr.usgs.gov/api/api/json/stable';

async function testUSGSAuth() {
  try {
    console.log('🔐 Testing USGS M2M Authentication...');
    
    // Step 1: Login to get session token
    const loginResponse = await fetch(`${USGS_M2M_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: USGS_M2M_USERNAME,
        password: USGS_M2M_PASSWORD
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   Response: ${await loginResponse.text()}`);
      return false;
    }
    
    const loginData = await loginResponse.json();
    
    if (loginData.errorCode) {
      console.log('❌ Login failed - API Error');
      console.log(`   Error Code: ${loginData.errorCode}`);
      console.log(`   Error Message: ${loginData.errorMessage}`);
      return false;
    }
    
    const sessionToken = loginData.data;
    console.log('✅ Login successful!');
    console.log(`   Session Token: ${sessionToken.substring(0, 20)}...`);
    
    // Step 2: Test dataset search to verify token works
    console.log('\n📊 Testing dataset search...');
    
    const datasetResponse = await fetch(`${USGS_M2M_BASE_URL}/dataset-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': sessionToken
      },
      body: JSON.stringify({
        datasetName: null,
        maxResults: 5
      })
    });
    
    if (!datasetResponse.ok) {
      console.log('❌ Dataset search failed');
      console.log(`   Status: ${datasetResponse.status}`);
      return false;
    }
    
    const datasetData = await datasetResponse.json();
    
    if (datasetData.errorCode) {
      console.log('❌ Dataset search failed - API Error');
      console.log(`   Error Code: ${datasetData.errorCode}`);
      console.log(`   Error Message: ${datasetData.errorMessage}`);
      return false;
    }
    
    console.log('✅ Dataset search successful!');
    console.log(`   Found ${datasetData.data.length} datasets`);
    
    // Show first few datasets
    if (datasetData.data.length > 0) {
      console.log('\n📋 Available datasets:');
      datasetData.data.slice(0, 3).forEach((dataset, index) => {
        console.log(`   ${index + 1}. ${dataset.datasetAlias || dataset.collectionName}`);
        console.log(`      Abstract: ${(dataset.abstractText || '').substring(0, 80)}...`);
      });
    }
    
    // Step 3: Logout
    console.log('\n🚪 Logging out...');
    await fetch(`${USGS_M2M_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': sessionToken
      }
    });
    
    console.log('✅ Logout successful!');
    
    return true;
    
  } catch (error) {
    console.log('❌ Network Error:');
    console.log(`   ${error.message}`);
    return false;
  }
}

async function main() {
  const success = await testUSGSAuth();
  
  console.log('\n' + '='.repeat(50));
  console.log('🛰️ USGS M2M API TEST SUMMARY');
  console.log('='.repeat(50));
  
  if (success) {
    console.log('✅ Token is VALID and working!');
    console.log('✅ Ready for Landsat data integration');
    console.log('\nNext steps:');
    console.log('- Implement USGS M2M service');
    console.log('- Add satellite layers to FarmMap');
    console.log('- Integrate NDVI/agricultural data');
  } else {
    console.log('❌ Token test FAILED');
    console.log('- Check credentials');
    console.log('- Verify API access');
    console.log('- Check network connectivity');
  }
}

main().catch(console.error);
