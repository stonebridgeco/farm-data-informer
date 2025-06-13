#!/usr/bin/env node

// USGS M2M API Token Test
// Testing token: DtIMKzKLmqs4O8egW7SzAvUCxYoF7PXQtnqn@ps7CM5sYqvTO1Bt@lwmLW!L2JQY

console.log('🛰️ Testing USGS M2M API Token...\n');

const USGS_M2M_BASE_URL = 'https://m2m.cr.usgs.gov/api/api/json/stable';
const API_TOKEN = 'DtIMKzKLmqs4O8egW7SzAvUCxYoF7PXQtnqn@ps7CM5sYqvTO1Bt@lwmLW!L2JQY';

async function testUSGSToken() {
  try {
    console.log('🔐 Step 1: Testing Authentication...');
    
    // Test login endpoint
    const loginResponse = await fetch(`${USGS_M2M_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: API_TOKEN, // Some APIs use token as username
        password: '',
        catalogId: 'EE' // Earth Explorer catalog
      })
    });

    console.log(`   Response Status: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login Response:', JSON.stringify(loginData, null, 2));
      
      if (loginData.data) {
        const sessionKey = loginData.data;
        console.log(`✅ Session Key obtained: ${sessionKey.substring(0, 20)}...`);
        
        // Test datasets endpoint
        console.log('\n📊 Step 2: Testing Dataset Access...');
        const datasetsResponse = await fetch(`${USGS_M2M_BASE_URL}/datasets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': sessionKey
          },
          body: JSON.stringify({
            catalog: 'EE',
            includeMessages: true
          })
        });

        if (datasetsResponse.ok) {
          const datasetsData = await datasetsResponse.json();
          console.log('✅ Datasets accessible!');
          console.log(`   Found ${datasetsData.data?.length || 0} datasets`);
          
          // Look for Landsat datasets
          const landsatDatasets = datasetsData.data?.filter(ds => 
            ds.datasetAlias?.toLowerCase().includes('landsat')
          ) || [];
          
          if (landsatDatasets.length > 0) {
            console.log('\n🛰️ Available Landsat Datasets:');
            landsatDatasets.slice(0, 3).forEach(ds => {
              console.log(`   - ${ds.datasetAlias}: ${ds.collectionName}`);
            });
          }
          
          return true;
        } else {
          console.log('❌ Datasets access failed:', datasetsResponse.status);
          return false;
        }
      } else {
        console.log('❌ No session key received');
        return false;
      }
    } else {
      console.log('❌ Login failed. Trying alternative authentication...');
      
      // Try direct token authentication
      console.log('\n🔐 Step 1b: Testing Direct Token Authentication...');
      const directResponse = await fetch(`${USGS_M2M_BASE_URL}/datasets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify({
          catalog: 'EE'
        })
      });

      if (directResponse.ok) {
        const data = await directResponse.json();
        console.log('✅ Direct token authentication works!');
        console.log(`   Found ${data.data?.length || 0} datasets`);
        return true;
      } else {
        console.log('❌ Direct token authentication failed:', directResponse.status);
        const errorText = await directResponse.text();
        console.log('   Error details:', errorText);
        return false;
      }
    }
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
}

async function runTest() {
  console.log('Token:', API_TOKEN.substring(0, 20) + '...');
  console.log('Base URL:', USGS_M2M_BASE_URL);
  console.log('-'.repeat(50));
  
  const success = await testUSGSToken();
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 USGS M2M API Token Test: SUCCESS!');
    console.log('✅ Ready to integrate satellite data into FarmMap');
  } else {
    console.log('🚨 USGS M2M API Token Test: FAILED');
    console.log('❌ Token may be invalid or API endpoints changed');
    console.log('💡 Check USGS documentation for current API format');
  }
}

runTest().catch(console.error);
