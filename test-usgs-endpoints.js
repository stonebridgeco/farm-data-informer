#!/usr/bin/env node

console.log('🛰️ Testing USGS M2M API with Different Endpoints...\n');

// USGS M2M API credentials
const USGS_M2M_USERNAME = 'login-token';
const USGS_M2M_PASSWORD = 'DtIMKzKLmqs4O8egW7SzAvUCxYoF7PXQtnqn@ps7CM5sYqvTO1Bt@lwmLW!L2JQY';

// Try different possible endpoints
const ENDPOINTS = [
  'https://m2m.cr.usgs.gov/api/api/json/stable',
  'https://m2m.cr.usgs.gov/api/api/json/v1.5.0',
  'https://ers.cr.usgs.gov/login/',
  'https://earthexplorer.usgs.gov/inventory/json/v/1.4.1',
  'https://eros.usgs.gov/ers/login'
];

async function testEndpoint(baseUrl) {
  try {
    console.log(`🔍 Testing endpoint: ${baseUrl}`);
    
    const loginUrl = baseUrl.includes('login') ? baseUrl : `${baseUrl}/login`;
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FarmDataInformer/1.0'
      },
      body: JSON.stringify({
        username: USGS_M2M_USERNAME,
        password: USGS_M2M_PASSWORD
      })
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Success! Response:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return { success: true, endpoint: baseUrl, data };
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Failed: ${errorText.substring(0, 100)}...`);
      return { success: false, endpoint: baseUrl, error: errorText };
    }
    
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
    return { success: false, endpoint: baseUrl, error: error.message };
  }
}

async function main() {
  console.log('Testing multiple USGS endpoints to find the correct one...\n');
  
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log(''); // spacing
  }
  
  console.log('='.repeat(60));
  console.log('🛰️ USGS M2M API ENDPOINT TEST SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  
  if (successful.length > 0) {
    console.log('✅ Found working endpoint(s):');
    successful.forEach(result => {
      console.log(`   - ${result.endpoint}`);
    });
    console.log('\n✅ Your credentials appear to be valid!');
    console.log('✅ Ready to implement USGS M2M integration');
  } else {
    console.log('❌ No working endpoints found');
    console.log('\nPossible issues:');
    console.log('- API endpoint URL may have changed');
    console.log('- Credentials might need different format');
    console.log('- API might require different authentication method');
    console.log('- Network/firewall restrictions');
    
    console.log('\nDebugging info:');
    results.forEach(result => {
      console.log(`   ${result.endpoint}: ${result.error?.substring(0, 50)}...`);
    });
  }
}

main().catch(console.error);
