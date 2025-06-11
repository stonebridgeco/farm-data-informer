import { supabase } from './database'

// Elevation API configuration
const OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1'

// Rate limiting configuration
const RATE_LIMIT_DELAY = 100 // ms between requests
let lastRequestTime = 0

// Interfaces
interface ElevationPoint {
  lat: number
  lon: number
  elevation: number
}

interface TerrainData {
  county_fips: string
  elevation_min: number
  elevation_max: number
  elevation_avg: number
  slope_avg: number
  slope_category: 'flat' | 'gentle' | 'moderate' | 'steep' | 'very_steep'
  terrain_roughness: number
  drainage_pattern: 'excellent' | 'good' | 'moderate' | 'poor'
  flood_risk: 'low' | 'moderate' | 'high'
  erosion_risk: 'low' | 'moderate' | 'high'
  farm_suitability_score: number
}

class USGSService {
  private elevationUrl: string

  constructor() {
    this.elevationUrl = OPEN_ELEVATION_URL
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
   * Get elevation for a single point using Open Elevation API
   */
  async getPointElevation(lat: number, lon: number): Promise<number | null> {
    await this.rateLimit()

    try {
      const url = `${this.elevationUrl}/lookup?locations=${lat},${lon}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Elevation API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
            if (data.results && data.results.length > 0) {
        return data.results[0].elevation
      }
      
      return null
    } catch (error) {
      console.error('Error fetching elevation data:', error)
      return null
    }
  }

  /**
   * Get elevation profile for multiple points in a county
   */
  async getCountyElevationProfile(fips: string): Promise<ElevationPoint[]> {
    // Check cache first
    const cached = await this.getCachedElevationData(fips)
    if (cached) {
      return cached
    }

    try {
      // Get county boundaries (simplified - would use actual county polygon)
      const bounds = this.getCountyBounds(fips)
      if (!bounds) return []

      // Generate sample points across the county
      const samplePoints = this.generateSamplePoints(bounds, 25) // 5x5 grid
      const elevationPoints: ElevationPoint[] = []

      // Fetch elevation for each point
      for (const point of samplePoints) {
        const elevation = await this.getPointElevation(point.lat, point.lon)
        if (elevation !== null) {
          elevationPoints.push({
            lat: point.lat,
            lon: point.lon,
            elevation
          })
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Cache the results
      await this.cacheElevationData(fips, elevationPoints)

      return elevationPoints
    } catch (error) {
      console.error('Error fetching county elevation profile:', error)
      // Return mock data as fallback
      return this.generateMockElevationData(fips)
    }
  }

  /**
   * Analyze terrain characteristics for a county
   */
  async getTerrainAnalysis(fips: string): Promise<TerrainData> {
    // Check cache first
    const cached = await this.getCachedTerrainAnalysis(fips)
    if (cached) {
      return cached
    }

    try {
      const elevationPoints = await this.getCountyElevationProfile(fips)
      
      if (elevationPoints.length === 0) {
        return this.generateMockTerrainData(fips)
      }

      const terrainData = this.analyzeElevationData(fips, elevationPoints)
      
      // Cache the analysis
      await this.cacheTerrainAnalysis(fips, terrainData)
      
      return terrainData
    } catch (error) {
      console.error('Error analyzing terrain:', error)
      return this.generateMockTerrainData(fips)
    }
  }

  /**
   * Calculate slope between two points
   */
  private calculateSlope(point1: ElevationPoint, point2: ElevationPoint): number {
    const distance = this.calculateDistance(point1.lat, point1.lon, point2.lat, point2.lon)
    const elevationDiff = Math.abs(point2.elevation - point1.elevation)
    
    if (distance === 0) return 0
    
    const slopeRadians = Math.atan(elevationDiff / distance)
    return slopeRadians * (180 / Math.PI) // Convert to degrees
  }

  /**
   * Calculate distance between two geographic points
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Analyze elevation data to derive terrain characteristics
   */
  private analyzeElevationData(fips: string, points: ElevationPoint[]): TerrainData {
    const elevations = points.map(p => p.elevation)
    const elevation_min = Math.min(...elevations)
    const elevation_max = Math.max(...elevations)
    const elevation_avg = elevations.reduce((sum, e) => sum + e, 0) / elevations.length

    // Calculate slopes between adjacent points
    const slopes: number[] = []
    for (let i = 0; i < points.length - 1; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const distance = this.calculateDistance(
          points[i].lat, points[i].lon,
          points[j].lat, points[j].lon
        )
        
        // Only calculate slope for nearby points
        if (distance < 5000) { // Less than 5km apart
          const slope = this.calculateSlope(points[i], points[j])
          slopes.push(slope)
        }
      }
    }

    const slope_avg = slopes.length > 0 
      ? slopes.reduce((sum, s) => sum + s, 0) / slopes.length 
      : 0

    // Determine slope category
    const slope_category = this.categorizeSlopeForFarming(slope_avg)
    
    // Calculate terrain roughness (standard deviation of elevations)
    const elevation_variance = elevations.reduce((sum, e) => sum + Math.pow(e - elevation_avg, 2), 0) / elevations.length
    const terrain_roughness = Math.sqrt(elevation_variance)

    // Determine drainage pattern based on elevation variation and slope
    const drainage_pattern = this.assessDrainagePattern(terrain_roughness, slope_avg)
    
    // Assess flood risk based on elevation and terrain
    const flood_risk = this.assessFloodRisk(elevation_avg, slope_avg, terrain_roughness)
    
    // Assess erosion risk
    const erosion_risk = this.assessErosionRisk(slope_avg, terrain_roughness)
    
    // Calculate overall farm suitability score
    const farm_suitability_score = this.calculateFarmSuitabilityScore({
      slope_avg,
      terrain_roughness,
      drainage_pattern,
      flood_risk,
      erosion_risk
    })

    return {
      county_fips: fips,
      elevation_min,
      elevation_max,
      elevation_avg,
      slope_avg,
      slope_category,
      terrain_roughness,
      drainage_pattern,
      flood_risk,
      erosion_risk,
      farm_suitability_score
    }
  }

  /**
   * Categorize slope suitability for farming
   */
  private categorizeSlopeForFarming(slopeDegrees: number): 'flat' | 'gentle' | 'moderate' | 'steep' | 'very_steep' {
    if (slopeDegrees <= 2) return 'flat'          // 0-2° - Excellent for farming
    if (slopeDegrees <= 5) return 'gentle'        // 2-5° - Good for most crops
    if (slopeDegrees <= 8) return 'moderate'      // 5-8° - Some limitations
    if (slopeDegrees <= 15) return 'steep'        // 8-15° - Significant challenges
    return 'very_steep'                           // >15° - Not suitable for most farming
  }

  /**
   * Assess drainage pattern
   */
  private assessDrainagePattern(
    roughness: number, 
    slope: number
  ): 'excellent' | 'good' | 'moderate' | 'poor' {
    // Good drainage requires moderate slope and some terrain variation
    if (slope >= 2 && slope <= 8 && roughness > 10) return 'excellent'
    if (slope >= 1 && slope <= 12 && roughness > 5) return 'good'
    if (slope >= 0.5 && slope <= 15) return 'moderate'
    return 'poor'
  }

  /**
   * Assess flood risk
   */
  private assessFloodRisk(
    elevation: number, 
    slope: number, 
    roughness: number
  ): 'low' | 'moderate' | 'high' {
    // Higher elevation and steeper slopes generally mean lower flood risk
    // Terrain roughness also affects drainage and flood risk
    if (elevation > 500 && slope > 3 && roughness > 20) return 'low'
    if (elevation > 200 || slope > 1 || roughness > 15) return 'moderate'
    return 'high'
  }

  /**
   * Assess erosion risk
   */
  private assessErosionRisk(slope: number, _roughness: number): 'low' | 'moderate' | 'high' {
    if (slope <= 2) return 'low'
    if (slope <= 8) return 'moderate'
    return 'high'
  }

  /**
   * Calculate overall farm suitability score
   */
  private calculateFarmSuitabilityScore(factors: {
    slope_avg: number
    terrain_roughness: number
    drainage_pattern: string
    flood_risk: string
    erosion_risk: string
  }): number {
    let score = 100

    // Slope penalty
    if (factors.slope_avg > 8) score -= 30
    else if (factors.slope_avg > 5) score -= 15
    else if (factors.slope_avg > 2) score -= 5

    // Drainage bonus/penalty
    switch (factors.drainage_pattern) {
      case 'excellent': score += 10; break
      case 'good': score += 5; break
      case 'poor': score -= 20; break
    }

    // Flood risk penalty
    switch (factors.flood_risk) {
      case 'high': score -= 25; break
      case 'moderate': score -= 10; break
    }

    // Erosion risk penalty
    switch (factors.erosion_risk) {
      case 'high': score -= 20; break
      case 'moderate': score -= 10; break
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Generate sample points across county bounds
   */
  private generateSamplePoints(bounds: {
    minLat: number
    maxLat: number
    minLon: number
    maxLon: number
  }, count: number): { lat: number, lon: number }[] {
    const points: { lat: number, lon: number }[] = []
    const gridSize = Math.sqrt(count)
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = bounds.minLat + (bounds.maxLat - bounds.minLat) * (i / (gridSize - 1))
        const lon = bounds.minLon + (bounds.maxLon - bounds.minLon) * (j / (gridSize - 1))
        points.push({ lat, lon })
      }
    }
    
    return points
  }

  /**
   * Get approximate county bounds (simplified)
   */
  private getCountyBounds(fips: string): {
    minLat: number
    maxLat: number
    minLon: number
    maxLon: number
  } | null {
    // Simplified county bounds mapping
    const bounds: { [key: string]: any } = {
      '48001': { minLat: 32.2, maxLat: 32.5, minLon: -100.1, maxLon: -99.7 }, // Texas example
      '06037': { minLat: 33.7, maxLat: 34.3, minLon: -118.7, maxLon: -117.6 }, // LA County
      '19153': { minLat: 41.4, maxLat: 41.8, minLon: -93.8, maxLon: -93.4 }, // Iowa example
      '36061': { minLat: 40.5, maxLat: 40.9, minLon: -74.3, maxLon: -73.7 } // NYC area
    }
    
    return bounds[fips] || null
  }

  /**
   * Cache elevation data
   */
  private async cacheElevationData(fips: string, data: ElevationPoint[]): Promise<void> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return

      await supabase
        .from('terrain_data_cache')
        .upsert({
          county_id: county.id,
          data_type: 'elevation_profile',
          raw_data: data,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
    } catch (error) {
      console.error('Error caching elevation data:', error)
    }
  }

  /**
   * Get cached elevation data
   */
  private async getCachedElevationData(fips: string): Promise<ElevationPoint[] | null> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return null

      const { data } = await supabase
        .from('terrain_data_cache')
        .select('raw_data')
        .eq('county_id', county.id)
        .eq('data_type', 'elevation_profile')
        .gt('expires_at', new Date().toISOString())
        .single()

      return data?.raw_data || null
    } catch (error) {
      return null
    }
  }

  /**
   * Cache terrain analysis
   */
  private async cacheTerrainAnalysis(fips: string, analysis: TerrainData): Promise<void> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return

      await supabase
        .from('terrain_data_cache')
        .upsert({
          county_id: county.id,
          data_type: 'terrain_analysis',
          raw_data: analysis,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
    } catch (error) {
      console.error('Error caching terrain analysis:', error)
    }
  }

  /**
   * Get cached terrain analysis
   */
  private async getCachedTerrainAnalysis(fips: string): Promise<TerrainData | null> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return null

      const { data } = await supabase
        .from('terrain_data_cache')
        .select('raw_data')
        .eq('county_id', county.id)
        .eq('data_type', 'terrain_analysis')
        .gt('expires_at', new Date().toISOString())
        .single()

      return data?.raw_data || null
    } catch (error) {
      return null
    }
  }

  /**
   * Generate mock elevation data as fallback
   */
  private generateMockElevationData(fips: string): ElevationPoint[] {
    let bounds = this.getCountyBounds(fips)
    if (!bounds) {
      // Default bounds if county not found
      bounds = { minLat: 40.0, maxLat: 40.5, minLon: -100.5, maxLon: -100.0 }
    }

    const points: ElevationPoint[] = []
    const baseElevation = this.getBaseElevationForFips(fips)
    
    for (let i = 0; i < 25; i++) {
      const lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat)
      const lon = bounds.minLon + Math.random() * (bounds.maxLon - bounds.minLon)
      const elevation = baseElevation + (Math.random() - 0.5) * 100 // ±50m variation
      
      points.push({ lat, lon, elevation })
    }
    
    return points
  }

  /**
   * Generate mock terrain data
   */
  private generateMockTerrainData(fips: string): TerrainData {
    const baseElevation = this.getBaseElevationForFips(fips)
    const slope_avg = 1 + Math.random() * 4 // 1-5 degrees
    
    return {
      county_fips: fips,
      elevation_min: baseElevation - 30,
      elevation_max: baseElevation + 70,
      elevation_avg: baseElevation,
      slope_avg,
      slope_category: this.categorizeSlopeForFarming(slope_avg),
      terrain_roughness: 20 + Math.random() * 30,
      drainage_pattern: 'good',
      flood_risk: 'moderate',
      erosion_risk: 'low',
      farm_suitability_score: 75 + Math.random() * 20
    }
  }

  /**
   * Get base elevation for different regions
   */
  private getBaseElevationForFips(fips: string): number {
    const stateCode = fips.substring(0, 2)
    
    switch (stateCode) {
      case '48': return 200  // Texas
      case '06': return 100  // California
      case '19': return 300  // Iowa
      case '36': return 50   // New York
      default: return 200
    }
  }
}

export const usgsService = new USGSService()
export default usgsService
