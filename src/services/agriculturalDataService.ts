import { usdaService } from './usdaService'
import { noaaService } from './noaaService'
import { usgsService } from './usgsService'
import { soilService } from './soilService'
import { epaService } from './epaService'
import { supabase } from './database'

// Comprehensive agricultural data interface
interface ComprehensiveCountyData {
  county_info: {
    fips: string
    name: string
    state: string
    last_updated: string
  }
  
  // USDA Agricultural Data
  agricultural_data: {
    crops: any[]
    livestock: any[]
    economics: any[]
    data_year: number
  }
  
  // NOAA Climate Data
  climate_data: {
    historical_weather: any[]
    climate_normals: any[]
    growing_season: {
      first_frost: string | null
      last_frost: string | null
      growing_season_length: number
      growing_degree_days: number
      frost_free_days: number
    }
  }
  
  // USGS Terrain Data
  terrain_data: {
    elevation_min: number
    elevation_max: number
    elevation_avg: number
    slope_avg: number
    slope_category: string
    terrain_roughness: number
    drainage_pattern: string
    flood_risk: string
    erosion_risk: string
    farm_suitability_score: number
  }
  
  // USDA Soil Data
  soil_data: {
    dominant_soil_type: string
    soil_ph_avg: number
    soil_ph_range: { min: number, max: number }
    organic_matter_percent: number
    drainage_class: string
    texture_class: string
    depth_to_bedrock: number
    available_water_capacity: number
    permeability_rate: string
    erosion_factor: number
    fertility_rating: string
    limitations: string[]
    suitable_crops: string[]
    soil_suitability_score: number
  }
  
  // EPA Water Quality Data
  water_quality: {
    total_assessments: number
    impaired_waters: number
    pollutant_types: string[]
    overall_rating: 'Good' | 'Fair' | 'Poor' | 'Unknown'
    major_pollutants: string[]
    water_suitability_score: number
    irrigation_safety: 'Safe' | 'Moderate' | 'High Risk' | 'Unknown'
  }
  
  // Overall Analysis
  farm_analysis: {
    overall_suitability_score: number
    suitability_grade: 'A' | 'B' | 'C' | 'D' | 'F'
    primary_strengths: string[]
    primary_limitations: string[]
    recommended_crops: string[]
    risk_factors: string[]
    improvement_suggestions: string[]
  }
}

interface DataFetchStatus {
  usda: 'pending' | 'success' | 'error' | 'cached'
  noaa: 'pending' | 'success' | 'error' | 'cached'
  usgs: 'pending' | 'success' | 'error' | 'cached'
  soil: 'pending' | 'success' | 'error' | 'cached'
  epa: 'pending' | 'success' | 'error' | 'cached'
  overall: 'pending' | 'success' | 'error'
}

