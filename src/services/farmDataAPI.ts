import { countyAPI } from './countyAPI'
import { usdaService } from './usdaService'
import { cachedAPI, CacheKeys } from './cacheService'
import { County, FarmSuitability } from './database'

/**
 * Main API service that combines all data sources with caching
 */
class FarmDataAPIService {
  private cache = cachedAPI

  /**
   * Get all counties with caching
   */
  async getAllCounties(): Promise<County[]> {
    return this.cache.cached(
      CacheKeys.counties(),
      () => countyAPI.getAllCounties(),
      15 * 60 * 1000 // 15 minutes cache
    )
  }

  /**
   * Get counties by state with caching
   */
  async getCountiesByState(state: string): Promise<County[]> {
    return this.cache.cached(
      CacheKeys.counties(state),
      () => countyAPI.getCountiesByState(state),
      15 * 60 * 1000 // 15 minutes cache
    )
  }

  /**
   * Get county by FIPS with caching
   */
  async getCountyByFips(fips: string): Promise<County | null> {
    return this.cache.cached(
      CacheKeys.county(fips),
      () => countyAPI.getCountyByFips(fips),
      30 * 60 * 1000 // 30 minutes cache
    )
  }

  /**
   * Get comprehensive county data with aggressive caching
   */
  async getComprehensiveCountyData(fips: string) {
    return this.cache.cached(
      CacheKeys.comprehensive(fips),
      () => countyAPI.getComprehensiveCountyData(fips),
      10 * 60 * 1000 // 10 minutes cache
    )
  }

  /**
   * Search counties with caching
   */
  async searchCounties(searchTerm: string): Promise<County[]> {
    if (!searchTerm.trim()) return []
    
    return this.cache.cached(
      CacheKeys.search(searchTerm),
      () => countyAPI.searchCounties(searchTerm),
      5 * 60 * 1000 // 5 minutes cache
    )
  }

  /**
   * Get farm suitability with caching
   */
  async getFarmSuitability(
    countyId: string, 
    farmType?: 'goat' | 'apple' | 'general'
  ): Promise<FarmSuitability[]> {
    return this.cache.cached(
      CacheKeys.suitability(countyId, farmType),
      () => countyAPI.getFarmSuitability(countyId, farmType),
      60 * 60 * 1000 // 1 hour cache
    )
  }

  /**
   * Calculate farm suitability (bypasses cache for fresh calculation)
   */
  async calculateFarmSuitability(
    countyId: string, 
    farmType: 'goat' | 'apple' | 'general'
  ): Promise<FarmSuitability | null> {
    // Calculate fresh suitability
    const result = await countyAPI.calculateFarmSuitability(countyId, farmType)
    
    // Invalidate related cache entries
    this.cache.invalidatePattern(`suitability_${countyId}`)
    
    return result
  }

  /**
   * Get USDA data with caching
   */
  async getUSDAData(fips: string, dataType: 'crops' | 'livestock' | 'economics', year?: number) {
    return this.cache.cached(
      CacheKeys.usda(fips, dataType, year),
      async () => {
        switch (dataType) {
          case 'crops':
            return usdaService.getCropData(this.fipsToState(fips), fips.substring(2), year)
          case 'livestock':
            return usdaService.getLivestockData(this.fipsToState(fips), fips.substring(2), year)
          case 'economics':
            return usdaService.getEconomicsData(this.fipsToState(fips), fips.substring(2), year)
          default:
            return []
        }
      },
      2 * 60 * 60 * 1000 // 2 hours cache
    )
  }

  /**
   * Get county data optimized for map display
   */
  async getCountiesForMap(): Promise<Array<County & { 
    suitabilityPreview?: { 
      goat: number | null
      apple: number | null 
      general: number | null
    }
  }>> {
    return this.cache.cached(
      'counties_map_data',
      async () => {
        const counties = await this.getAllCounties()
        
        // Get suitability scores for each county
        const countiesWithSuitability = await Promise.all(
          counties.map(async (county) => {
            try {
              const [goatSuit, appleSuit, generalSuit] = await Promise.all([
                this.getFarmSuitability(county.id, 'goat'),
                this.getFarmSuitability(county.id, 'apple'),
                this.getFarmSuitability(county.id, 'general')
              ])
              
              return {
                ...county,
                suitabilityPreview: {
                  goat: goatSuit[0]?.overall_score || null,
                  apple: appleSuit[0]?.overall_score || null,
                  general: generalSuit[0]?.overall_score || null
                }
              }
            } catch (error) {
              console.warn(`Error getting suitability for county ${county.fips}:`, error)
              return {
                ...county,
                suitabilityPreview: {
                  goat: null,
                  apple: null,
                  general: null
                }
              }
            }
          })
        )
        
        return countiesWithSuitability
      },
      20 * 60 * 1000 // 20 minutes cache
    )
  }

  /**
   * Refresh all data for a county (clear cache and refetch)
   */
  async refreshCountyData(fips: string): Promise<void> {
    // Clear all related cache entries
    this.cache.invalidatePattern(fips)
    
    // Trigger fresh fetch of comprehensive data
    await this.getComprehensiveCountyData(fips)
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats()
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clearAll()
  }

  /**
   * Helper: Convert FIPS to state abbreviation
   */
  private fipsToState(fips: string): string {
    const stateMap: { [key: string]: string } = {
      '48': 'TX', // Texas
      '06': 'CA', // California  
      '19': 'IA', // Iowa
      '36': 'NY'  // New York
    }
    return stateMap[fips.substring(0, 2)] || ''
  }

  /**
   * Batch operation: Calculate suitability for multiple counties
   */
  async batchCalculateSuitability(
    fips: string[], 
    farmType: 'goat' | 'apple' | 'general'
  ): Promise<Array<{ fips: string; result: FarmSuitability | null; error?: string }>> {
    const results = await Promise.allSettled(
      fips.map(async (countyFips) => {
        const county = await this.getCountyByFips(countyFips)
        if (!county) {
          throw new Error(`County not found: ${countyFips}`)
        }
        
        const result = await this.calculateFarmSuitability(county.id, farmType)
        return { fips: countyFips, result }
      })
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          fips: fips[index],
          result: null,
          error: result.reason.message
        }
      }
    })
  }
}

// Create singleton instance
export const farmDataAPI = new FarmDataAPIService()
export default farmDataAPI
