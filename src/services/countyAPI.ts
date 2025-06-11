import { supabase, County, SoilData, ClimateData, FarmSuitability } from './database'
import { usdaService } from './usdaService'

/**
 * County API service for farm data operations
 */
class CountyAPIService {
  /**
   * Get all counties with basic information
   */
  async getAllCounties(): Promise<County[]> {
    try {
      const { data, error } = await supabase
        .from('counties')
        .select('*')
        .order('state', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching counties:', error)
      throw error
    }
  }

  /**
   * Get county by FIPS code
   */
  async getCountyByFips(fips: string): Promise<County | null> {
    try {
      const { data, error } = await supabase
        .from('counties')
        .select('*')
        .eq('fips', fips)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
      return data || null
    } catch (error) {
      console.error('Error fetching county by FIPS:', error)
      throw error
    }
  }

  /**
   * Get counties by state
   */
  async getCountiesByState(state: string): Promise<County[]> {
    try {
      const { data, error } = await supabase
        .from('counties')
        .select('*')
        .eq('state', state.toUpperCase())
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching counties by state:', error)
      throw error
    }
  }

  /**
   * Get soil data for a county
   */
  async getSoilData(countyId: string): Promise<SoilData[]> {
    try {
      const { data, error } = await supabase
        .from('soil_data')
        .select('*')
        .eq('county_id', countyId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching soil data:', error)
      throw error
    }
  }

  /**
   * Get climate data for a county
   */
  async getClimateData(countyId: string, year?: number): Promise<ClimateData[]> {
    try {
      let query = supabase
        .from('climate_data')
        .select('*')
        .eq('county_id', countyId)

      if (year) {
        query = query.eq('year', year)
      }

      query = query.order('year', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching climate data:', error)
      throw error
    }
  }

  /**
   * Get farm suitability scores for a county
   */
  async getFarmSuitability(
    countyId: string, 
    farmType?: 'goat' | 'apple' | 'general'
  ): Promise<FarmSuitability[]> {
    try {
      let query = supabase
        .from('farm_suitability')
        .select('*')
        .eq('county_id', countyId)

      if (farmType) {
        query = query.eq('farm_type', farmType)
      }

      query = query.order('calculated_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching farm suitability:', error)
      throw error
    }
  }

  /**
   * Get comprehensive county data including all related information
   */
  async getComprehensiveCountyData(fips: string): Promise<{
    county: County | null
    soil: SoilData[]
    climate: ClimateData[]
    suitability: FarmSuitability[]
    usda: {
      crops: any[]
      livestock: any[]
      economics: any[]
    }
  }> {
    try {
      // Get county first
      const county = await this.getCountyByFips(fips)
      
      if (!county) {
        return {
          county: null,
          soil: [],
          climate: [],
          suitability: [],
          usda: { crops: [], livestock: [], economics: [] }
        }
      }

      // Get all related data in parallel
      const [soil, climate, suitability, usda] = await Promise.all([
        this.getSoilData(county.id),
        this.getClimateData(county.id),
        this.getFarmSuitability(county.id),
        usdaService.getCountyFarmData(fips)
      ])

      return {
        county,
        soil,
        climate,
        suitability,
        usda
      }
    } catch (error) {
      console.error('Error fetching comprehensive county data:', error)
      throw error
    }
  }

  /**
   * Search counties by name
   */
  async searchCounties(searchTerm: string): Promise<County[]> {
    try {
      const { data, error } = await supabase
        .from('counties')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,state_name.ilike.%${searchTerm}%`)
        .order('name', { ascending: true })
        .limit(20)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error searching counties:', error)
      throw error
    }
  }

  /**
   * Calculate and store farm suitability score
   */
  async calculateFarmSuitability(
    countyId: string, 
    farmType: 'goat' | 'apple' | 'general'
  ): Promise<FarmSuitability | null> {
    try {
      // Get county data for calculation
      const [soil, climate] = await Promise.all([
        this.getSoilData(countyId),
        this.getClimateData(countyId)
      ])

      if (!soil.length || !climate.length) {
        throw new Error('Insufficient data for suitability calculation')
      }

      // Simple scoring algorithm (will be enhanced in Issue #8)
      const scores = this.calculateScores(farmType, soil[0], climate[0])

      // Store the calculated suitability
      const { data, error } = await supabase
        .from('farm_suitability')
        .insert({
          county_id: countyId,
          farm_type: farmType,
          overall_score: scores.overall,
          soil_score: scores.soil,
          climate_score: scores.climate,
          water_score: scores.water,
          terrain_score: scores.terrain,
          market_score: scores.market,
          calculated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error calculating farm suitability:', error)
      throw error
    }
  }

  /**
   * Simple scoring algorithm (placeholder for Issue #8)
   */
  private calculateScores(
    farmType: string, 
    soil: SoilData, 
    climate: ClimateData
  ): {
    overall: number
    soil: number
    climate: number
    water: number
    terrain: number
    market: number
  } {
    // Basic scoring logic - will be enhanced significantly
    const baseScores = {
      soil: 0.7,
      climate: 0.8,
      water: 0.6,
      terrain: 0.7,
      market: 0.5
    }

    // Adjust based on farm type
    if (farmType === 'goat') {
      baseScores.terrain = 0.9 // Goats handle rough terrain well
      baseScores.soil = 0.6    // Less dependent on soil quality
    } else if (farmType === 'apple') {
      baseScores.climate = 0.9 // Apples very climate dependent
      baseScores.soil = 0.8    // Need good soil drainage
    }

    // Adjust based on actual data
    if (soil.ph_level && soil.ph_level > 6.0 && soil.ph_level < 7.5) {
      baseScores.soil += 0.1 // Good pH range
    }

    if (climate.annual_precipitation && climate.annual_precipitation > 30 && climate.annual_precipitation < 50) {
      baseScores.climate += 0.1 // Good precipitation range
    }

    const overall = Object.values(baseScores).reduce((sum, score) => sum + score, 0) / 5

    return {
      overall: Math.min(overall, 1.0),
      ...baseScores
    }
  }
}

export const countyAPI = new CountyAPIService()
export default countyAPI
