/**
 * Client-side caching service for improved performance
 * Implements memory cache with TTL and localStorage backup
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly STORAGE_PREFIX = 'farm_data_cache_'

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data
    }

    // Try localStorage cache
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + key)
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored)
        if (this.isValid(entry)) {
          // Restore to memory cache
          this.memoryCache.set(key, entry)
          return entry.data
        } else {
          // Remove expired entry
          localStorage.removeItem(this.STORAGE_PREFIX + key)
        }
      }
    } catch (error) {
      console.warn('Error reading from localStorage cache:', error)
    }

    return null
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    }

    // Store in memory cache
    this.memoryCache.set(key, entry)

    // Store in localStorage (for persistence across sessions)
    try {
      localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(entry))
    } catch (error) {
      console.warn('Error writing to localStorage cache:', error)
    }
  }

  /**
   * Remove data from cache
   */
  delete(key: string): void {
    this.memoryCache.delete(key)
    try {
      localStorage.removeItem(this.STORAGE_PREFIX + key)
    } catch (error) {
      console.warn('Error removing from localStorage cache:', error)
    }
  }

  /**
   * Clear all cache data
   */
  clear(): void {
    this.memoryCache.clear()
    
    try {
      // Clear localStorage entries with our prefix
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Error clearing localStorage cache:', error)
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry)) {
        this.memoryCache.delete(key)
      }
    }

    // Clean localStorage cache
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const entry = JSON.parse(stored)
              if (!this.isValid(entry)) {
                localStorage.removeItem(key)
              }
            }
          } catch {
            // Remove corrupted entries
            localStorage.removeItem(key)
          }
        }
      })
    } catch (error) {
      console.warn('Error during cache cleanup:', error)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryEntries: number
    localStorageEntries: number
    totalSize: number
  } {
    let localStorageEntries = 0
    let totalSize = 0

    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          localStorageEntries++
          const item = localStorage.getItem(key)
          totalSize += item ? item.length : 0
        }
      })
    } catch (error) {
      console.warn('Error calculating cache stats:', error)
    }

    return {
      memoryEntries: this.memoryCache.size,
      localStorageEntries,
      totalSize
    }
  }
}

/**
 * Cache wrapper for API calls with automatic caching
 */
export class CachedAPIService {
  private cache = new CacheService()

  constructor() {
    // Clean up expired entries on initialization
    this.cache.cleanup()

    // Set up periodic cleanup (every 10 minutes)
    setInterval(() => {
      this.cache.cleanup()
    }, 10 * 60 * 1000)
  }

  /**
   * Wrap an async function with caching
   */
  async cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.cache.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    try {
      const data = await fetcher()
      this.cache.set(key, data, ttl)
      return data
    } catch (error) {
      console.error(`Error fetching data for key ${key}:`, error)
      throw error
    }
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate cache keys matching a pattern
   */
  invalidatePattern(pattern: string): void {
    // TODO: Implement pattern-based invalidation
    console.log(`Pattern invalidation requested for: ${pattern}`)
    // For now, just clear all cache
    this.cache.clear()

    // For localStorage (scan keys)
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.cache['STORAGE_PREFIX']) && key.includes(pattern)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Error invalidating pattern from localStorage:', error)
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats()
  }
}

// Create singleton instance
export const cacheService = new CacheService()
export const cachedAPI = new CachedAPIService()

// Cache key generators for consistent naming
export const CacheKeys = {
  county: (fips: string) => `county_${fips}`,
  counties: (state?: string) => state ? `counties_${state}` : 'counties_all',
  soil: (countyId: string) => `soil_${countyId}`,
  climate: (countyId: string, year?: number) => `climate_${countyId}_${year || 'latest'}`,
  suitability: (countyId: string, farmType?: string) => `suitability_${countyId}_${farmType || 'all'}`,
  usda: (fips: string, dataType: string, year?: number) => `usda_${fips}_${dataType}_${year || 'latest'}`,
  comprehensive: (fips: string) => `comprehensive_${fips}`,
  search: (term: string) => `search_${term.toLowerCase().replace(/\s+/g, '_')}`
}

export default cacheService
