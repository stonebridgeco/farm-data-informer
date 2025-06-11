#!/usr/bin/env node

/**
 * Comprehensive API Test Suite
 * Tests all Farm Data Informer API integrations
 */

console.log('🌾 Farm Data Informer - Comprehensive API Test Suite\n')

// Test configurations
const TEST_COUNTY_FIPS = '19169' // Story County, Iowa
const TEST_STATE = 'IA'
const TEST_YEAR = 2023

const apis = {
  usda_nass: {
    name: 'USDA NASS QuickStats',
    key: '88E78590-B183-3368-BE7C-5BA018A27A8D',
    base_url: 'https://quickstats.nass.usda.gov/api'
  },
  usda_soil: {
    name: 'USDA Soil Data Access',
    base_url: 'https://SDMDataAccess.sc.egov.usda.gov/Tabular/SDMTabularService.asmx'
  },
  epa_attains: {
    name: 'EPA ATTAINS Water Quality',
    base_url: 'https://attains.epa.gov/attains-public/api'
  },
  noaa: {
    name: 'NOAA Climate Data',
    key: 'sNtsmDCZxpieEwvusACCoTrjRwmhQmxM',
    base_url: 'https://www.ncdc.noaa.gov/cdo-web/api/v2'
  },
  usgs: {
    name: 'USGS Elevation',
    base_url: 'https://nationalmap.gov/epqs'
  },
  openweather: {
    name: 'OpenWeather',
    key: 'dabc85603c4364f216151472dd8ef575',
    base_url: 'https://api.openweathermap.org/data/2.5'
  }
}

async function testAPI(name, testFunction) {
  console.log(`🔄 Testing ${name}...`)
  try {
    const result = await testFunction()
    if (result.success) {
      console.log(`✅ ${name}: SUCCESS`)
      if (result.data) {
        console.log(`   Data points: ${Array.isArray(result.data) ? result.data.length : 'Object'}`)
        if (result.sample) {
          console.log(`   Sample: ${JSON.stringify(result.sample).substring(0, 100)}...`)
        }
      }
    } else {
      console.log(`❌ ${name}: FAILED - ${result.error}`)
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`)
  }
  console.log('')
}

// USDA NASS QuickStats Test
async function testUSDANASS() {
  const url = `${apis.usda_nass.base_url}/api_GET/?key=${apis.usda_nass.key}&source_desc=SURVEY&sector_desc=CROPS&group_desc=FIELD%20CROPS&commodity_desc=CORN&statisticcat_desc=YIELD&agg_level_desc=STATE&state_name=IOWA&year=${TEST_YEAR}`
  
  const response = await fetch(url)
  if (!response.ok) {
    return { success: false, error: `HTTP ${response.status}` }
  }
  
  const data = await response.json()
  return {
    success: true,
    data: data.data || [],
    sample: data.data?.[0] ? {
      commodity: data.data[0].commodity_desc,
      value: data.data[0].Value,
      unit: data.data[0].unit_desc
    } : null
  }
}

// USDA Soil Data Access Test
async function testUSDAService() {
  // Test the SOAP endpoint accessibility
  const wsdlUrl = `${apis.usda_soil.base_url}?WSDL`
  
  const response = await fetch(wsdlUrl)
  if (!response.ok) {
    return { success: false, error: `WSDL not accessible: HTTP ${response.status}` }
  }
  
  const wsdl = await response.text()
  const hasRunQuery = wsdl.includes('RunQuery')
  
  return {
    success: hasRunQuery,
    data: { wsdl_accessible: true, run_query_available: hasRunQuery },
    error: hasRunQuery ? null : 'RunQuery method not found in WSDL'
  }
}

// EPA ATTAINS Test
async function testEPAATTAINS() {
  // Test domains endpoint
  const domainsUrl = `${apis.epa_attains.base_url}/domains`
  
  const response = await fetch(domainsUrl)
  if (!response.ok) {
    return { success: false, error: `HTTP ${response.status}` }
  }
  
  const domains = await response.json()
  
  // Test assessments with organization ID
  const assessmentsUrl = `${apis.epa_attains.base_url}/assessments?organizationId=IA_DENR`
  const assessResponse = await fetch(assessmentsUrl)
  let assessments = { items: [], count: 0 }
  
  if (assessResponse.ok) {
    assessments = await assessResponse.json()
  }
  
  return {
    success: true,
    data: {
      domains: domains.length || 0,
      assessments: assessments.count || 0
    },
    sample: domains?.[0] || null
  }
}

// NOAA Climate Data Test
async function testNOAA() {
  const url = `${apis.noaa.base_url}/stations?limit=5`
  
  const response = await fetch(url, {
    headers: {
      'token': apis.noaa.key
    }
  })
  
  if (!response.ok) {
    return { success: false, error: `HTTP ${response.status}` }
  }
  
  const data = await response.json()
  return {
    success: true,
    data: data.results || [],
    sample: data.results?.[0] ? {
      id: data.results[0].id,
      name: data.results[0].name,
      state: data.results[0].state
    } : null
  }
}

// USGS Elevation Test
async function testUSGS() {
  const lat = 42.0308 // Story County center
  const lon = -93.6319
  const url = `${apis.usgs.base_url}/pqs.php?x=${lon}&y=${lat}&units=Feet&output=json`
  
  const response = await fetch(url)
  if (!response.ok) {
    return { success: false, error: `HTTP ${response.status}` }
  }
  
  const data = await response.json()
  return {
    success: true,
    data: data.USGS_Elevation_Point_Query_Service || {},
    sample: {
      elevation: data.USGS_Elevation_Point_Query_Service?.Elevation,
      units: data.USGS_Elevation_Point_Query_Service?.Units
    }
  }
}

// OpenWeather Test
async function testOpenWeather() {
  const lat = 42.0308 // Story County center
  const lon = -93.6319
  const url = `${apis.openweather.base_url}/weather?lat=${lat}&lon=${lon}&appid=${apis.openweather.key}&units=imperial`
  
  const response = await fetch(url)
  if (!response.ok) {
    return { success: false, error: `HTTP ${response.status}` }
  }
  
  const data = await response.json()
  return {
    success: true,
    data: data,
    sample: {
      location: data.name,
      temp: data.main?.temp,
      description: data.weather?.[0]?.description
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log(`Testing with Story County, Iowa (FIPS: ${TEST_COUNTY_FIPS})\n`)
  
  await testAPI('USDA NASS QuickStats', testUSDANASS)
  await testAPI('USDA Soil Data Access', testUSDAService)
  await testAPI('EPA ATTAINS Water Quality', testEPAATTAINS)
  await testAPI('NOAA Climate Data', testNOAA)
  await testAPI('USGS Elevation Service', testUSGS)
  await testAPI('OpenWeather API', testOpenWeather)
  
  console.log('🎉 API testing complete!')
  console.log('\n📋 Summary:')
  console.log('- All APIs tested with Story County, Iowa as reference location')
  console.log('- Check above for individual API status and data availability')
  console.log('- Working APIs can be integrated into Farm Data Informer services')
}

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error)
  process.exit(1)
})
