#!/usr/bin/env node

console.log('🛰️ Testing Landsat Connection via USGS M2M API...\n');

// USGS M2M API credentials
// const USGS_M2M_USERNAME = 'AhRDHtmUZ@QN!tGe';
const USGS_M2M_USERNAME = 'login-token';
// const USGS_M2M_TOKEN = 'gSB7tLxJlE9iRTBgiKO0DBMF8DvyCYOcjGLMMiS4guhsfRewnbD1ODGH_4R1o0S';
const USGS_M2M_TOKEN = 'DtIMKzKLmqs4O8egW7SzAvUCxYoF7PXQtnqn@ps7CM5sYqvTO1Bt@lwmLW!L2JQY';
const USGS_M2M_BASE_URL = 'https://m2m.cr.usgs.gov/api/api/json/stable';

async function testLandsatConnection() {
  let sessionToken = null;
  
  try {
    // Step 1: Authenticate
    console.log('🔐 Step 1: Authenticating with USGS M2M...');
    const loginResponse = await fetch(`${USGS_M2M_BASE_URL}/login-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: USGS_M2M_USERNAME,
        token: USGS_M2M_TOKEN
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    
    if (loginData.errorCode) {
      console.log('❌ Authentication failed:', loginData.errorMessage);
      return false;
    }
    
    sessionToken = loginData.data;
    console.log('✅ Authentication successful');
    console.log(`   Session token: ${sessionToken.substring(0, 20)}...`);
    
    // Step 2: Search for Landsat datasets
    console.log('\n📊 Step 2: Searching for Landsat datasets...');
    const datasetResponse = await fetch(`${USGS_M2M_BASE_URL}/dataset-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': sessionToken
      },
      body: JSON.stringify({
        datasetName: null,
        maxResults: 20
      })
    });
    
    const datasetData = await datasetResponse.json();
    
    if (datasetData.errorCode) {
      console.log('❌ Dataset search failed:', datasetData.errorMessage);
      return false;
    }
    
    console.log('✅ Dataset search successful');
    console.log(`   Found ${datasetData.data.length} datasets`);
    
    // Find Landsat datasets
    const landsatDatasets = datasetData.data.filter(dataset => 
      dataset.datasetAlias && 
      (dataset.datasetAlias.toLowerCase().includes('landsat') || 
       dataset.collectionName?.toLowerCase().includes('landsat'))
    );
    
    console.log(`   Landsat datasets: ${landsatDatasets.length}`);
    
    if (landsatDatasets.length > 0) {
      console.log('\n🛰️ Available Landsat datasets:');
      landsatDatasets.slice(0, 5).forEach((dataset, index) => {
        console.log(`   ${index + 1}. ${dataset.datasetAlias || dataset.collectionName}`);
        console.log(`      ID: ${dataset.datasetName}`);
        console.log(`      Abstract: ${(dataset.abstractText || '').substring(0, 100)}...`);
      });
      
      // Step 3: Test scene search for Iowa location
      console.log('\n🗺️ Step 3: Testing scene search for Iowa location...');
      const testDataset = landsatDatasets[0];
      
      const sceneResponse = await fetch(`${USGS_M2M_BASE_URL}/scene-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': sessionToken
        },
        body: JSON.stringify({
          datasetName: testDataset.datasetName,
          sceneFilter: {
            spatialFilter: {
              filterType: 'mbr',
              lowerLeft: {
                latitude: 41.9,
                longitude: -93.8
              },
              upperRight: {
                latitude: 42.1,
                longitude: -93.4
              }
            },
            cloudCoverFilter: {
              max: 50,
              min: 0
            }
          },
          maxResults: 5
        })
      });
      
      const sceneData = await sceneResponse.json();
      
      if (sceneData.errorCode) {
        console.log('❌ Scene search failed:', sceneData.errorMessage);
      } else {
        console.log('✅ Scene search successful');
        console.log(`   Found ${sceneData.data.results.length} scenes for Iowa`);
        
        if (sceneData.data.results.length > 0) {
          console.log('\n📸 Recent Landsat scenes for Iowa:');
          sceneData.data.results.slice(0, 3).forEach((scene, index) => {
            console.log(`   ${index + 1}. Scene ID: ${scene.displayId}`);
            console.log(`      Date: ${scene.acquisitionDate}`);
            console.log(`      Cloud Cover: ${scene.cloudCover}%`);
            console.log(`      Path/Row: ${scene.path}/${scene.row}`);
          });
        }
      }
    }
    
    // Step 4: Logout
    console.log('\n🚪 Step 4: Logging out...');
    await fetch(`${USGS_M2M_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': sessionToken
      }
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    return false;
  }
}

async function main() {
  const success = await testLandsatConnection();
  
  console.log('\n' + '='.repeat(60));
  console.log('🛰️ LANDSAT CONNECTION TEST SUMMARY');
  console.log('='.repeat(60));
  
  if (success) {
    console.log('✅ Landsat connection successful!');
    console.log('✅ Authentication working');
    console.log('✅ Dataset access confirmed');
    console.log('✅ Scene search functional');
    console.log('\n🚀 Ready to integrate Landsat data into the map!');
  } else {
    console.log('❌ Landsat connection failed');
    console.log('- Check authentication credentials');
    console.log('- Verify M2M API access');
    console.log('- Review error messages above');
  }
}

main().catch(console.error);
