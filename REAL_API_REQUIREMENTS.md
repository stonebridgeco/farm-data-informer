# REAL API DATA REQUIREMENTS LIST

## CRITICAL: Components needing real API integration

### 1. COUNTY DATA SOURCE
**Current Issue:** Mock counties in SimpleMap
**Fix Needed:** 
- Connect to real county API or database
- Use FIPS codes from USDA/Census data
- Get county boundaries from GeoJSON API

### 2. MAIN APP ANALYSIS FUNCTION
**File:** `/src/App.tsx` - `handleAnalyze` function
**Current Issue:** Empty function, no real analysis
**Fix Needed:**
- Call real agricultural data service
- Use real USDA NASS API for crop yields
- Use real EPA water quality data
- Calculate real suitability scores

### 3. AGRICULTURAL DASHBOARD
**File:** `/src/components/Dashboard/AgriculturalDashboard.tsx`
**Current Issue:** Hardcoded dummy data
**Fix Needed:**
- Connect to USDA NASS API for real crop yields
- Connect to OpenWeather API for real weather
- Use real county FIPS codes

### 4. STATUS DASHBOARD
**File:** `/src/components/Dashboard/StatusDashboard.tsx`
**Current Issue:** Mock weather data fallback
**Fix Needed:**
- Remove mock weather fallback
- Use only real OpenWeather API
- Show errors if APIs fail

### 5. MAP COMPONENT
**File:** `/src/components/Map/SimpleMap.tsx`
**Current Issue:** Creates fake counties on click
**Fix Needed:**
- Load real county boundaries
- Use real FIPS codes
- Connect to county database/API

### 6. FARM DATA HOOK
**File:** `/src/hooks/useFarmData.ts`
**Current Issue:** May have mock data fallbacks
**Fix Needed:**
- Remove any mock data
- Use only real API calls
- Show loading/error states

## API ENDPOINTS TO IMPLEMENT

1. **County Data:** Real county boundaries with FIPS codes
2. **USDA NASS:** Crop yields by county FIPS
3. **EPA ATTAINS:** Water quality by county
4. **OpenWeather:** Current conditions by lat/lon
5. **Open Elevation:** Terrain data by coordinates
6. **NOAA:** Climate stations by location

## FILES TO DELETE/CLEAN
- ✅ `/src/services/mockData.ts` - DELETED
- ✅ Mock references in `/src/services/index.ts` - REMOVED
- ✅ Mock data in `/src/App.tsx` - REMOVED

## NEXT PRIORITY: 
1. Get real county data for map clicks
2. Make Agricultural Dashboard show real API data
3. Remove all remaining mock fallbacks

## ERRORS EXPECTED:
- Map clicks will fail (no real counties)
- Agricultural Dashboard will show loading states
- Some components may break until real APIs connected

This is PREFERRED over showing fake data.
