const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🚀 Farm Data Informer - Database Schema Setup')
console.log('============================================')

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables')
  console.log('Make sure .env.local contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function readSchemaFile() {
  try {
    const schemaPath = path.join(__dirname, 'database_schema.sql')
    const schemaContent = fs.readFileSync(schemaPath, 'utf8')
    return schemaContent
  } catch (error) {
    console.log('❌ Could not read database_schema.sql:', error.message)
    return null
  }
}

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.log('❌ SQL execution error:', error.message)
      return false
    }
    
    console.log('✅ SQL executed successfully')
    return true
  } catch (error) {
    console.log('❌ Unexpected error:', error.message)
    return false
  }
}

async function createTablesDirectly() {
  console.log('\n📋 Creating database tables...')
  
  const tables = [
    {
      name: 'counties',
      sql: `
        CREATE TABLE IF NOT EXISTS counties (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          fips VARCHAR(5) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          state VARCHAR(2) NOT NULL,
          state_name VARCHAR(50) NOT NULL,
          coordinates POINT,
          population INTEGER,
          area_sq_miles DECIMAL(10,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'soil_data',
      sql: `
        CREATE TABLE IF NOT EXISTS soil_data (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
          soil_type VARCHAR(100),
          drainage_class VARCHAR(50),
          ph_level DECIMAL(3,1),
          organic_matter DECIMAL(4,2),
          permeability VARCHAR(50),
          slope_range VARCHAR(20),
          erosion_factor DECIMAL(4,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'climate_data',
      sql: `
        CREATE TABLE IF NOT EXISTS climate_data (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
          year INTEGER NOT NULL,
          avg_temp_f DECIMAL(4,1),
          min_temp_f DECIMAL(4,1),
          max_temp_f DECIMAL(4,1),
          annual_precipitation DECIMAL(5,2),
          growing_season_days INTEGER,
          frost_free_days INTEGER,
          hardiness_zone VARCHAR(5),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'water_data',
      sql: `
        CREATE TABLE IF NOT EXISTS water_data (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
          water_table_depth DECIMAL(5,2),
          irrigation_availability VARCHAR(50),
          water_quality_index DECIMAL(4,2),
          annual_rainfall DECIMAL(5,2),
          drought_frequency DECIMAL(3,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'terrain_data',
      sql: `
        CREATE TABLE IF NOT EXISTS terrain_data (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
          avg_elevation DECIMAL(6,2),
          slope_percentage DECIMAL(4,2),
          terrain_type VARCHAR(50),
          flood_risk VARCHAR(20),
          erosion_risk VARCHAR(20),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'market_data',
      sql: `
        CREATE TABLE IF NOT EXISTS market_data (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
          crop_type VARCHAR(50),
          avg_price_per_unit DECIMAL(8,2),
          market_demand VARCHAR(20),
          transport_cost DECIMAL(6,2),
          storage_facilities INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'farm_analysis',
      sql: `
        CREATE TABLE IF NOT EXISTS farm_analysis (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
          farm_type VARCHAR(50) NOT NULL,
          suitability_score DECIMAL(3,2),
          soil_score DECIMAL(3,2),
          climate_score DECIMAL(3,2),
          water_score DECIMAL(3,2),
          terrain_score DECIMAL(3,2),
          market_score DECIMAL(3,2),
          analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }
  ]
  
  let successCount = 0
  
  for (const table of tables) {
    try {
      console.log(`\n📝 Creating table: ${table.name}`)
      
      // Use the SQL editor approach via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          sql_query: table.sql
        })
      })
      
      if (response.ok) {
        console.log(`✅ ${table.name}: Created successfully`)
        successCount++
      } else {
        const error = await response.text()
        console.log(`❌ ${table.name}: Failed - ${error}`)
      }
    } catch (error) {
      console.log(`❌ ${table.name}: Error - ${error.message}`)
    }
  }
  
  return successCount
}

async function testTablesExist() {
  console.log('\n🔍 Verifying table creation...')
  
  const tables = ['counties', 'soil_data', 'climate_data', 'water_data', 'terrain_data', 'market_data', 'farm_analysis']
  let existingCount = 0
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1)
      
      if (!error) {
        console.log(`✅ ${table}: Exists and accessible`)
        existingCount++
      } else {
        console.log(`❌ ${table}: ${error.message}`)
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`)
    }
  }
  
  return existingCount
}

// Main execution
async function setupDatabase() {
  console.log('\n🔗 Testing connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    console.log('✅ Connection to Supabase established')
  } catch (error) {
    console.log('❌ Connection failed:', error.message)
    return
  }
  
  // Check current state
  const existingTables = await testTablesExist()
  console.log(`\n📊 Current state: ${existingTables}/7 tables exist`)
  
  if (existingTables === 7) {
    console.log('\n🎉 All tables already exist! Issue #5 is COMPLETE!')
    return
  }
  
  // Create missing tables
  console.log('\n🚧 Setting up missing tables...')
  const createdTables = await createTablesDirectly()
  
  // Final verification
  const finalCount = await testTablesExist()
  
  console.log('\n📈 Final Results:')
  console.log(`📋 Tables created this session: ${createdTables}`)
  console.log(`✅ Total tables now existing: ${finalCount}/7`)
  
  if (finalCount === 7) {
    console.log('\n🎉 SUCCESS! Database schema setup complete!')
    console.log('✅ Issue #5: Data Pipeline Setup is now COMPLETE!')
    console.log('\n📝 You can now proceed with:')
    console.log('   - Issue #7: Agricultural Data Sources Integration')
    console.log('   - Testing the farm data pipeline')
    console.log('   - Using the USDA API caching functionality')
  } else {
    console.log('\n⚠️  PARTIAL SUCCESS - Some tables may need manual creation')
    console.log('📋 Please check the Supabase dashboard SQL editor for any remaining issues')
  }
}

setupDatabase().catch(console.error)
