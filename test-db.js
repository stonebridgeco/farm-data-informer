const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase connection...')
console.log('URL:', supabaseUrl ? 'Set ✅' : 'Missing ❌')
console.log('Key:', supabaseKey ? 'Set ✅' : 'Missing ❌')

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  console.log('\n🔍 Testing database schema...')
  
  const tables = ['counties', 'soil_data', 'climate_data', 'water_data', 'terrain_data', 'market_data', 'farm_analysis']
  const results = {}
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1)
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ ${table}: Table does not exist`)
          results[table] = false
        } else {
          console.log(`⚠️  ${table}: ${error.message}`)
          results[table] = 'error'
        }
      } else {
        console.log(`✅ ${table}: Table exists`)
        results[table] = true
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`)
      results[table] = false
    }
  }
  
  const existingTables = Object.entries(results).filter(([_, exists]) => exists === true).length
  const totalTables = tables.length
  
  console.log(`\n📊 Schema Status: ${existingTables}/${totalTables} tables exist`)
  
  if (existingTables === 0) {
    console.log('\n🚨 SCHEMA NOT CREATED YET')
    console.log('❗ Issue #5 is NOT complete - database schema needs to be created')
    console.log('📋 Next step: Execute database_schema.sql on Supabase')
  } else if (existingTables < totalTables) {
    console.log('\n⚠️  PARTIAL SCHEMA EXISTS')
    console.log('Some tables are missing - schema may need updating')
  } else {
    console.log('\n🎉 FULL SCHEMA EXISTS')
    console.log('✅ Issue #5 database setup is COMPLETE!')
  }
  
  return results
}

testDatabase().catch(console.error)
