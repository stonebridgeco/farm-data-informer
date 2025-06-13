#!/usr/bin/env node

console.log('🛰️ Testing USGS M2M API with login-token endpoint...\n');

// USGS M2M API credentials
const USGS_M2M_TOKEN = 'AhRDHtmUZ@QN!tGe/gSB7tLxJlE9iRTBgiKO0DBMF8DvyCYOcjGLMMiS4guhsfRewnbD1ODGH_4R1o0S';
const USGS_M2M_BASE_URL = 'https://m2m.cr.usgs.gov/api/api/json/stable';

async function testUSGSTokenAuth() {
  try {
    console.log('🔐 Testing USGS M2M Token Authentication...');
    console.log('Using login-token endpoint as specified by USGS...');
    
    // Use the login-token endpoint as specified on USGS website
    const response = await fetch(`${USGS_M2M_BASE_URL}/login-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'login-token',
        token: USGS_M2M_TOKEN
      })
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ HTTP Error:', errorText);
      return null;
    }
    
    const data = await response.json();
    console.log('Response received:', JSON.stringify(data, null, 2));
    
    if (data.errorCode) {
      console.log('❌ API Error:', data.errorMessage);
      return null;
    }
    
    if (data.data) {
      console.log('✅ Login successful!');
      console.log(`Session token: ${data.data.substring(0, 20)}...`);
      return data.data; // This is the session token
    }
    
    return null;
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    return null;
  }
}

async function testDatasetAccess(sessionToken) {
  try {
    console.log('\n📊 Testing dataset access with session token...');
    
    const response = await fetch(`${USGS_M2M_BASE_URL}/dataset-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': sessionToken
      },
      body: JSON.stringify({
        datasetName: null,
        maxResults: 3
      })
    });
    
    if (!response.ok) {
      console.log('❌ Dataset search failed:', response.status);
      return false;
    }
    
    const data = await response.json();
    
    if (data.errorCode) {
      console.log('❌ Dataset search error:', data.errorMessage);
      return false;
    }
    
    console.log('✅ Dataset search successful!');
    console.log(`Found ${data.data?.length || 0} datasets`);
    
    if (data.data && data.data.length > 0) {
      console.log('\n📋 Available datasets (first 3):');
      data.data.slice(0, 3).forEach((dataset, index) => {
        console.log(`   ${index + 1}. ${dataset.datasetAlias || dataset.collectionName}`);
        if (dataset.abstractText) {
          console.log(`      ${dataset.abstractText.substring(0, 80)}...`);
        }
      });
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Dataset access error:', error.message);
    return false;
  }
}

async function main() {
  const sessionToken = await testUSGSTokenAuth();
  
  if (sessionToken) {
    const datasetSuccess = await testDatasetAccess(sessionToken);
    
    // Logout
    try {
      console.log('\n🚪 Logging out...');
      await fetch(`${USGS_M2M_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': sessionToken
        }
      });
      console.log('✅ Logout successful');
    } catch (e) {
      console.log('⚠️ Logout error (not critical)');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🛰️ USGS M2M API TEST SUMMARY');
    console.log('='.repeat(50));
    
    if (datasetSuccess) {
      console.log('✅ USGS M2M API fully working!');
      console.log('✅ Token authentication successful');
      console.log('✅ Dataset access confirmed');
      console.log('\n🚀 Ready to implement:');
      console.log('- Landsat imagery integration');
      console.log('- NDVI agricultural analysis');
      console.log('- Satellite layers in FarmMap');
      console.log('- Real-time crop monitoring');
    } else {
      console.log('⚠️ Authentication works but limited dataset access');
      console.log('- Check account permissions');
      console.log('- Verify dataset access rights');
    }
  } else {
    console.log('\n' + '='.repeat(50));
    console.log('🛰️ USGS M2M API TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('❌ Token authentication failed');
    console.log('- Verify token is correct');
    console.log('- Check account has M2M API access');
    console.log('- Contact USGS support if needed');
  }
}

main().catch(console.error);
