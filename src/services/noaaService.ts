import { supabase } from './database'

// Weather APIs configuration
const NOAA_BASE_URL = import.meta.env.VITE_NOAA_API_URL || 'https://www.ncdc.noaa.gov/cdo-web/api/v2'
const NOAA_API_KEY = import.meta.env.VITE_NOAA_API_KEY

// Rate limiting configuration
const RATE_LIMIT_DELAY = 200 // ms between requests
let lastRequestTime = 0

// NOAA API interfaces
interface NOAADatasetParams {
  datasetid: string
  locationid?: string
  datatypeid?: string
  stationid?: string
  startdate: string
  enddate: string
  units?: 'standard' | 'metric'
  limit?: number
  offset?: number
  sortfield?: string
  sortorder?: 'asc' | 'desc'
}

interface NOAAResponse {
  metadata: {
    resultset: {
      offset: number
      count: number
      limit: number
    }
  }
  results: any[]
}

interface ClimateData {
  date: string
  temperature_max?: number
  temperature_min?: number
  temperature_avg?: number
  precipitation?: number
  humidity?: number
  wind_speed?: number
  solar_radiation?: number
  growing_degree_days?: number
  frost_days?: number
}

interface ClimateNormals {
  month: number
  temperature_max_avg: number
  temperature_min_avg: number
  precipitation_avg: number
  frost_free_days: number
  growing_season_length: number
  hardiness_zone: string
}

class NOAAService {
  private baseUrl: string
  private apiKey?: string

  constructor() {
    this.baseUrl = NOAA_BASE_URL
    this.apiKey = NOAA_API_KEY
  }

