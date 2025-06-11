import { supabase } from './src/services/database.js'

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase connection and schema...')
  
  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('counties')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.log('❌ Database connection failed:', connectionError.message)
      
      // Check if it's a missing table error
      if (connectionError.message.includes('relation "counties" does not exist')) {
        console.log('📋 Schema needs to be created on Supabase server')
        return { schemaExists: false, connectionWorks: true }
      } else {
        console.log('🔌 Connection issue:', connectionError.message)
        return { schemaExists: false, connectionWorks: false }
      }
    } else {
      console.log('✅ Database connection successful!')
      console.log('✅ Counties table exists!')
      return { schemaExists: true, connectionWorks: true }
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message)
    return { schemaExists: false, connectionWorks: false }
  }
}

async function checkAllTables() {
  console.log('\n🔍 Checking all required tables...')
  
  const tables = ['counties', 'soil_data', 'climate_data', 'water_data', 'terrain_data', 'market_data', 'farm_analysis']
  const results = {}
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
        results[table] = false
      } else {
        console.log(`✅ ${table}: exists`)
        results[table] = true
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`)
      results[table] = false
    }
  }
  
  return results
}

// Run the tests
testDatabaseConnection()
  .then(async (result) => {
    console.log('\n📊 Connection Result:', result)
    
    if (result.connectionWorks) {
      const tableResults = await checkAllTables()
      console.log('\n📋 Table Status:', tableResults)
      
      const existingTables = Object.entries(tableResults).filter(([_, exists]) => exists).length
      const totalTables = Object.keys(tableResults).length
      
      console.log(`\n📈 Schema Status: ${existingTables}/${totalTables} tables exist`)
      
      if (existingTables === 0) {
        console.log('\n🚨 SCHEMA NEEDS TO BE CREATED')
        console.log('Next step: Run the database_schema.sql file on your Supabase instance')
      } else if (existingTables < totalTables) {
        console.log('\n⚠️  PARTIAL SCHEMA EXISTS')
        console.log('Some tables are missing - schema may need updating')
      } else {
        console.log('\n🎉 FULL SCHEMA EXISTS')
        console.log('All required tables are present!')
      }
    }
  })
  .catch((error) => {
    console.log('❌ Test failed:', error)
  })
