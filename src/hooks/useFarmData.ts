import { useState, useEffect, useCallback } from 'react'
import { farmDataAPI, County, FarmSuitability, agriculturalDataService } from '../services'

/**
 * Hook for managing county data
 */
export function useCounty(fips?: string) {
  const [county, setCounty] = useState<County | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCounty = useCallback(async (countyFips: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await farmDataAPI.getCountyByFips(countyFips)
      setCounty(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch county')
      setCounty(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (fips) {
      fetchCounty(fips)
    }
  }, [fips, fetchCounty])

  return {
    county,
    loading,
    error,
    refetch: fips ? () => fetchCounty(fips) : undefined
  }
}

/**
 * Hook for comprehensive agricultural data using the new service
 */
export function useAgriculturalData(fips?: string) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [refreshStatus, setRefreshStatus] = useState<any>(null)

  const fetchData = useCallback(async (countyFips: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await agriculturalDataService.getComprehensiveCountyData(countyFips)
      setData(result.data)
      setStatus(result.status)
      
      if (result.errors.length > 0) {
        setError(result.errors.join('; '))
      }
      
      // Get refresh status
      const refreshInfo = await agriculturalDataService.getDataRefreshStatus(countyFips)
      setRefreshStatus(refreshInfo)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agricultural data')
      setData(null)
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (fips) {
      setLoading(true)
      try {
        await agriculturalDataService.refreshCountyData(fips)
        await fetchData(fips)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to refresh data')
      } finally {
        setLoading(false)
      }
    }
  }, [fips, fetchData])

  useEffect(() => {
    if (fips) {
      fetchData(fips)
    }
  }, [fips, fetchData])

  return {
    data,
    loading,
    error,
    status,
    refreshStatus,
    refresh,
    refetch: fips ? () => fetchData(fips) : undefined
  }
}

/**
 * Hook for comprehensive county data
 */
export function useComprehensiveCountyData(fips?: string) {
  const [data, setData] = useState<{
    county: County | null
    soil: any[]
    climate: any[]
    suitability: FarmSuitability[]
    usda: { crops: any[]; livestock: any[]; economics: any[] }
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (countyFips: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await farmDataAPI.getComprehensiveCountyData(countyFips)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch county data')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (fips) {
      await farmDataAPI.refreshCountyData(fips)
      await fetchData(fips)
    }
  }, [fips, fetchData])

  useEffect(() => {
    if (fips) {
      fetchData(fips)
    }
  }, [fips, fetchData])

  return {
    data,
    loading,
    error,
    refresh,
    refetch: fips ? () => fetchData(fips) : undefined
  }
}

/**
 * Hook for county search
 */
export function useCountySearch() {
  const [results, setResults] = useState<County[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const data = await farmDataAPI.searchCounties(searchTerm)
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return {
    results,
    loading,
    error,
    search,
    clear
  }
}

/**
 * Hook for farm suitability calculation
 */
export function useFarmSuitability(countyId?: string) {
  const [suitability, setSuitability] = useState<FarmSuitability[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calculating, setCalculating] = useState(false)

  const fetchSuitability = useCallback(async (
    id: string, 
    farmType?: 'goat' | 'apple' | 'general'
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await farmDataAPI.getFarmSuitability(id, farmType)
      setSuitability(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suitability')
      setSuitability([])
    } finally {
      setLoading(false)
    }
  }, [])

  const calculate = useCallback(async (
    id: string, 
    farmType: 'goat' | 'apple' | 'general'
  ) => {
    setCalculating(true)
    setError(null)
    
    try {
      const result = await farmDataAPI.calculateFarmSuitability(id, farmType)
      if (result) {
        // Refresh the suitability data
        await fetchSuitability(id)
      }
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Calculation failed')
      return null
    } finally {
      setCalculating(false)
    }
  }, [fetchSuitability])

  useEffect(() => {
    if (countyId) {
      fetchSuitability(countyId)
    }
  }, [countyId, fetchSuitability])

  return {
    suitability,
    loading,
    calculating,
    error,
    calculate,
    refetch: countyId ? (farmType?: 'goat' | 'apple' | 'general') => 
      fetchSuitability(countyId, farmType) : undefined
  }
}

/**
 * Hook for managing multiple counties (for map display)
 */
export function useCountiesForMap() {
  const [counties, setCounties] = useState<Array<County & { 
    suitabilityPreview?: { 
      goat: number | null
      apple: number | null 
      general: number | null
    }
  }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCounties = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await farmDataAPI.getCountiesForMap()
      setCounties(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch counties')
      setCounties([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCounties()
  }, [fetchCounties])

  return {
    counties,
    loading,
    error,
    refetch: fetchCounties
  }
}

/**
 * Hook for USDA data
 */
export function useUSDAData(fips?: string, dataType?: 'crops' | 'livestock' | 'economics', year?: number) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (
    countyFips: string, 
    type: 'crops' | 'livestock' | 'economics', 
    dataYear?: number
  ) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await farmDataAPI.getUSDAData(countyFips, type, dataYear)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch USDA data')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (fips && dataType) {
      fetchData(fips, dataType, year)
    }
  }, [fips, dataType, year, fetchData])

  return {
    data,
    loading,
    error,
    refetch: (fips && dataType) ? () => fetchData(fips, dataType, year) : undefined
  }
}

/**
 * Hook for cache management
 */
export function useCacheStats() {
  const [stats, setStats] = useState(farmDataAPI.getCacheStats())

  const refresh = useCallback(() => {
    setStats(farmDataAPI.getCacheStats())
  }, [])

  const clearCache = useCallback(() => {
    farmDataAPI.clearCache()
    refresh()
  }, [refresh])

  return {
    stats,
    refresh,
    clearCache
  }
}