class AgriculturalDataService {
  /**
   * Get comprehensive agricultural data for a county
   */
  async getComprehensiveCountyData(fips: string): Promise<{
    data: ComprehensiveCountyData | null
    status: DataFetchStatus
    errors: string[]
  }> {
    const status: DataFetchStatus = {
      usda: 'pending',
      noaa: 'pending',
      usgs: 'pending',
      soil: 'pending',
      epa: 'pending',
      overall: 'pending'
    }
    
    const errors: string[] = []
    let data: ComprehensiveCountyData | null = null

    try {
      // Check if we have recent comprehensive data cached
      const cachedData = await this.getCachedComprehensiveData(fips)
      if (cachedData) {
        return {
          data: cachedData,
          status: {
            usda: 'cached',
            noaa: 'cached',
            usgs: 'cached',
            soil: 'cached',
            epa: 'cached',
            overall: 'success'
          },
          errors: []
        }
      }

      // Get county information
      const { data: county } = await supabase
        .from('counties')
        .select('*')
        .eq('fips', fips)
        .single()

      if (!county) {
        throw new Error(`County not found for FIPS: ${fips}`)
      }

      // Fetch data from all sources in parallel
      const dataPromises = await Promise.allSettled([
        this.fetchUSDAData(fips, status, errors),
        this.fetchNOAAData(fips, status, errors),
        this.fetchUSGSData(fips, status, errors),
        this.fetchSoilData(fips, status, errors),
        this.fetchEPAData(fips, status, errors)
      ])

      const [usdaResult, noaaResult, usgsResult, soilResult, epaResult] = dataPromises

      // Extract data from settled promises
      const agriculturalData = usdaResult.status === 'fulfilled' ? usdaResult.value : null
      const climateData = noaaResult.status === 'fulfilled' ? noaaResult.value : null
      const terrainData = usgsResult.status === 'fulfilled' ? usgsResult.value : null
      const soilData = soilResult.status === 'fulfilled' ? soilResult.value : null
      const waterQualityData = epaResult.status === 'fulfilled' ? epaResult.value : null

      // Create comprehensive data object
      data = {
        county_info: {
          fips: county.fips,
          name: county.name,
          state: county.state,
          last_updated: new Date().toISOString()
        },
        agricultural_data: agriculturalData || this.getEmptyAgriculturalData(),
        climate_data: climateData || this.getEmptyClimateData(),
        terrain_data: terrainData || this.getEmptyTerrainData(),
        soil_data: soilData || this.getEmptySoilData(),
        water_quality: waterQualityData || this.getEmptyWaterQualityData(),
        farm_analysis: this.generateFarmAnalysis({
          terrain: terrainData,
          soil: soilData,
          climate: climateData,
          agricultural: agriculturalData,
          waterQuality: waterQualityData
        })
      }

      // Cache the comprehensive data
      await this.cacheComprehensiveData(fips, data)

      status.overall = 'success'

    } catch (error) {
      console.error('Error fetching comprehensive county data:', error)
      errors.push(`Overall error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      status.overall = 'error'
    }

    return { data, status, errors }
  }

  /**
   * Fetch USDA agricultural data
   */
  private async fetchUSDAData(fips: string, status: DataFetchStatus, errors: string[]): Promise<any> {
    try {
      const data = await usdaService.getCountyFarmData(fips)
      status.usda = 'success'
      return {
        crops: data.crops,
        livestock: data.livestock,
        economics: data.economics,
        data_year: new Date().getFullYear() - 1
      }
    } catch (error) {
      console.error('USDA data fetch error:', error)
      errors.push(`USDA: ${error instanceof Error ? error.message : 'Failed to fetch agricultural data'}`)
      status.usda = 'error'
      return null
    }
  }

  /**
   * Fetch NOAA climate data
   */
  private async fetchNOAAData(fips: string, status: DataFetchStatus, errors: string[]): Promise<any> {
    try {
      const currentYear = new Date().getFullYear()
      const startDate = `${currentYear - 1}-01-01`
      const endDate = `${currentYear - 1}-12-31`

      const [historicalWeather, climateNormals, growingSeason] = await Promise.all([
        noaaService.getHistoricalWeatherData(fips, startDate, endDate),
        noaaService.getClimateNormals(fips),
        noaaService.getGrowingSeasonData(fips, currentYear - 1)
      ])

      status.noaa = 'success'
      return {
        historical_weather: historicalWeather,
        climate_normals: climateNormals,
        growing_season: growingSeason
      }
    } catch (error) {
      console.error('NOAA data fetch error:', error)
      errors.push(`NOAA: ${error instanceof Error ? error.message : 'Failed to fetch climate data'}`)
      status.noaa = 'error'
      return null
    }
  }

  /**
   * Fetch USGS terrain data
   */
  private async fetchUSGSData(fips: string, status: DataFetchStatus, errors: string[]): Promise<any> {
    try {
      const terrainData = await usgsService.getTerrainAnalysis(fips)
      status.usgs = 'success'
      return terrainData
    } catch (error) {
      console.error('USGS data fetch error:', error)
      errors.push(`USGS: ${error instanceof Error ? error.message : 'Failed to fetch terrain data'}`)
      status.usgs = 'error'
      return null
    }
  }

  /**
   * Fetch USDA soil data
   */
  private async fetchSoilData(fips: string, status: DataFetchStatus, errors: string[]): Promise<any> {
    try {
      const soilData = await soilService.getCountySoilData(fips)
      status.soil = 'success'
      return soilData
    } catch (error) {
      console.error('Soil data fetch error:', error)
      errors.push(`Soil: ${error instanceof Error ? error.message : 'Failed to fetch soil data'}`)
      status.soil = 'error'
      return null
    }
  }

  /**
   * Generate comprehensive farm analysis
   */
  private generateFarmAnalysis(data: {
    terrain: any
    soil: any
    climate: any
    agricultural: any
    waterQuality?: any
  }): ComprehensiveCountyData['farm_analysis'] {
    const scores: number[] = []
    const strengths: string[] = []
    const limitations: string[] = []
    const riskFactors: string[] = []
    const recommendations: string[] = []
    let recommendedCrops: string[] = []

    // Terrain analysis
    if (data.terrain) {
      scores.push(data.terrain.farm_suitability_score || 70)
      
      if (data.terrain.slope_category === 'flat' || data.terrain.slope_category === 'gentle') {
        strengths.push('Excellent topography for farming')
      } else if (data.terrain.slope_category === 'steep' || data.terrain.slope_category === 'very_steep') {
        limitations.push('Challenging terrain with steep slopes')
        riskFactors.push('Erosion risk from steep slopes')
      }

      if (data.terrain.drainage_pattern === 'excellent' || data.terrain.drainage_pattern === 'good') {
        strengths.push('Good natural drainage')
      } else if (data.terrain.drainage_pattern === 'poor') {
        limitations.push('Poor natural drainage')
        riskFactors.push('Potential flooding issues')
      }

      if (data.terrain.flood_risk === 'high') {
        riskFactors.push('High flood risk')
        recommendations.push('Consider flood-resistant crops and drainage improvements')
      }
    }

    // Soil analysis
    if (data.soil) {
      scores.push(data.soil.soil_suitability_score || 70)
      
      if (data.soil.fertility_rating === 'excellent' || data.soil.fertility_rating === 'good') {
        strengths.push(`${data.soil.fertility_rating} soil fertility`)
      } else if (data.soil.fertility_rating === 'poor') {
        limitations.push('Poor soil fertility')
        recommendations.push('Soil improvement and fertilization needed')
      }

      if (data.soil.soil_ph_avg >= 6.0 && data.soil.soil_ph_avg <= 7.5) {
        strengths.push('Optimal soil pH for most crops')
      } else if (data.soil.soil_ph_avg < 5.5) {
        limitations.push('Acidic soil conditions')
        recommendations.push('Consider soil pH adjustment with lime')
      } else if (data.soil.soil_ph_avg > 8.0) {
        limitations.push('Alkaline soil conditions')
        recommendations.push('Consider soil pH adjustment or alkali-tolerant crops')
      }

      if (data.soil.organic_matter_percent >= 3.0) {
        strengths.push('Good organic matter content')
      } else if (data.soil.organic_matter_percent < 2.0) {
        limitations.push('Low organic matter')
        recommendations.push('Increase organic matter through cover crops and compost')
      }

      if (data.soil.suitable_crops && data.soil.suitable_crops.length > 0) {
        recommendedCrops = [...data.soil.suitable_crops]
      }

      if (data.soil.limitations && data.soil.limitations.length > 0) {
        limitations.push(...data.soil.limitations.slice(0, 3))
      }
    }

    // Climate analysis
    if (data.climate) {
      if (data.climate.growing_season) {
        const growingSeason = data.climate.growing_season
        
        if (growingSeason.growing_season_length >= 180) {
          strengths.push('Long growing season')
        } else if (growingSeason.growing_season_length < 120) {
          limitations.push('Short growing season')
          riskFactors.push('Frost risk limits crop options')
        }

        if (growingSeason.growing_degree_days >= 2000) {
          strengths.push('Adequate heat units for warm-season crops')
        } else if (growingSeason.growing_degree_days < 1500) {
          limitations.push('Limited heat units for warm-season crops')
          recommendations.push('Focus on cool-season crops')
        }
      }

      if (data.climate.climate_normals && data.climate.climate_normals.length > 0) {
        const avgPrecip = data.climate.climate_normals.reduce((sum: number, month: any) => 
          sum + (month.precipitation_avg || 0), 0)
        
        if (avgPrecip >= 500) {
          strengths.push('Adequate precipitation')
        } else if (avgPrecip < 300) {
          limitations.push('Low precipitation')
          riskFactors.push('Drought risk')
          recommendations.push('Consider drought-tolerant crops and irrigation')
        }
      }
    }

    // Water Quality analysis
    if (data.waterQuality) {
      scores.push(data.waterQuality.water_suitability_score * 100)
      
      if (data.waterQuality.overall_rating === 'Good') {
        strengths.push('Excellent water quality for irrigation')
      } else if (data.waterQuality.overall_rating === 'Fair') {
        strengths.push('Adequate water quality')
      } else if (data.waterQuality.overall_rating === 'Poor') {
        limitations.push('Poor water quality')
        riskFactors.push('Water contamination risk')
        recommendations.push('Consider water treatment for irrigation')
      }

      if (data.waterQuality.irrigation_safety === 'High Risk') {
        riskFactors.push('High irrigation water contamination risk')
        recommendations.push('Avoid direct irrigation of food crops')
      } else if (data.waterQuality.irrigation_safety === 'Moderate') {
        recommendations.push('Monitor irrigation water quality regularly')
      }

      if (data.waterQuality.major_pollutants && data.waterQuality.major_pollutants.length > 0) {
        const pollutants = data.waterQuality.major_pollutants.slice(0, 3).join(', ')
        limitations.push(`Water pollution concerns: ${pollutants}`)
      }

      if (data.waterQuality.impaired_waters > data.waterQuality.total_assessments * 0.5) {
        riskFactors.push('High percentage of impaired water bodies in area')
      }
    }

    // Calculate overall score
    const overallScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 70

    // Determine grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F'
    if (overallScore >= 90) grade = 'A'
    else if (overallScore >= 80) grade = 'B'
    else if (overallScore >= 70) grade = 'C'
    else if (overallScore >= 60) grade = 'D'
    else grade = 'F'

    // Ensure we have some recommended crops
    if (recommendedCrops.length === 0) {
      recommendedCrops = ['Corn', 'Soybeans', 'Wheat'] // Default crops
    }

    // Add general recommendations if none exist
    if (recommendations.length === 0) {
      recommendations.push('Regular soil testing', 'Integrated pest management', 'Conservation practices')
    }

    return {
      overall_suitability_score: Math.round(overallScore),
      suitability_grade: grade,
      primary_strengths: strengths.slice(0, 5),
      primary_limitations: limitations.slice(0, 5),
      recommended_crops: recommendedCrops.slice(0, 6),
      risk_factors: riskFactors.slice(0, 4),
      improvement_suggestions: recommendations.slice(0, 5)
    }
  }

  /**
   * Cache comprehensive data
   */
  private async cacheComprehensiveData(fips: string, data: ComprehensiveCountyData): Promise<void> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return

      await supabase
        .from('comprehensive_data_cache')
        .upsert({
          county_id: county.id,
          comprehensive_data: data,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
    } catch (error) {
      console.error('Error caching comprehensive data:', error)
    }
  }

  /**
   * Get cached comprehensive data
   */
  private async getCachedComprehensiveData(fips: string): Promise<ComprehensiveCountyData | null> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return null

      const { data } = await supabase
        .from('comprehensive_data_cache')
        .select('comprehensive_data')
        .eq('county_id', county.id)
        .gt('expires_at', new Date().toISOString())
        .order('cached_at', { ascending: false })
        .limit(1)
        .single()

      return data?.comprehensive_data || null
    } catch (error) {
      return null
    }
  }

  /**
   * Empty data fallbacks
   */
  private getEmptyAgriculturalData() {
    return {
      crops: [],
      livestock: [],
      economics: [],
      data_year: new Date().getFullYear() - 1
    }
  }

  private getEmptyClimateData() {
    return {
      historical_weather: [],
      climate_normals: [],
      growing_season: {
        first_frost: null,
        last_frost: null,
        growing_season_length: 180,
        growing_degree_days: 2000,
        frost_free_days: 200
      }
    }
  }

  private getEmptyTerrainData() {
    return {
      elevation_min: 0,
      elevation_max: 100,
      elevation_avg: 50,
      slope_avg: 2,
      slope_category: 'gentle',
      terrain_roughness: 20,
      drainage_pattern: 'good',
      flood_risk: 'moderate',
      erosion_risk: 'low',
      farm_suitability_score: 70
    }
  }

  private getEmptySoilData() {
    return {
      dominant_soil_type: 'loam',
      soil_ph_avg: 6.5,
      soil_ph_range: { min: 6.0, max: 7.0 },
      organic_matter_percent: 3.0,
      drainage_class: 'moderately_well_drained',
      texture_class: 'loam',
      depth_to_bedrock: 150,
      available_water_capacity: 0.15,
      permeability_rate: 'moderate',
      erosion_factor: 0.3,
      fertility_rating: 'good',
      limitations: [],
      suitable_crops: ['Corn', 'Soybeans', 'Wheat'],
      soil_suitability_score: 75
    }
  }

  /**
   * Get data refresh status for a county
   */
  async getDataRefreshStatus(fips: string): Promise<{
    last_updated: string | null
    needs_refresh: boolean
    cache_age_hours: number
  }> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) {
        return { last_updated: null, needs_refresh: true, cache_age_hours: 0 }
      }

      const { data } = await supabase
        .from('comprehensive_data_cache')
        .select('cached_at, expires_at')
        .eq('county_id', county.id)
        .order('cached_at', { ascending: false })
        .limit(1)
        .single()

      if (!data) {
        return { last_updated: null, needs_refresh: true, cache_age_hours: 0 }
      }

      const cacheAge = Date.now() - new Date(data.cached_at).getTime()
      const cacheAgeHours = cacheAge / (1000 * 60 * 60)
      const needsRefresh = new Date(data.expires_at) < new Date()

      return {
        last_updated: data.cached_at,
        needs_refresh: needsRefresh,
        cache_age_hours: Math.round(cacheAgeHours * 10) / 10
      }
    } catch (error) {
      return { last_updated: null, needs_refresh: true, cache_age_hours: 0 }
    }
  }

  /**
   * Force refresh data for a county
   */
  async refreshCountyData(fips: string): Promise<void> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return

      // Clear existing cache
      await supabase
        .from('comprehensive_data_cache')
        .delete()
        .eq('county_id', county.id)

      // Clear individual service caches
      await Promise.all([
        supabase.from('usda_data_cache').delete().eq('county_id', county.id),
        supabase.from('weather_data_cache').delete().eq('county_id', county.id),
        supabase.from('terrain_data_cache').delete().eq('county_id', county.id),
        supabase.from('soil_data_cache').delete().eq('county_id', county.id)
      ])

      console.log(`Cache cleared for county ${fips}`)
    } catch (error) {
      console.error('Error refreshing county data:', error)
    }
  }

  /**
   * Fetch EPA water quality data
   */
  private async fetchEPAData(fips: string, status: DataFetchStatus, errors: string[]): Promise<any> {
    try {
      const waterQualitySummary = await epaService.getWaterQualitySummary(fips)
      
      // Calculate water suitability score based on EPA data
      let waterSuitabilityScore = 0.5 // Default neutral score
      let irrigationSafety: 'Safe' | 'Moderate' | 'High Risk' | 'Unknown' = 'Unknown'
      
      switch (waterQualitySummary.overallRating) {
        case 'Good':
          waterSuitabilityScore = 0.9
          irrigationSafety = 'Safe'
          break
        case 'Fair':
          waterSuitabilityScore = 0.7
          irrigationSafety = 'Moderate'
          break
        case 'Poor':
          waterSuitabilityScore = 0.3
          irrigationSafety = 'High Risk'
          break
        default:
          waterSuitabilityScore = 0.5
          irrigationSafety = 'Unknown'
      }

      const processedData = {
        ...waterQualitySummary,
        water_suitability_score: waterSuitabilityScore,
        irrigation_safety: irrigationSafety,
        major_pollutants: waterQualitySummary.pollutantTypes.slice(0, 5) // Top 5 pollutants
      }

      status.epa = 'success'
      return processedData
    } catch (error) {
      console.error('Error fetching EPA water quality data:', error)
      errors.push(`EPA error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      status.epa = 'error'
      return null
    }
  }

  /**
   * Get empty water quality data structure
   */
  private getEmptyWaterQualityData() {
    return {
      total_assessments: 0,
      impaired_waters: 0,
      pollutant_types: [],
      overall_rating: 'Unknown' as const,
      major_pollutants: [],
      water_suitability_score: 0.5,
      irrigation_safety: 'Unknown' as const
    }
  }
}

export const agriculturalDataService = new AgriculturalDataService()
export default agriculturalDataService
