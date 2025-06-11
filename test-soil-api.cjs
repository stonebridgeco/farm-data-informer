#!/usr/bin/env node

/**
 * USDA Soil Data Access API Test
 * Tests both REST and SOAP endpoints
 */

console.log('🌱 USDA Soil Data Access API Test\n')

const SOAP_ENDPOINT = 'https://SDMDataAccess.sc.egov.usda.gov/Tabular/SDMTabularService.asmx'
const REST_ENDPOINT = 'https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest'

// Test query - get Iowa soil survey areas
const TEST_QUERY = "SELECT TOP 5 areasymbol, areaname FROM legend WHERE areasymbol LIKE 'IA%'"

async function testRESTAPI() {
  console.log('🔄 Testing REST API...')
  
  try {
    // Try multiple different request formats
    const formats = [
      {
        name: 'JSON with Query/Format',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Query: TEST_QUERY, Format: 'JSON' })
      },
      {
        name: 'JSON with query/format (lowercase)',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: TEST_QUERY, format: 'JSON' })
      },
      {
        name: 'Form-encoded',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `Query=${encodeURIComponent(TEST_QUERY)}&Format=JSON`
      },
      {
        name: 'Plain text query',
        headers: { 'Content-Type': 'text/plain' },
        body: TEST_QUERY
      }
    ]

    for (const format of formats) {
      console.log(`  Trying: ${format.name}`)
      
      try {
        const response = await fetch(REST_ENDPOINT, {
          method: 'POST',
          headers: format.headers,
          body: format.body
        })

        console.log(`    Status: ${response.status} ${response.statusText}`)
        
        if (response.ok) {
          const text = await response.text()
          console.log(`    Response length: ${text.length} characters`)
          console.log(`    Response preview: ${text.substring(0, 200)}...`)
          
          // Try to parse as JSON
          try {
            const json = JSON.parse(text)
            console.log(`    ✅ JSON parsed successfully`)
            console.log(`    Data structure:`, Object.keys(json))
            return { success: true, data: json, format: format.name }
          } catch (e) {
            console.log(`    📄 Response is not JSON, might be XML or other format`)
          }
        } else {
          const errorText = await response.text()
          console.log(`    Error: ${errorText.substring(0, 200)}`)
        }
      } catch (error) {
        console.log(`    ❌ Request failed: ${error.message}`)
      }
      
      console.log('')
    }
    
    return { success: false, error: 'All REST formats failed' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testSOAPAPI() {
  console.log('🔄 Testing SOAP API...')
  
  try {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                   xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
                   xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <RunQuery xmlns="http://SDMDataAccess.nrcs.usda.gov/Tabular/SDMTabularService.asmx">
          <Query>${TEST_QUERY}</Query>
          <Format>JSON</Format>
        </RunQuery>
      </soap:Body>
    </soap:Envelope>`

    const response = await fetch(SOAP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://SDMDataAccess.nrcs.usda.gov/Tabular/SDMTabularService.asmx/RunQuery'
      },
      body: soapBody
    })

    console.log(`Status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `HTTP ${response.status}: ${errorText.substring(0, 200)}` }
    }

    const xmlText = await response.text()
    console.log(`Response length: ${xmlText.length} characters`)
    console.log(`Response preview: ${xmlText.substring(0, 300)}...`)

    // Try to extract JSON from SOAP response
    const jsonMatch = xmlText.match(/<RunQueryResult[^>]*>(.*?)<\/RunQueryResult>/s)
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1])
        console.log(`✅ SOAP response contains valid JSON`)
        console.log(`Data structure:`, Object.keys(jsonData))
        return { success: true, data: jsonData }
      } catch (parseError) {
        console.log(`❌ Failed to parse JSON from SOAP response: ${parseError.message}`)
        return { success: false, error: 'Invalid JSON in SOAP response' }
      }
    } else {
      console.log(`❌ No RunQueryResult found in SOAP response`)
      return { success: false, error: 'No data found in SOAP response' }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testWSDL() {
  console.log('🔄 Testing WSDL accessibility...')
  
  try {
    const response = await fetch(`${SOAP_ENDPOINT}?WSDL`)
    
    if (response.ok) {
      const wsdl = await response.text()
      const hasRunQuery = wsdl.includes('RunQuery')
      console.log(`✅ WSDL accessible, RunQuery method: ${hasRunQuery ? 'Found' : 'Not found'}`)
      return { success: true, hasRunQuery }
    } else {
      console.log(`❌ WSDL not accessible: ${response.status}`)
      return { success: false, error: `HTTP ${response.status}` }
    }
  } catch (error) {
    console.log(`❌ WSDL test failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runSoilAPITests() {
  console.log(`Testing query: ${TEST_QUERY}\n`)
  
  // Test WSDL first
  await testWSDL()
  console.log('')
  
  // Test REST API
  const restResult = await testRESTAPI()
  if (restResult.success) {
    console.log(`✅ REST API working with format: ${restResult.format}`)
  } else {
    console.log(`❌ REST API failed: ${restResult.error}`)
  }
  console.log('')
  
  // Test SOAP API
  const soapResult = await testSOAPAPI()
  if (soapResult.success) {
    console.log(`✅ SOAP API working`)
  } else {
    console.log(`❌ SOAP API failed: ${soapResult.error}`)
  }
  
  console.log('\n🎉 Soil API testing complete!')
  
  // Summary
  console.log('\n📋 Summary:')
  console.log(`- REST API: ${restResult.success ? '✅ Working' : '❌ Failed'}`)
  console.log(`- SOAP API: ${soapResult.success ? '✅ Working' : '❌ Failed'}`)
  
  if (restResult.success || soapResult.success) {
    console.log('- At least one endpoint is functional for soil data integration')
  } else {
    console.log('- Both endpoints failed - may need alternative soil data source')
  }
}

// Run the tests
runSoilAPITests().catch(error => {
  console.error('❌ Test suite failed:', error)
  process.exit(1)
})
