// EPA ATTAINS Water Quality Service
// Provides water quality assessments for irrigation safety

// EPA ATTAINS API interface
interface EPAATTAINSParams {
  organizationId?: string
  huc?: string
  assessmentUnitId?: string
  stateCode?: string
  reportingCycleCode?: string
  assessmentType?: string
  waterType?: string
  returnCountOnly?: boolean
  format?: 'JSON' | 'CSV' | 'XML'
}

interface EPAATTAINSResponse {
  items: any[]
  count: number
  status?: string
  message?: string
}

interface WaterQualityData {
  id: string
  county_id: string
  assessment_unit_id: string
  water_body_name: string
  water_type: string
  assessment_date: string
  use_attainment: string
  impairment_status: string
  pollutants: string[]
  data_source: string
  created_at: string
}

/**
 * EPA ATTAINS API service for water quality data
 */
class EPAService {
  private baseUrl: string

  constructor() {
    this.baseUrl = 'https://attains.epa.gov/attains-public/api'
  }

  /**
   * Fetch water quality assessments from EPA ATTAINS API
   */
  async fetchAssessments(params: EPAATTAINSParams): Promise<EPAATTAINSResponse> {
    const url = new URL(`${this.baseUrl}/assessments`)
    
    // Add format
    url.searchParams.append('format', params.format || 'JSON')

    // Add all other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'format' && value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    })

    try {
      console.log('EPA ATTAINS API Request:', url.toString())
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`EPA ATTAINS API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Handle validation errors
      if (data.msg && data.msg.includes('validation error')) {
        console.warn('EPA ATTAINS validation error:', data.msg)
        return { items: [], count: 0 }
      }
      
      return data
    } catch (error) {
      console.error('Error fetching EPA ATTAINS data:', error)
      return { items: [], count: 0 }
    }
  }

  /**
   * Get water quality data for a specific county by FIPS
   */
  async getWaterQualityByFips(fips: string): Promise<WaterQualityData[]> {
    // Check cache first
    const cached = await this.getCachedWaterQuality(fips)
    if (cached && cached.length > 0) {
      return cached
    }

    try {
      // Convert FIPS to state code for EPA query
      const stateCode = this.fipsToState(fips.substring(0, 2))
      
      if (!stateCode) {
        console.warn(`Unknown state FIPS: ${fips.substring(0, 2)}`)
        return []
      }

      // Try different query approaches
      const queries = [
        { organizationId: `${stateCode}_DENR` }, // Department of Environmental/Natural Resources
        { organizationId: `${stateCode}DENR` },  // Alternative format
        { organizationId: `${stateCode}_DEQ` },  // Department of Environmental Quality
        { organizationId: stateCode }             // Just state code
      ]

      let allAssessments: any[] = []

      for (const query of queries) {
        try {
          const response = await this.fetchAssessments(query)
          if (response.items && response.items.length > 0) {
            allAssessments = allAssessments.concat(response.items)
          }
        } catch (error) {
          console.warn(`Query failed for ${JSON.stringify(query)}:`, error)
        }
      }

      // Process and filter assessments for the specific county
      const waterQualityData = this.processAssessments(allAssessments, fips)
      
      // Cache the results
      await this.cacheWaterQuality(fips, waterQualityData)
      
      return waterQualityData
    } catch (error) {
      console.error('Error fetching water quality data:', error)
      return []
    }
  }

  /**
   * Get domain values for EPA ATTAINS
   */
  async getDomains(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/domains`)
      
      if (!response.ok) {
        throw new Error(`EPA Domains API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching EPA domains:', error)
      return []
    }
  }

  /**
   * Process raw assessment data into structured water quality data
   */
  private processAssessments(assessments: any[], fips: string): WaterQualityData[] {
    return assessments
      .filter(assessment => {
        // Filter assessments that might be relevant to the county
        // This is a simplified approach - in production you'd need more sophisticated geographic matching
        return assessment && (
          assessment.organizationId?.includes(this.fipsToState(fips.substring(0, 2))) ||
          assessment.stateCode === this.fipsToState(fips.substring(0, 2))
        )
      })
      .map(assessment => ({
        id: `epa_${assessment.assessmentUnitId || Math.random().toString(36)}`,
        county_id: fips,
        assessment_unit_id: assessment.assessmentUnitId || '',
        water_body_name: assessment.assessmentUnitName || 'Unknown',
        water_type: assessment.waterType || 'Unknown',
        assessment_date: assessment.reportingCycleCode || '2020',
        use_attainment: assessment.overallStatus || 'Unknown',
        impairment_status: assessment.epaIRCategory || 'Unknown',
        pollutants: assessment.pollutants || [],
        data_source: 'EPA ATTAINS',
        created_at: new Date().toISOString()
      }))
  }

  /**
   * Cache water quality data for future use
   */
  private async cacheWaterQuality(fips: string, data: WaterQualityData[]): Promise<void> {
    try {
      // Note: This would require creating a water_quality_cache table
      console.log('Water quality cache entry prepared:', { fips, count: data.length })
    } catch (error) {
      console.error('Error caching water quality data:', error)
    }
  }

  /**
   * Get cached water quality data
   */
  private async getCachedWaterQuality(_fips: string): Promise<WaterQualityData[]> {
    try {
      // This would query the water_quality_cache table
      // For now, return empty array
      return []
    } catch (error) {
      console.error('Error getting cached water quality data:', error)
      return []
    }
  }

  /**
   * Convert FIPS state code to state abbreviation
   */
  private fipsToState(fips: string): string {
    const stateMap: { [key: string]: string } = {
      '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO',
      '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI',
      '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY',
      '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
      '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
      '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH',
      '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD',
      '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
      '54': 'WV', '55': 'WI', '56': 'WY'
    }
    return stateMap[fips] || ''
  }

  /**
   * Get water quality summary for a county
   */
  async getWaterQualitySummary(fips: string): Promise<{
    totalAssessments: number
    impairedWaters: number
    pollutantTypes: string[]
    overallRating: 'Good' | 'Fair' | 'Poor' | 'Unknown'
  }> {
    const waterQualityData = await this.getWaterQualityByFips(fips)
    
    const totalAssessments = waterQualityData.length
    const impairedWaters = waterQualityData.filter(w => 
      w.impairment_status && !['1', '2'].includes(w.impairment_status)
    ).length
    
    const pollutantTypes = Array.from(new Set(
      waterQualityData.flatMap(w => w.pollutants || [])
    ))
    
    let overallRating: 'Good' | 'Fair' | 'Poor' | 'Unknown' = 'Unknown'
    if (totalAssessments > 0) {
      const impairedRatio = impairedWaters / totalAssessments
      if (impairedRatio < 0.2) overallRating = 'Good'
      else if (impairedRatio < 0.5) overallRating = 'Fair'
      else overallRating = 'Poor'
    }
    
    return {
      totalAssessments,
      impairedWaters,
      pollutantTypes,
      overallRating
    }
  }
}

export const epaService = new EPAService()
export default epaService
