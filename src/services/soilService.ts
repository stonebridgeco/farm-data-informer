import { supabase } from './database'

// USDA Soil Data Access API configuration
const SOIL_API_BASE_URL = import.meta.env.VITE_USDA_SOIL_API_URL || 'https://SDMDataAccess.sc.egov.usda.gov'
const SOIL_API_SOAP_ENDPOINT = `${SOIL_API_BASE_URL}/Tabular/SDMTabularService.asmx`
const SOIL_API_REST_ENDPOINT = `${SOIL_API_BASE_URL}/Tabular/post.rest`

// Rate limiting configuration
const RATE_LIMIT_DELAY = 300 // ms between requests
let lastRequestTime = 0

// Soil data interfaces
interface SoilData {
  county_fips: string
  dominant_soil_type: string
  soil_ph_avg: number
  soil_ph_range: { min: number, max: number }
  organic_matter_percent: number
  drainage_class: 'well_drained' | 'moderately_well_drained' | 'somewhat_poorly_drained' | 'poorly_drained'
  texture_class: string
  depth_to_bedrock: number
  available_water_capacity: number
  permeability_rate: string
  erosion_factor: number
  fertility_rating: 'excellent' | 'good' | 'fair' | 'poor'
  limitations: string[]
  suitable_crops: string[]
  soil_suitability_score: number
}

interface SoilComponent {
  component_name: string
  percent_of_area: number
  soil_ph: number
  organic_matter: number
  drainage_class: string
  texture: string
  depth: number
  limitations: string[]
}

interface SoilSurvey {
  survey_area: string
  map_unit_key: string
  map_unit_name: string
  components: SoilComponent[]
  acres: number
  percent_of_county: number
}

