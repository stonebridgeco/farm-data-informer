import { supabase } from './database'

// USDA NASS API configuration
const USDA_NASS_BASE_URL = import.meta.env.VITE_USDA_NASS_API_URL || 'https://quickstats.nass.usda.gov/api'
const USDA_API_KEY = import.meta.env.VITE_USDA_NASS_API_KEY // Optional - USDA NASS has public access

// Rate limiting configuration
// const RATE_LIMIT_DELAY = 100 // ms between requests (currently unused)
// let lastRequestTime = 0 // (currently unused)

// USDA NASS API interface
interface USDANASSParams {
  source_desc?: string
  sector_desc?: string
  group_desc?: string
  commodity_desc?: string
  class_desc?: string
  prodn_practice_desc?: string
  util_practice_desc?: string
  statisticcat_desc?: string
  unit_desc?: string
  short_desc?: string
  domain_desc?: string
  domaincat_desc?: string
  agg_level_desc?: string
  state_alpha?: string
  county_code?: string
  year?: string | number
  freq_desc?: string
  begin_code?: string
  end_code?: string
  reference_period_desc?: string
  format?: 'JSON' | 'CSV' | 'XML'
}

interface USDANASSResponse {
  data: any[]
  count?: number
}

class USDAService {
  private baseUrl: string
  private apiKey?: string

  constructor() {
    this.baseUrl = USDA_NASS_BASE_URL
    this.apiKey = USDA_API_KEY
  }

  /**
   * Fetch data from USDA NASS API
   */
  async fetchData(params: USDANASSParams): Promise<USDANASSResponse> {
    const url = new URL(`${this.baseUrl}/api_GET`)
    
    // Add API key if available
    if (this.apiKey) {
      url.searchParams.append('key', this.apiKey)
    }

    // Add format
    url.searchParams.append('format', params.format || 'JSON')

    // Add all other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'format' && value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    })

    try {
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching USDA data:', error)
      throw error
    }
  }

  /**
   * Get crop data for a specific county
   */
  async getCropData(state: string, countyCode: string, year?: number): Promise<any[]> {
    // Check cache first
    const cached = await this.getCachedData('crops', state, countyCode, year)
    if (cached) {
      return cached.raw_data
    }

    try {
      const params: USDANASSParams = {
        source_desc: 'CENSUS',
        sector_desc: 'CROPS',
        agg_level_desc: 'COUNTY',
        state_alpha: state,
        county_code: countyCode,
        year: year || new Date().getFullYear() - 1, // Previous year by default
      }

      const response = await this.fetchData(params)
      
      // Cache the result
      await this.cacheData('crops', state, countyCode, year, response.data)
      
      return response.data || []
    } catch (error) {
      console.error('Error fetching crop data:', error)
      return []
    }
  }

  /**
   * Get livestock data for a specific county
   */
  async getLivestockData(state: string, countyCode: string, year?: number): Promise<any[]> {
    // Check cache first
    const cached = await this.getCachedData('livestock', state, countyCode, year)
    if (cached) {
      return cached.raw_data
    }

    try {
      const params: USDANASSParams = {
        source_desc: 'CENSUS',
        sector_desc: 'ANIMALS & PRODUCTS',
        agg_level_desc: 'COUNTY',
        state_alpha: state,
        county_code: countyCode,
        year: year || new Date().getFullYear() - 1,
      }

      const response = await this.fetchData(params)
      
      // Cache the result
      await this.cacheData('livestock', state, countyCode, year, response.data)
      
      return response.data || []
    } catch (error) {
      console.error('Error fetching livestock data:', error)
      return []
    }
  }

  /**
   * Get economics data for a specific county
   */
  async getEconomicsData(state: string, countyCode: string, year?: number): Promise<any[]> {
    // Check cache first
    const cached = await this.getCachedData('economics', state, countyCode, year)
    if (cached) {
      return cached.raw_data
    }

    try {
      const params: USDANASSParams = {
        source_desc: 'CENSUS',
        sector_desc: 'ECONOMICS',
        agg_level_desc: 'COUNTY',
        state_alpha: state,
        county_code: countyCode,
        year: year || new Date().getFullYear() - 1,
      }

      const response = await this.fetchData(params)
      
      // Cache the result
      await this.cacheData('economics', state, countyCode, year, response.data)
      
      return response.data || []
    } catch (error) {
      console.error('Error fetching economics data:', error)
      return []
    }
  }

  /**
   * Get comprehensive farm data for a county
   */
  async getCountyFarmData(fips: string): Promise<{
    crops: any[]
    livestock: any[]
    economics: any[]
  }> {
    // Extract state and county code from FIPS
    const state = this.fipsToState(fips.substring(0, 2))
    const countyCode = fips.substring(2)

    const [crops, livestock, economics] = await Promise.all([
      this.getCropData(state, countyCode),
      this.getLivestockData(state, countyCode),
      this.getEconomicsData(state, countyCode)
    ])

    return { crops, livestock, economics }
  }

  /**
   * Cache data in Supabase
   */
  private async cacheData(
    dataType: string, 
    state: string, 
    countyCode: string, 
    year: number | undefined, 
    data: any
  ): Promise<void> {
    try {
      // Get county ID from FIPS
      const fips = this.stateToFips(state) + countyCode.padStart(3, '0')
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) {
        console.warn(`County not found for FIPS: ${fips}`)
        return
      }

      // Insert or update cache
      const { error } = await supabase
        .from('usda_data_cache')
        .upsert({
          county_id: county.id,
          data_type: dataType,
          data_year: year || new Date().getFullYear() - 1,
          raw_data: data,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })

      if (error) {
        console.error('Error caching USDA data:', error)
      }
    } catch (error) {
      console.error('Error caching data:', error)
    }
  }

  /**
   * Get cached data from Supabase
   */
  private async getCachedData(
    dataType: string, 
    state: string, 
    countyCode: string, 
    year?: number
  ): Promise<any | null> {
    try {
      const fips = this.stateToFips(state) + countyCode.padStart(3, '0')
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return null

      const { data, error } = await supabase
        .from('usda_data_cache')
        .select('*')
        .eq('county_id', county.id)
        .eq('data_type', dataType)
        .eq('data_year', year || new Date().getFullYear() - 1)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !data) return null

      return data
    } catch (error) {
      console.error('Error getting cached data:', error)
      return null
    }
  }

  /**
   * Convert FIPS state code to state abbreviation
   */
  private fipsToState(fips: string): string {
    const fipsMap: { [key: string]: string } = {
      '48': 'TX', // Texas
      '06': 'CA', // California  
      '19': 'IA', // Iowa
      '36': 'NY'  // New York
    }
    return fipsMap[fips] || ''
  }

  /**
   * Convert state abbreviation to FIPS code
   */
  private stateToFips(state: string): string {
    const stateMap: { [key: string]: string } = {
      'TX': '48',
      'CA': '06',
      'IA': '19', 
      'NY': '36'
    }
    return stateMap[state] || ''
  }
}

export const usdaService = new USDAService()
export default usdaService
