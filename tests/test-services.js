#!/usr/bin/env node

// Test script to check all API services
console.log('🧪 Testing Farm Data Informer API Services\n');

// Test USDA NASS API
async function testUSDANASS() {
  try {
    console.log('📊 Testing USDA NASS API...');
    const response = await fetch('https://quickstats.nass.usda.gov/api/api_GET/?key=DEMO_KEY&source_desc=CENSUS&sector_desc=CROPS&group_desc=FIELD%20CROPS&commodity_desc=CORN&statisticcat_desc=YIELD&agg_level_desc=COUNTY&state_alpha=IA&year=2017&format=JSON');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ USDA NASS API: Working');
      console.log(`   Found ${data.data?.length || 0} records\n`);
      return true;
    } else {
      console.log('❌ USDA NASS API: Failed');
      console.log(`   Status: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ USDA NASS API: Error');
    console.log(`   ${error.message}\n`);
    return false;
  }
}

// Test EPA ATTAINS API
async function testEPAATTAINS() {
  try {
    console.log('🌊 Testing EPA ATTAINS API...');
    const response = await fetch('https://attains.epa.gov/attains-public/api/assessments?state=IA&assessmentUnitIdentifier=IA_10160001_01');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ EPA ATTAINS API: Working');
      console.log(`   Found ${data.items?.length || 0} assessments\n`);
      return true;
    } else {
      console.log('❌ EPA ATTAINS API: Failed');
      console.log(`   Status: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ EPA ATTAINS API: Error');
    console.log(`   ${error.message}\n`);
    return false;
  }
}

// Test Open Elevation API
async function testOpenElevation() {
  try {
    console.log('🏔️ Testing Open Elevation API...');
    const response = await fetch('https://api.open-elevation.com/api/v1/lookup?locations=42.0308,-93.6319');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Open Elevation API: Working');
      console.log(`   Elevation: ${data.results?.[0]?.elevation || 'N/A'}m\n`);
      return true;
    } else {
      console.log('❌ Open Elevation API: Failed');
      console.log(`   Status: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ Open Elevation API: Error');
    console.log(`   ${error.message}\n`);
    return false;
  }
}

// Test NOAA Climate API
async function testNOAAClimate() {
  try {
    console.log('🌡️ Testing NOAA Climate API...');
    const response = await fetch('https://www.ncdc.noaa.gov/cdo-web/api/v2/stations?limit=1&locationid=FIPS:19169');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ NOAA Climate API: Working');
      console.log(`   Found ${data.results?.length || 0} stations\n`);
      return true;
    } else {
      console.log('❌ NOAA Climate API: Failed');
      console.log(`   Status: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ NOAA Climate API: Error');
    console.log(`   ${error.message}\n`);
    return false;
  }
}

// Test USDA Soil API (will likely fail due to CORS)
async function testUSDAsoil() {
  try {
    console.log('🌱 Testing USDA Soil API...');
    const response = await fetch('https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: "SELECT mukey, muname FROM mapunit WHERE mukey = '753571'"
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ USDA Soil API: Working');
      console.log(`   Found soil data\n`);
      return true;
    } else {
      console.log('❌ USDA Soil API: Failed');
      console.log(`   Status: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ USDA Soil API: Error (Expected - CORS)');
    console.log(`   ${error.message}\n`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API Service Tests...\n');
  
  const results = [];
  
  results.push(await testUSDANASS());
  results.push(await testEPAATTAINS());
  results.push(await testOpenElevation());
  results.push(await testNOAAClimate());
  results.push(await testUSDAsoil());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log('📋 SUMMARY:');
  console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (percentage >= 80) {
    console.log('\n🎉 System Status: READY FOR PRODUCTION');
  } else if (percentage >= 60) {
    console.log('\n⚠️ System Status: PARTIALLY FUNCTIONAL');
  } else {
    console.log('\n🚨 System Status: NEEDS ATTENTION');
  }
}

runAllTests().catch(console.error);