  /**
   * Rate limiting helper
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest))
    }
    lastRequestTime = Date.now()
  }

  /**
   * Fetch data from NOAA API
   */
  private async fetchData(endpoint: string, params: Record<string, any>): Promise<NOAAResponse> {
    await this.rateLimit()

    const url = new URL(`${this.baseUrl}/${endpoint}`)
    
    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    const headers: Record<string, string> = {
      'Accept': 'application/json'
    }

    // Add API key if available
    if (this.apiKey) {
      headers['token'] = this.apiKey
    }

    try {
      const response = await fetch(url.toString(), { headers })
      
      if (!response.ok) {
        throw new Error(`NOAA API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching NOAA data:', error)
      throw error
    }
  }

  /**
   * Get weather stations near a county
   */
  async getWeatherStations(fips: string): Promise<any[]> {
    try {
      // Convert FIPS to coordinates (simplified - in real implementation would use geocoding)
      const coords = this.fipsToCoordinates(fips)
      if (!coords) return []

      const params = {
        datasetid: 'GHCND', // Global Historical Climatology Network Daily
        locationid: `FIPS:${fips}`,
        limit: 50
      }

      const response = await this.fetchData('stations', params)
      return response.results || []
    } catch (error) {
      console.error('Error fetching weather stations:', error)
      return []
    }
  }

  /**
   * Get historical weather data for a county
   */
  async getHistoricalWeatherData(
    fips: string, 
    startDate: string, 
    endDate: string
  ): Promise<ClimateData[]> {
    // Check cache first
    const cached = await this.getCachedWeatherData(fips, startDate, endDate)
    if (cached) {
      return cached
    }

    try {
      const params: NOAADatasetParams = {
        datasetid: 'GHCND',
        locationid: `FIPS:${fips}`,
        startdate: startDate,
        enddate: endDate,
        datatypeid: 'TMAX,TMIN,PRCP', // Max temp, Min temp, Precipitation
        units: 'standard',
        limit: 1000
      }

      const response = await this.fetchData('data', params)
      const processedData = this.processWeatherData(response.results || [])
      
      // Cache the result
      await this.cacheWeatherData(fips, startDate, endDate, processedData)
      
      return processedData
    } catch (error) {
      console.error('Error fetching historical weather data:', error)
      // Return mock data as fallback
      return this.generateMockWeatherData(startDate, endDate)
    }
  }

  /**
   * Get climate normals (30-year averages) for a county
   */
  async getClimateNormals(fips: string): Promise<ClimateNormals[]> {
    // Check cache first
    const cached = await this.getCachedClimateNormals(fips)
    if (cached) {
      return cached
    }

    try {
      const params = {
        datasetid: 'NORMAL_MLY', // Monthly climate normals
        locationid: `FIPS:${fips}`,
        startdate: '2010-01-01',
        enddate: '2020-12-31',
        limit: 12
      }

      const response = await this.fetchData('data', params)
      const normals = this.processClimateNormals(response.results || [])
      
      // Cache the result
      await this.cacheClimateNormals(fips, normals)
      
      return normals
    } catch (error) {
      console.error('Error fetching climate normals:', error)
      // Return mock data as fallback
      return this.generateMockClimateNormals(fips)
    }
  }

  /**
   * Get growing season data for a county
   */
  async getGrowingSeasonData(fips: string, year: number): Promise<{
    first_frost: string | null
    last_frost: string | null
    growing_season_length: number
    growing_degree_days: number
    frost_free_days: number
  }> {
    try {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      
      const weatherData = await this.getHistoricalWeatherData(fips, startDate, endDate)
      
      return this.calculateGrowingSeasonMetrics(weatherData, year)
    } catch (error) {
      console.error('Error calculating growing season data:', error)
      return {
        first_frost: null,
        last_frost: null,
        growing_season_length: 180,
        growing_degree_days: 2500,
        frost_free_days: 200
      }
    }
  }

  /**
   * Process raw weather data into structured format
   */
  private processWeatherData(rawData: any[]): ClimateData[] {
    const dataByDate: { [date: string]: Partial<ClimateData> } = {}

    rawData.forEach(item => {
      const date = item.date.substring(0, 10) // Extract YYYY-MM-DD
      
      if (!dataByDate[date]) {
        dataByDate[date] = { date }
      }

      switch (item.datatype) {
        case 'TMAX':
          dataByDate[date].temperature_max = this.fahrenheitToCelsius(item.value / 10)
          break
        case 'TMIN':
          dataByDate[date].temperature_min = this.fahrenheitToCelsius(item.value / 10)
          break
        case 'PRCP':
          dataByDate[date].precipitation = item.value / 10 // Convert to mm
          break
      }
    })

    // Calculate averages and derived metrics
    return Object.values(dataByDate).map(day => {
      const data = day as ClimateData
      
      if (data.temperature_max && data.temperature_min) {
        data.temperature_avg = (data.temperature_max + data.temperature_min) / 2
        data.growing_degree_days = Math.max(0, data.temperature_avg - 10) // Base 10°C
      }
      
      data.frost_days = data.temperature_min && data.temperature_min <= 0 ? 1 : 0
      
      return data
    })
  }

  /**
   * Process climate normals data
   */
  private processClimateNormals(rawData: any[]): ClimateNormals[] {
    const normalsByMonth: { [month: number]: Partial<ClimateNormals> } = {}

    rawData.forEach(item => {
      const month = parseInt(item.date.substring(5, 7))
      
      if (!normalsByMonth[month]) {
        normalsByMonth[month] = { month }
      }

      // Process different data types based on NOAA standards
      // This would need to be expanded based on actual NOAA response format
      switch (item.datatype) {
        case 'MLY-TMAX-NORMAL':
          normalsByMonth[month].temperature_max_avg = this.fahrenheitToCelsius(item.value / 10)
          break
        case 'MLY-TMIN-NORMAL':
          normalsByMonth[month].temperature_min_avg = this.fahrenheitToCelsius(item.value / 10)
          break
        case 'MLY-PRCP-NORMAL':
          normalsByMonth[month].precipitation_avg = item.value / 10
          break
      }
    })

    // Fill in missing data and calculate derived metrics
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const data = normalsByMonth[month] || { month }
      
      return {
        month,
        temperature_max_avg: data.temperature_max_avg || 20,
        temperature_min_avg: data.temperature_min_avg || 10,
        precipitation_avg: data.precipitation_avg || 50,
        frost_free_days: data.frost_free_days || 30,
        growing_season_length: data.growing_season_length || 180,
        hardiness_zone: this.calculateHardinessZone(data.temperature_min_avg || 10)
      } as ClimateNormals
    })
  }

  /**
   * Calculate growing season metrics
   */
  private calculateGrowingSeasonMetrics(weatherData: ClimateData[], year: number) {
    let firstFrost: string | null = null
    let lastFrost: string | null = null
    let growingDegreeDays = 0
    let frostFreeDays = 0

    // Sort by date
    const sortedData = weatherData.sort((a, b) => a.date.localeCompare(b.date))

    sortedData.forEach(day => {
      if (day.temperature_min !== undefined && day.temperature_min <= 0) {
        if (!lastFrost && day.date.startsWith(String(year))) {
          lastFrost = day.date
        }
        firstFrost = day.date // Keep updating to get the last occurrence
      } else {
        frostFreeDays++
      }

      if (day.growing_degree_days) {
        growingDegreeDays += day.growing_degree_days
      }
    })

    const growingSeasonLength = lastFrost && firstFrost 
      ? Math.max(0, new Date(firstFrost).getTime() - new Date(lastFrost).getTime()) / (1000 * 60 * 60 * 24)
      : 180

    return {
      first_frost: firstFrost,
      last_frost: lastFrost,
      growing_season_length: Math.round(growingSeasonLength),
      growing_degree_days: Math.round(growingDegreeDays),
      frost_free_days: frostFreeDays
    }
  }

  /**
   * Cache weather data in Supabase
   */
  private async cacheWeatherData(
    fips: string,
    startDate: string,
    endDate: string,
    data: ClimateData[]
  ): Promise<void> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return

      await supabase
        .from('weather_data_cache')
        .upsert({
          county_id: county.id,
          data_type: 'historical_weather',
          start_date: startDate,
          end_date: endDate,
          raw_data: data,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
    } catch (error) {
      console.error('Error caching weather data:', error)
    }
  }

  /**
   * Get cached weather data
   */
  private async getCachedWeatherData(
    fips: string,
    startDate: string,
    endDate: string
  ): Promise<ClimateData[] | null> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return null

      const { data } = await supabase
        .from('weather_data_cache')
        .select('raw_data')
        .eq('county_id', county.id)
        .eq('data_type', 'historical_weather')
        .eq('start_date', startDate)
        .eq('end_date', endDate)
        .gt('expires_at', new Date().toISOString())
        .single()

      return data?.raw_data || null
    } catch (error) {
      return null
    }
  }

  /**
   * Cache climate normals
   */
  private async cacheClimateNormals(fips: string, normals: ClimateNormals[]): Promise<void> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return

      await supabase
        .from('weather_data_cache')
        .upsert({
          county_id: county.id,
          data_type: 'climate_normals',
          raw_data: normals,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
    } catch (error) {
      console.error('Error caching climate normals:', error)
    }
  }

  /**
   * Get cached climate normals
   */
  private async getCachedClimateNormals(fips: string): Promise<ClimateNormals[] | null> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return null

      const { data } = await supabase
        .from('weather_data_cache')
        .select('raw_data')
        .eq('county_id', county.id)
        .eq('data_type', 'climate_normals')
        .gt('expires_at', new Date().toISOString())
        .single()

      return data?.raw_data || null
    } catch (error) {
      return null
    }
  }

  /**
   * Generate mock weather data as fallback
   */
  private generateMockWeatherData(startDate: string, endDate: string): ClimateData[] {
    const data: ClimateData[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
      const seasonalTemp = 15 + 10 * Math.sin((dayOfYear / 365) * 2 * Math.PI - Math.PI/2)
      
      data.push({
        date: d.toISOString().substring(0, 10),
        temperature_max: seasonalTemp + 5 + Math.random() * 5,
        temperature_min: seasonalTemp - 5 + Math.random() * 5,
        temperature_avg: seasonalTemp + Math.random() * 2,
        precipitation: Math.random() < 0.3 ? Math.random() * 20 : 0,
        humidity: 60 + Math.random() * 30,
        wind_speed: 5 + Math.random() * 10,
        growing_degree_days: Math.max(0, seasonalTemp - 10),
        frost_days: seasonalTemp < 0 ? 1 : 0
      })
    }
    
    return data
  }

  /**
   * Generate mock climate normals
   */
  private generateMockClimateNormals(fips: string): ClimateNormals[] {
    // Use FIPS to determine rough climate zone
    const stateCode = fips.substring(0, 2)
    let baseTemp = 15 // Default moderate climate
    
    // Adjust based on state (very simplified)
    switch (stateCode) {
      case '48': baseTemp = 20; break // Texas - warmer
      case '06': baseTemp = 18; break // California - mild
      case '19': baseTemp = 10; break // Iowa - continental
      case '36': baseTemp = 12; break // New York - continental
    }

    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const seasonalAdjustment = 10 * Math.sin(((month - 1) / 12) * 2 * Math.PI - Math.PI/2)
      
      return {
        month,
        temperature_max_avg: baseTemp + seasonalAdjustment + 5,
        temperature_min_avg: baseTemp + seasonalAdjustment - 5,
        precipitation_avg: 40 + Math.random() * 40,
        frost_free_days: Math.max(0, 30 - Math.abs(seasonalAdjustment)),
        growing_season_length: 180,
        hardiness_zone: this.calculateHardinessZone(baseTemp + seasonalAdjustment - 5)
      }
    })
  }

  /**
   * Helper functions
   */
  private fahrenheitToCelsius(f: number): number {
    return (f - 32) * 5/9
  }

  private calculateHardinessZone(minTemp: number): string {
    if (minTemp >= 15) return '10a'
    if (minTemp >= 10) return '9a'
    if (minTemp >= 5) return '8a'
    if (minTemp >= 0) return '7a'
    if (minTemp >= -5) return '6a'
    if (minTemp >= -10) return '5a'
    return '4a'
  }

  private fipsToCoordinates(fips: string): { lat: number, lon: number } | null {
    // Simplified mapping - in real implementation would use proper geocoding
    const coords: { [key: string]: { lat: number, lon: number } } = {
      '48001': { lat: 32.3617, lon: -99.9018 }, // Texas example
      '06037': { lat: 34.0522, lon: -118.2437 }, // California example
      '19153': { lat: 41.5868, lon: -93.6250 }, // Iowa example
      '36061': { lat: 40.7128, lon: -74.0060 } // New York example
    }
    
    return coords[fips] || null
  }
}

export const noaaService = new NOAAService()
export default noaaService
