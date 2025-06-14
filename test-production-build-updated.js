#!/usr/bin/env node

// Production Build Test - Updated with working parameters
// Saved previous params for safety

console.log('🧪 Testing Production Build API Access (Updated Parameters)...\n');

// NEW WORKING PARAMETERS (from test-integrated-system.cjs)
const TEST_COUNTY_FIPS = '19169' // Story County, Iowa
const TEST_STATE = 'IA'

// Working API configurations from integrated test
const APIS = {
  usda_nass: {
    key: '88E78590-B183-3368-BE7C-5BA018A27A8D',
    base: 'https://quickstats.nass.usda.gov/api'
  },
  epa_attains: {
    base: 'https://attains.epa.gov/attains-public/api'
  },
  noaa: {
    key: 'sNtsmDCZxpieEwvusACCoTrjRwmhQmxM',
    base: 'https://www.ncdc.noaa.gov/cdo-web/api/v2'
  },
  openweather: {
    key: 'dabc85603c4364f216151472dd8ef575',
    base: 'https://api.openweathermap.org/data/2.5'
  },
  elevation: {
    base: 'https://api.open-elevation.com/api/v1'
  }
}

// Test USDA NASS with exact working parameters
async function testUSDANASS() {
  try {
    console.log('📊 Testing USDA NASS API (Updated Parameters)...');
    
    // Use exact same parameters as working integrated test
    const params = new URLSearchParams({
      key: APIS.usda_nass.key,
      source_desc: 'CENSUS',
      sector_desc: 'CROPS',
      group_desc: 'FIELD CROPS',
      commodity_desc: 'CORN',
      statisticcat_desc: 'YIELD',
      agg_level_desc: 'COUNTY',
      state_alpha: TEST_STATE,
      county_code: TEST_COUNTY_FIPS.slice(-3), // Last 3 digits
      year: '2017',
      format: 'JSON'
    });
    
    const url = `${APIS.usda_nass.base}/api_GET/?${params}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ USDA NASS: Working');
      console.log(`   Found ${data.data?.length || 0} records`);
      if (data.data && data.data[0]) {
        console.log(`   Corn Yield: ${data.data[0].Value} ${data.data[0].unit_desc}`);
      }
      return true;
    } else {
      console.log('❌ USDA NASS: Failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   URL: ${url}`);
      return false;
    }
  } catch (error) {
    console.log('❌ USDA NASS: Error');
    console.log(`   ${error.message}`);
    return false;
  }
}

// Test OpenWeather with working parameters
async function testOpenWeather() {
  try {
    console.log('🌡️ Testing OpenWeather API (Updated Parameters)...');
    
    // Story County coordinates
    const lat = 42.0308;
    const lon = -93.6319;
    
    const url = `${APIS.openweather.base}/weather?lat=${lat}&lon=${lon}&appid=${APIS.openweather.key}&units=imperial`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenWeather: Working');
      console.log(`   ${data.main.temp}°F, ${data.weather[0].description}`);
      return true;
    } else {
      console.log('❌ OpenWeather: Failed');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ OpenWeather: Error');
    console.log(`   ${error.message}`);
    return false;
  }
}

// Test EPA ATTAINS with working parameters  
async function testEPAATTAINS() {
  try {
    console.log('🌊 Testing EPA ATTAINS API...');
    
    const url = `${APIS.epa_attains.base}/domains?state=${TEST_STATE}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ EPA ATTAINS: Working');
      console.log(`   Found ${data.length || 0} domains`);
      return true;
    } else {
      console.log('❌ EPA ATTAINS: Failed');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ EPA ATTAINS: Error');
    console.log(`   ${error.message}`);
    return false;
  }
}

// Test Open Elevation
async function testOpenElevation() {
  try {
    console.log('🏔️ Testing Open Elevation API...');
    
    const lat = 42.0308;
    const lon = -93.6319;
    
    const url = `${APIS.elevation.base}/lookup?locations=${lat},${lon}`;
    const response = await fetch(url);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Open Elevation: Working');
      console.log(`   ${data.results[0].elevation}m elevation`);
      return true;
    } else {
      console.log('❌ Open Elevation: Failed');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Open Elevation: Error');
    console.log(`   ${error.message}`);
    return false;
  }
}

// Run all tests
async function runUpdatedTests() {
  const results = [];
  
  results.push(await testUSDANASS());
  results.push(await testOpenWeather());
  results.push(await testEPAATTAINS());
  results.push(await testOpenElevation());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n🎯 Updated Production Build Test Complete!');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All APIs working with production build!');
  }
}

runUpdatedTests().catch(console.error);

/* PREVIOUS PARAMETERS SAVED FOR SAFETY:
Original USDA test used:
- Different parameter structure
- Demo key instead of working key
- Different query format

Original tests preserved in test-production-build.js
*/
