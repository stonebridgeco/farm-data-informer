import { supabase } from './database'

// USGS M2M API configuration
const USGS_M2M_BASE_URL = 'https://m2m.cr.usgs.gov/api/api/json/stable'
const USGS_M2M_USERNAME = 'login-token'
const USGS_M2M_TOKEN = import.meta.env.VITE_USGS_M2M_TOKEN

// Interfaces for USGS M2M data
interface LandsatScene {
  sceneId: string
  acquisitionDate: string
  cloudCover: number
  path: number
  row: number
  displayId: string
}

interface NDVIData {
  county_fips: string
  date: string
  ndvi_avg: number
  ndvi_min: number
  ndvi_max: number
  vegetation_health: 'poor' | 'fair' | 'good' | 'excellent'
  crop_stress_level: number
}

interface SatelliteImagery {
  sceneId: string
  imageUrl: string
  thumbnailUrl: string
  bands: string[]
  resolution: number
  cloudCover: number
}

class USGSM2MService {
  private sessionToken: string | null = null
  private tokenExpiry: Date | null = null

  /**
   * Authenticate with USGS M2M API using login token
   */
  async authenticate(): Promise<boolean> {
    try {
      if (!USGS_M2M_TOKEN) {
        console.warn('USGS M2M token not configured')
        return false
      }

      const response = await fetch(`${USGS_M2M_BASE_URL}/login-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: USGS_M2M_USERNAME,
          token: USGS_M2M_TOKEN
        })
      })

      const data = await response.json()

      if (data.errorCode) {
        console.error('USGS M2M Authentication failed:', data.errorMessage)
        return false
      }

      this.sessionToken = data.data
      this.tokenExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
      
      console.log('USGS M2M authenticated successfully')
      return true

    } catch (error) {
      console.error('USGS M2M authentication error:', error)
      return false
    }
  }

  /**
   * Check if current session is valid
   */
  private isSessionValid(): boolean {
    return this.sessionToken !== null && 
           this.tokenExpiry !== null && 
           this.tokenExpiry > new Date()
  }

  /**
   * Make authenticated request to USGS M2M API
   */
  private async makeRequest(endpoint: string, payload: any = {}): Promise<any> {
    if (!this.isSessionValid()) {
      const authSuccess = await this.authenticate()
      if (!authSuccess) {
        throw new Error('Failed to authenticate with USGS M2M API')
      }
    }

    const response = await fetch(`${USGS_M2M_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': this.sessionToken!
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (data.errorCode) {
      throw new Error(`USGS M2M API Error: ${data.errorMessage}`)
    }

    return data.data
  }

  /**
   * Search for Landsat scenes by county coordinates
   */
  async searchLandsatScenes(lat: number, lon: number, startDate?: string, endDate?: string): Promise<LandsatScene[]> {
    try {
      const searchParams = {
        datasetName: 'landsat_ot_c2_l2',
        sceneFilter: {
          spatialFilter: {
            filterType: 'mbr',
            lowerLeft: { latitude: lat - 0.1, longitude: lon - 0.1 },
            upperRight: { latitude: lat + 0.1, longitude: lon + 0.1 }
          },
          ...(startDate && endDate && {
            temporalFilter: {
              startDate,
              endDate
            }
          }),
          cloudCoverFilter: {
            max: 20 // Only scenes with < 20% cloud cover
          }
        },
        maxResults: 10
      }

      const scenes = await this.makeRequest('scene-search', searchParams)
      
      return scenes.map((scene: any) => ({
        sceneId: scene.sceneId,
        acquisitionDate: scene.acquisitionDate,
        cloudCover: scene.cloudCover,
        path: scene.path,
        row: scene.row,
        displayId: scene.displayId
      }))

    } catch (error) {
      console.error('Error searching Landsat scenes:', error)
      return []
    }
  }

  /**
   * Calculate NDVI data for a county using Landsat imagery
   */
  async calculateNDVI(countyFips: string, lat: number, lon: number): Promise<NDVIData | null> {
    try {
      // Search for recent scenes
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days ago
      
      const scenes = await this.searchLandsatScenes(lat, lon, startDate, endDate)
      
      if (scenes.length === 0) {
        return null
      }

      // For now, simulate NDVI calculation
      // In full implementation, would download and process actual imagery
      const mockNDVI = {
        county_fips: countyFips,
        date: scenes[0].acquisitionDate,
        ndvi_avg: 0.7 + Math.random() * 0.2,
        ndvi_min: 0.3 + Math.random() * 0.2,
        ndvi_max: 0.8 + Math.random() * 0.15,
        vegetation_health: 'good' as const,
        crop_stress_level: Math.random() * 30
      }

      // Cache in Supabase
      await this.cacheNDVIData(mockNDVI)
      
      return mockNDVI

    } catch (error) {
      console.error('Error calculating NDVI:', error)
      return null
    }
  }

  /**
   * Get satellite imagery URLs for display
   */
  async getSatelliteImagery(sceneId: string): Promise<SatelliteImagery | null> {
    try {
      // Process download options to get imagery URLs
      // This would need full implementation based on USGS M2M download workflow
      
      return {
        sceneId,
        imageUrl: 'placeholder-url',
        thumbnailUrl: 'placeholder-thumbnail',
        bands: ['B4', 'B3', 'B2'], // RGB bands
        resolution: 30, // 30m resolution
        cloudCover: 10
      }

    } catch (error) {
      console.error('Error getting satellite imagery:', error)
      return null
    }
  }

  /**
   * Cache NDVI data in Supabase
   */
  private async cacheNDVIData(ndviData: NDVIData): Promise<void> {
    try {
      const { error } = await supabase
        .from('satellite_data')
        .upsert({
          county_fips: ndviData.county_fips,
          data_type: 'ndvi',
          date: ndviData.date,
          metrics: {
            ndvi_avg: ndviData.ndvi_avg,
            ndvi_min: ndviData.ndvi_min,
            ndvi_max: ndviData.ndvi_max,
            vegetation_health: ndviData.vegetation_health,
            crop_stress_level: ndviData.crop_stress_level
          },
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'county_fips,data_type,date'
        })

      if (error) {
        console.error('Error caching NDVI data:', error)
      }
    } catch (error) {
      console.error('Error saving to database:', error)
    }
  }

  /**
   * Logout from USGS M2M API
   */
  async logout(): Promise<void> {
    if (this.sessionToken) {
      try {
        await fetch(`${USGS_M2M_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': this.sessionToken
          }
        })
      } catch (error) {
        console.error('Error during logout:', error)
      }
      
      this.sessionToken = null
      this.tokenExpiry = null
    }
  }
}

export default new USGSM2MService()
