import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types based on our schema
export interface County {
  id: string
  fips: string
  name: string
  state: string
  state_name: string
  coordinates: { x: number; y: number } | null
  population: number | null
  area_sq_miles: number | null
  created_at: string
  updated_at: string
}

export interface SoilData {
  id: string
  county_id: string
  soil_type: string | null
  drainage_class: string | null
  ph_level: number | null
  organic_matter: number | null
  permeability: string | null
  slope_range: string | null
  erosion_factor: number | null
  created_at: string
}

export interface ClimateData {
  id: string
  county_id: string
  year: number
  avg_temp_f: number | null
  min_temp_f: number | null
  max_temp_f: number | null
  annual_precipitation: number | null
  growing_season_days: number | null
  frost_free_days: number | null
  hardiness_zone: string | null
  created_at: string
}

export interface FarmSuitability {
  id: string
  county_id: string
  farm_type: 'goat' | 'apple' | 'general'
  overall_score: number
  soil_score: number
  climate_score: number
  water_score: number
  terrain_score: number
  market_score: number
  calculated_at: string
  created_at: string
}

export interface USDADataCache {
  id: string
  county_id: string
  data_type: string
  data_year: number
  raw_data: any
  cached_at: string
  expires_at: string
}

export interface MarketAccess {
  id: string
  county_id: string
  nearest_city: string | null
  distance_to_city: number | null
  population_within_50mi: number | null
  major_highways: string[] | null
  transportation_score: number | null
  created_at: string
}
