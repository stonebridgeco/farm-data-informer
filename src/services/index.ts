// Main API exports
export { farmDataAPI as default } from './farmDataAPI'
export { farmDataAPI } from './farmDataAPI'

// Individual service exports
export { countyAPI } from './countyAPI'
export { usdaService } from './usdaService'
export { noaaService } from './noaaService'
export { usgsService } from './usgsService'
export { soilService } from './soilService'
export { epaService } from './epaService'
export { agriculturalDataService } from './agriculturalDataService'
export { cacheService, cachedAPI, CacheKeys } from './cacheService'

// Database exports
export { supabase } from './database'
export type {
  County,
  SoilData,
  ClimateData,
  FarmSuitability,
  USDADataCache,
  MarketAccess
} from './database'
