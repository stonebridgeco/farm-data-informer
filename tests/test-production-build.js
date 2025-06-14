// Test production build API functionality
console.log('🧪 Testing Production Build API Access...\n');

// Test USDA NASS API with the embedded key
async function testProductionAPIs() {
  const usdaKey = '88E78590-B183-3368-BE7C-5BA018A27A8D';
  const noaaKey = 'sNtsmDCZxpieEwvusACCoTrjRwmhQmxM';
  const weatherKey = 'dabc85603c4364f216151472dd8ef575';
  
  console.log('📊 Testing USDA NASS API...');
  try {
    const response = await fetch(`https://quickstats.nass.usda.gov/api/api_GET/?key=${usdaKey}&source_desc=CENSUS&sector_desc=CROPS&group_desc=FIELD%20CROPS&commodity_desc=CORN&statisticcat_desc=YIELD&agg_level_desc=COUNTY&state_alpha=IA&county_code=169&year=2022&format=JSON`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ USDA NASS: Working - Found ${data.data?.length || 0} records`);
      if (data.data?.[0]) {
        console.log(`   Latest yield: ${data.data[0].Value} ${data.data[0].unit_desc}`);
      }
    } else {
      console.log(`❌ USDA NASS: Failed - Status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ USDA NASS: Error - ${error.message}`);
  }

  console.log('\n🌡️ Testing OpenWeather API...');
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=42.0308&lon=-93.6319&appid=${weatherKey}&units=imperial`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ OpenWeather: Working - ${data.main.temp}°F, ${data.weather[0].description}`);
    } else {
      console.log(`❌ OpenWeather: Failed - Status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ OpenWeather: Error - ${error.message}`);
  }

  console.log('\n🌊 Testing EPA ATTAINS API...');
  try {
    const response = await fetch('https://attains.epa.gov/attains-public/api/assessments?state=IA&assessmentUnitIdentifier=IA_10160001_01');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ EPA ATTAINS: Working - Found ${data.items?.length || 0} assessments`);
    } else {
      console.log(`❌ EPA ATTAINS: Failed - Status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ EPA ATTAINS: Error - ${error.message}`);
  }

  console.log('\n🏔️ Testing Open Elevation API...');
  try {
    const response = await fetch('https://api.open-elevation.com/api/v1/lookup?locations=42.0308,-93.6319');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Open Elevation: Working - ${data.results[0].elevation}m elevation`);
    } else {
      console.log(`❌ Open Elevation: Failed - Status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Open Elevation: Error - ${error.message}`);
  }

  console.log('\n🎯 Production Build API Test Complete!');
}

testProductionAPIs().catch(console.error);
