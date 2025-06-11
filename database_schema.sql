-- Farm Data Informer Database Schema
-- Supabase PostgreSQL Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Counties table - stores basic county information
CREATE TABLE counties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fips VARCHAR(5) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    state_name VARCHAR(50) NOT NULL,
    coordinates POINT,
    geometry GEOMETRY(POLYGON, 4326),
    population INTEGER,
    area_sq_miles DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Soil data table - USDA soil survey information
CREATE TABLE soil_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
    soil_type VARCHAR(100),
    drainage_class VARCHAR(50),
    ph_level DECIMAL(3,1),
    organic_matter DECIMAL(4,2),
    permeability VARCHAR(50),
    slope_range VARCHAR(20),
    erosion_factor DECIMAL(4,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Climate data table - weather and climate information
CREATE TABLE climate_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    avg_temp_f DECIMAL(4,1),
    min_temp_f DECIMAL(4,1),
    max_temp_f DECIMAL(4,1),
    annual_precipitation DECIMAL(5,2),
    growing_season_days INTEGER,
    frost_free_days INTEGER,
    hardiness_zone VARCHAR(5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farm suitability scores
CREATE TABLE farm_suitability (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
    farm_type VARCHAR(50) NOT NULL, -- 'goat', 'apple', 'general'
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 1),
    soil_score DECIMAL(3,2) CHECK (soil_score >= 0 AND soil_score <= 1),
    climate_score DECIMAL(3,2) CHECK (climate_score >= 0 AND climate_score <= 1),
    water_score DECIMAL(3,2) CHECK (water_score >= 0 AND water_score <= 1),
    terrain_score DECIMAL(3,2) CHECK (terrain_score >= 0 AND terrain_score <= 1),
    market_score DECIMAL(3,2) CHECK (market_score >= 0 AND market_score <= 1),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USDA NASS data cache
CREATE TABLE usda_data_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL, -- 'crops', 'livestock', 'economics'
    data_year INTEGER NOT NULL,
    raw_data JSONB NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- Market access data
CREATE TABLE market_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
    nearest_city VARCHAR(100),
    distance_to_city DECIMAL(6,2), -- miles
    population_within_50mi INTEGER,
    major_highways TEXT[], -- array of highway names
    transportation_score DECIMAL(3,2) CHECK (transportation_score >= 0 AND transportation_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_counties_fips ON counties(fips);
CREATE INDEX idx_counties_state ON counties(state);
CREATE INDEX idx_soil_data_county ON soil_data(county_id);
CREATE INDEX idx_climate_data_county ON climate_data(county_id);
CREATE INDEX idx_climate_data_year ON climate_data(year);
CREATE INDEX idx_farm_suitability_county ON farm_suitability(county_id);
CREATE INDEX idx_farm_suitability_type ON farm_suitability(farm_type);
CREATE INDEX idx_usda_cache_county ON usda_data_cache(county_id);
CREATE INDEX idx_usda_cache_type ON usda_data_cache(data_type);
CREATE INDEX idx_usda_cache_expires ON usda_data_cache(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_counties_updated_at BEFORE UPDATE ON counties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_suitability ENABLE ROW LEVEL SECURITY;
ALTER TABLE usda_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_access ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users (data is public)
CREATE POLICY "Public read access" ON counties FOR SELECT USING (true);
CREATE POLICY "Public read access" ON soil_data FOR SELECT USING (true);
CREATE POLICY "Public read access" ON climate_data FOR SELECT USING (true);
CREATE POLICY "Public read access" ON farm_suitability FOR SELECT USING (true);
CREATE POLICY "Public read access" ON usda_data_cache FOR SELECT USING (true);
CREATE POLICY "Public read access" ON market_access FOR SELECT USING (true);

-- Insert sample data for our mock counties
INSERT INTO counties (fips, name, state, state_name, coordinates, population, area_sq_miles) VALUES
('48201', 'Harris County', 'TX', 'Texas', POINT(-95.3698, 29.7604), 4713325, 1777.10),
('06019', 'Fresno County', 'CA', 'California', POINT(-119.7871, 36.7378), 1008654, 5958.28),
('19169', 'Story County', 'IA', 'Iowa', POINT(-93.6319, 42.0308), 98537, 572.99),
('36117', 'Wayne County', 'NY', 'New York', POINT(-77.0867, 43.2642), 91283, 603.35);

-- Insert sample soil data
INSERT INTO soil_data (county_id, soil_type, drainage_class, ph_level, organic_matter, permeability, slope_range, erosion_factor)
SELECT 
    c.id,
    CASE c.fips
        WHEN '48201' THEN 'Clay loam'
        WHEN '06019' THEN 'Sandy loam'
        WHEN '19169' THEN 'Silty clay loam'
        WHEN '36117' THEN 'Loam'
    END,
    CASE c.fips
        WHEN '48201' THEN 'Moderately well drained'
        WHEN '06019' THEN 'Well drained'
        WHEN '19169' THEN 'Poorly drained'
        WHEN '36117' THEN 'Well drained'
    END,
    CASE c.fips
        WHEN '48201' THEN 7.2
        WHEN '06019' THEN 6.8
        WHEN '19169' THEN 6.5
        WHEN '36117' THEN 6.9
    END,
    CASE c.fips
        WHEN '48201' THEN 2.1
        WHEN '06019' THEN 1.8
        WHEN '19169' THEN 4.2
        WHEN '36117' THEN 3.1
    END,
    CASE c.fips
        WHEN '48201' THEN 'Moderate'
        WHEN '06019' THEN 'High'
        WHEN '19169' THEN 'Low'
        WHEN '36117' THEN 'Moderate'
    END,
    CASE c.fips
        WHEN '48201' THEN '0-3%'
        WHEN '06019' THEN '2-8%'
        WHEN '19169' THEN '0-2%'
        WHEN '36117' THEN '3-8%'
    END,
    CASE c.fips
        WHEN '48201' THEN 0.32
        WHEN '06019' THEN 0.28
        WHEN '19169' THEN 0.15
        WHEN '36117' THEN 0.24
    END
FROM counties c;
