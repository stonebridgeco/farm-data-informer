const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function verifyDataCounts() {
  console.log('🔍 Verifying data counts in all tables...\n')
  
  const tables = [
    { name: 'counties', expected: 5 },
    { name: 'soil_data', expected: 5 },
    { name: 'climate_data', expected: 5 },
    { name: 'water_data', expected: 5 },
    { name: 'terrain_data', expected: 5 },
    { name: 'market_data', expected: 5 },
    { name: 'farm_analysis', expected: 15 } // 5 counties × 3 farm types
  ]
  
  let allCorrect = true
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table.name}: Error - ${error.message}`)
        allCorrect = false
      } else {
        const actualCount = count || 0
        const status = actualCount === table.expected ? '✅' : '⚠️'
        console.log(`${status} ${table.name}: ${actualCount}/${table.expected} records`)
        
        if (actualCount !== table.expected) {
          allCorrect = false
        }
      }
    } catch (error) {
      console.log(`❌ ${table.name}: ${error.message}`)
      allCorrect = false
    }
  }
  
  console.log('\n' + '='.repeat(50))
  
  if (allCorrect) {
    console.log('🎉 SUCCESS: All tables have correct data counts!')
    console.log('✅ Issue #5: Data Pipeline Setup is COMPLETE!')
    console.log('✅ Database schema created successfully')
    console.log('✅ Sample data populated correctly')
    console.log('✅ Ready to move to next development phase')
  } else {
    console.log('⚠️  WARNING: Some tables have unexpected counts')
    console.log('This might indicate partial data insertion or other issues')
  }
  
  return allCorrect
}

async function testSampleQuery() {
  console.log('\n🧪 Testing sample data query...')
  
  try {
    const { data, error } = await supabase
      .from('counties')
      .select(`
        name,
        state,
        population,
        soil_data(soil_type, ph_level),
        climate_data(avg_temp_f, annual_precipitation),
        farm_analysis(farm_type, overall_score)
      `)
      .limit(2)
    
    if (error) {
      console.log('❌ Sample query failed:', error.message)
      return false
    } else {
      console.log('✅ Sample query successful!')
      console.log('📊 Sample data preview:')
      data.forEach((county, i) => {
        console.log(`   ${i + 1}. ${county.name}, ${county.state} (Pop: ${county.population?.toLocaleString()})`)
      })
      return true
    }
  } catch (error) {
    console.log('❌ Sample query error:', error.message)
    return false
  }
}

// Run all verification tests
verifyDataCounts()
  .then(async (success) => {
    if (success) {
      await testSampleQuery()
    }
  })
  .catch(console.error)