class SoilService {
  constructor() {
    // USDA Soil Data Access API endpoints configured
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
   * Execute SQL query against USDA Soil Database (REST API first, SOAP fallback)
   */
  private async executeSoilQuery(query: string): Promise<any[]> {
    await this.rateLimit()

    // Try REST API first
    try {
      return await this.executeSoilQueryREST(query)
    } catch (restError) {
      console.warn('REST API failed, trying SOAP API:', restError)
      
      // Fallback to SOAP API
      try {
        return await this.executeSoilQuerySOAP(query)
      } catch (soapError) {
        console.error('Both REST and SOAP APIs failed:', { restError, soapError })
        throw new Error(`Soil API unavailable: REST failed (${(restError as Error).message}), SOAP failed (${(soapError as Error).message})`)
      }
    }
  }

  /**
   * Execute query using REST API
   * Note: Direct browser access may be blocked by CORS. This method is designed for server-side use.
   */
  private async executeSoilQueryREST(query: string): Promise<any[]> {
    // Format the request body as form data (as specified in USDA documentation)
    const formData = new FormData()
    formData.append('query', query)
    formData.append('format', 'JSON')

    const response = await fetch(SOIL_API_REST_ENDPOINT, {
      method: 'POST',
      body: formData,
      // Extended timeout for large soil database queries
      signal: AbortSignal.timeout(60000) // 60 second timeout
    })

    if (!response.ok) {
      // Check if it's a CORS error
      if (response.status === 0 || response.status === 404) {
        throw new Error(`CORS or network error - soil queries may need server-side proxy`)
      }
      throw new Error(`REST API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.Table || []
  }

  /**
   * Execute query using SOAP API (fallback)
   */
  private async executeSoilQuerySOAP(query: string): Promise<any[]> {
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                   xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
                   xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <RunQuery xmlns="http://SDMDataAccess.nrcs.usda.gov/Tabular/SDMTabularService.asmx">
          <Query>${query}</Query>
          <Format>JSON</Format>
        </RunQuery>
      </soap:Body>
    </soap:Envelope>`

    const response = await fetch(SOIL_API_SOAP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://SDMDataAccess.nrcs.usda.gov/Tabular/SDMTabularService.asmx/RunQuery'
      },
      body: soapBody
    })

    if (!response.ok) {
      throw new Error(`SOAP API error: ${response.status} ${response.statusText}`)
    }

    const xmlText = await response.text()
    
    // Parse XML response to extract JSON data
    // This is a simplified parser - in production, use a proper XML parser
    const jsonMatch = xmlText.match(/<RunQueryResult[^>]*>(.*?)<\/RunQueryResult>/s)
    if (!jsonMatch) {
      throw new Error('No data found in SOAP response')
    }

    try {
      const jsonData = JSON.parse(jsonMatch[1])
      return jsonData.Table || []
    } catch (parseError) {
      throw new Error(`Failed to parse SOAP response: ${(parseError as Error).message}`)
    }
  }

  /**
   * Get soil survey areas for a county
   */
  async getSoilSurveyAreas(fips: string): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT areasymbol, areaname
        FROM legend l
        INNER JOIN laoverlap lo ON l.lkey = lo.lkey
        WHERE lo.areatypename = 'County or Parish' 
        AND REPLACE(lo.areaname, ' ', '') LIKE '%${this.fipsToCountyName(fips)}%'
      `

      const results = await this.executeSoilQuery(query)
      return results.map(r => r.areasymbol)
    } catch (error) {
      console.error('Error fetching soil survey areas:', error)
      return []
    }
  }

  /**
   * Get detailed soil data for a county
   */
  async getCountySoilData(fips: string): Promise<SoilData | null> {
    // Check cache first
    const cached = await this.getCachedSoilData(fips)
    if (cached) {
      return cached
    }

    try {
      const soilSurveys = await this.getDetailedSoilSurveys(fips)
      
      if (soilSurveys.length === 0) {
        console.warn(`No soil data available for county ${fips} - API may be inaccessible from browser`)
        return null
      }

      const soilData = this.analyzeSoilSurveys(fips, soilSurveys)
      
      // Cache the result
      await this.cacheSoilData(fips, soilData)
      
      return soilData
    } catch (error) {
      console.error('Error fetching county soil data:', error)
      console.warn('USDA Soil API requires server-side access - browser requests blocked by CORS')
      return null
    }
  }

  /**
   * Get detailed soil surveys for a county
   */
  private async getDetailedSoilSurveys(fips: string): Promise<SoilSurvey[]> {
    try {
      // This is a simplified query - the actual USDA soil database has very complex schemas
      const query = `
        SELECT 
          l.areasymbol,
          mu.mukey,
          mu.muname,
          mu.mukind,
          mu.muacres,
          co.compname,
          co.comppct_r as component_percent,
          co.majcompflag,
          ch.ph1to1h2o_r as soil_ph,
          ch.om_r as organic_matter,
          ch.awc_r as available_water_capacity,
          co.drainagecl as drainage_class,
          cht.texdesc as texture_description,
          cr.resdept_r as depth_to_bedrock
        FROM legend l
        INNER JOIN mapunit mu ON l.lkey = mu.lkey
        INNER JOIN component co ON mu.mukey = co.mukey
        LEFT JOIN chorizon ch ON co.cokey = ch.cokey
        LEFT JOIN chtexturegrp chtg ON ch.chkey = chtg.chkey
        LEFT JOIN chtexture cht ON chtg.chtgkey = cht.chtgkey
        LEFT JOIN corestrictions cr ON co.cokey = cr.cokey
        WHERE l.areasymbol IN (${this.getCountySoilSurveyAreas(fips).map(a => `'${a}'`).join(',')})
        AND co.majcompflag = 'Yes'
        ORDER BY co.comppct_r DESC
      `

      const results = await this.executeSoilQuery(query)
      return this.processSoilSurveyResults(results)
    } catch (error) {
      console.error('Error fetching detailed soil surveys:', error)
      return []
    }
  }

  /**
   * Process raw soil survey results into structured data
   */
  private processSoilSurveyResults(results: any[]): SoilSurvey[] {
    const surveyMap: { [key: string]: SoilSurvey } = {}

    results.forEach(row => {
      const key = row.mukey
      
      if (!surveyMap[key]) {
        surveyMap[key] = {
          survey_area: row.areasymbol,
          map_unit_key: row.mukey,
          map_unit_name: row.muname,
          acres: row.muacres || 0,
          percent_of_county: 0, // Will be calculated later
          components: []
        }
      }

      // Add component data
      if (row.compname) {
        surveyMap[key].components.push({
          component_name: row.compname,
          percent_of_area: row.component_percent || 0,
          soil_ph: row.soil_ph || 7.0,
          organic_matter: row.organic_matter || 2.5,
          drainage_class: this.standardizeDrainageClass(row.drainage_class),
          texture: row.texture_description || 'loam',
          depth: row.depth_to_bedrock || 150,
          limitations: this.assessSoilLimitations(row)
        })
      }
    })

    return Object.values(surveyMap)
  }

  /**
   * Analyze soil surveys to create county summary
   */
  private analyzeSoilSurveys(fips: string, surveys: SoilSurvey[]): SoilData {
    let totalAcres = surveys.reduce((sum, s) => sum + s.acres, 0)
    
    // Calculate weighted averages
    let weightedPh = 0
    let weightedOrganic = 0
    // let weightedAwc = 0  // Removed unused variable
    let phValues: number[] = []
    let drainageClasses: string[] = []
    let textureClasses: string[] = []
    let allLimitations: string[] = []
    
    surveys.forEach(survey => {
      const weight = survey.acres / totalAcres
      survey.percent_of_county = (survey.acres / totalAcres) * 100
      
      survey.components.forEach(comp => {
        const compWeight = weight * (comp.percent_of_area / 100)
        
        weightedPh += comp.soil_ph * compWeight
        weightedOrganic += comp.organic_matter * compWeight
        phValues.push(comp.soil_ph)
        drainageClasses.push(comp.drainage_class)
        textureClasses.push(comp.texture)
        allLimitations.push(...comp.limitations)
      })
    })

    // Determine dominant characteristics
    const dominant_soil_type = this.findMostCommon(textureClasses)
    const drainage_class = this.findMostCommon(drainageClasses) as any
    const soil_ph_avg = weightedPh
    const soil_ph_range = {
      min: Math.min(...phValues),
      max: Math.max(...phValues)
    }
    const organic_matter_percent = weightedOrganic

    // Calculate derived metrics
    const available_water_capacity = this.calculateAwcFromTexture(dominant_soil_type)
    const depth_to_bedrock = this.estimateDepthToBedrock(surveys)
    const permeability_rate = this.estimatePermeability(dominant_soil_type, drainage_class)
    const erosion_factor = this.calculateErosionFactor(dominant_soil_type, weightedOrganic)
    
    // Assess fertility and limitations
    const fertility_rating = this.assessFertility(soil_ph_avg, organic_matter_percent, drainage_class)
    const limitations = [...new Set(allLimitations)].slice(0, 5) // Top 5 unique limitations
    const suitable_crops = this.determineSuitableCrops(soil_ph_avg, drainage_class, dominant_soil_type)
    const soil_suitability_score = this.calculateSoilSuitabilityScore({
      ph: soil_ph_avg,
      organic_matter: organic_matter_percent,
      drainage: drainage_class,
      fertility: fertility_rating,
      limitations: limitations.length
    })

    return {
      county_fips: fips,
      dominant_soil_type,
      soil_ph_avg,
      soil_ph_range,
      organic_matter_percent,
      drainage_class,
      texture_class: dominant_soil_type,
      depth_to_bedrock,
      available_water_capacity,
      permeability_rate,
      erosion_factor,
      fertility_rating,
      limitations,
      suitable_crops,
      soil_suitability_score
    }
  }

  /**
   * Helper functions for soil analysis
   */
  private standardizeDrainageClass(drainageClass: string): string {
    if (!drainageClass) return 'moderately_well_drained'
    
    const normalized = drainageClass.toLowerCase()
    if (normalized.includes('well') && !normalized.includes('moderately')) return 'well_drained'
    if (normalized.includes('moderately well')) return 'moderately_well_drained'
    if (normalized.includes('somewhat poorly')) return 'somewhat_poorly_drained'
    if (normalized.includes('poorly')) return 'poorly_drained'
    
    return 'moderately_well_drained'
  }

  private assessSoilLimitations(soilData: any): string[] {
    const limitations: string[] = []
    
    if (soilData.soil_ph < 5.5) limitations.push('High acidity')
    if (soilData.soil_ph > 8.5) limitations.push('High alkalinity')
    if (soilData.organic_matter < 1.0) limitations.push('Low organic matter')
    if (soilData.depth_to_bedrock < 50) limitations.push('Shallow to bedrock')
    if (soilData.drainage_class?.includes('poorly')) limitations.push('Poor drainage')
    
    return limitations
  }

  private findMostCommon(items: string[]): string {
    const counts: { [key: string]: number } = {}
    items.forEach(item => {
      counts[item] = (counts[item] || 0) + 1
    })
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, items[0] || 'loam')
  }

  private calculateAwcFromTexture(texture: string): number {
    // Available water capacity by texture class (inches/inch)
    const awcMap: { [key: string]: number } = {
      'sand': 0.05,
      'loamy sand': 0.08,
      'sandy loam': 0.12,
      'loam': 0.18,
      'silt loam': 0.20,
      'silt': 0.18,
      'sandy clay loam': 0.15,
      'clay loam': 0.18,
      'silty clay loam': 0.20,
      'sandy clay': 0.12,
      'silty clay': 0.15,
      'clay': 0.10
    }
    
    const normalized = texture.toLowerCase()
    for (const [key, value] of Object.entries(awcMap)) {
      if (normalized.includes(key)) return value
    }
    
    return 0.15 // Default moderate AWC
  }

  private estimateDepthToBedrock(surveys: SoilSurvey[]): number {
    const depths = surveys.flatMap(s => 
      s.components.map(c => c.depth).filter(d => d > 0)
    )
    
    if (depths.length === 0) return 150 // Default 150cm
    
    return depths.reduce((sum, d) => sum + d, 0) / depths.length
  }

  private estimatePermeability(texture: string, drainage: string): string {
    if (texture.includes('sand')) return 'rapid'
    if (texture.includes('clay')) return 'slow'
    if (drainage.includes('well')) return 'moderate'
    if (drainage.includes('poorly')) return 'very slow'
    return 'moderate'
  }

  private calculateErosionFactor(texture: string, organicMatter: number): number {
    let factor = 0.3 // Base factor
    
    if (texture.includes('sand')) factor += 0.2
    if (texture.includes('clay')) factor -= 0.1
    if (organicMatter > 3) factor -= 0.1
    if (organicMatter < 2) factor += 0.1
    
    return Math.max(0.1, Math.min(0.8, factor))
  }

  private assessFertility(ph: number, organicMatter: number, drainage: string): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0
    
    // pH scoring
    if (ph >= 6.0 && ph <= 7.5) score += 3
    else if (ph >= 5.5 && ph <= 8.0) score += 2
    else if (ph >= 5.0 && ph <= 8.5) score += 1
    
    // Organic matter scoring
    if (organicMatter >= 4) score += 3
    else if (organicMatter >= 2.5) score += 2
    else if (organicMatter >= 1.5) score += 1
    
    // Drainage scoring
    if (drainage === 'well_drained' || drainage === 'moderately_well_drained') score += 2
    else if (drainage === 'somewhat_poorly_drained') score += 1
    
    if (score >= 7) return 'excellent'
    if (score >= 5) return 'good'
    if (score >= 3) return 'fair'
    return 'poor'
  }

  private determineSuitableCrops(ph: number, drainage: string, texture: string): string[] {
    const crops: string[] = []
    
    // Universal crops for most soils
    crops.push('Corn', 'Soybeans')
    
    // pH specific crops
    if (ph >= 6.0 && ph <= 7.5) {
      crops.push('Wheat', 'Alfalfa', 'Vegetables')
    }
    
    if (ph < 6.5) {
      crops.push('Blueberries', 'Potatoes')
    }
    
    // Drainage specific crops
    if (drainage.includes('well')) {
      crops.push('Cotton', 'Tobacco', 'Tree fruits')
    }
    
    if (drainage.includes('poorly')) {
      crops.push('Rice', 'Cranberries')
    }
    
    // Texture specific crops
    if (texture.includes('sand')) {
      crops.push('Peanuts', 'Sweet potatoes')
    }
    
    if (texture.includes('clay')) {
      crops.push('Cotton', 'Sugarcane')
    }
    
    return [...new Set(crops)].slice(0, 8) // Return unique crops, max 8
  }

  private calculateSoilSuitabilityScore(factors: {
    ph: number
    organic_matter: number
    drainage: string
    fertility: string
    limitations: number
  }): number {
    let score = 100
    
    // pH penalty
    if (factors.ph < 5.5 || factors.ph > 8.0) score -= 20
    else if (factors.ph < 6.0 || factors.ph > 7.5) score -= 10
    
    // Organic matter bonus/penalty
    if (factors.organic_matter >= 4) score += 10
    else if (factors.organic_matter < 2) score -= 15
    
    // Drainage penalty
    if (factors.drainage === 'poorly_drained') score -= 25
    else if (factors.drainage === 'somewhat_poorly_drained') score -= 10
    
    // Fertility bonus
    switch (factors.fertility) {
      case 'excellent': score += 15; break
      case 'good': score += 5; break
      case 'poor': score -= 20; break
    }
    
    // Limitations penalty
    score -= factors.limitations * 5
    
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Caching methods
   */
  private async cacheSoilData(fips: string, data: SoilData): Promise<void> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return

      await supabase
        .from('soil_data_cache')
        .upsert({
          county_id: county.id,
          data_type: 'soil_analysis',
          raw_data: data,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
    } catch (error) {
      console.error('Error caching soil data:', error)
    }
  }

  private async getCachedSoilData(fips: string): Promise<SoilData | null> {
    try {
      const { data: county } = await supabase
        .from('counties')
        .select('id')
        .eq('fips', fips)
        .single()

      if (!county) return null

      const { data } = await supabase
        .from('soil_data_cache')
        .select('raw_data')
        .eq('county_id', county.id)
        .eq('data_type', 'soil_analysis')
        .gt('expires_at', new Date().toISOString())
        .single()

      return data?.raw_data || null
    } catch (error) {
      return null
    }
  }

  /**
   * Helper method to get county soil survey areas (simplified)
   */
  private getCountySoilSurveyAreas(fips: string): string[] {
    // In a real implementation, this would query the soil database
    // For now, return mock survey area codes
    const stateCode = fips.substring(0, 2)
    const countyCode = fips.substring(2)
    
    return [`${stateCode}${countyCode}`] // Simplified
  }

  private fipsToCountyName(fips: string): string {
    // Simplified mapping - in real implementation would use proper lookup
    const countyMap: { [key: string]: string } = {
      '48001': 'Anderson',
      '06037': 'Los Angeles',
      '19153': 'Polk',
      '36061': 'New York'
    }
    
    return countyMap[fips] || 'Unknown'
  }
}

export const soilService = new SoilService()
export default soilService
