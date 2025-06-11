-- ================================================================
-- FARM DATA INFORMER - COMPLETE DATABASE SCHEMA
-- Issue #5: Data Pipeline Setup
-- ================================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- This will create all tables, indexes, and sample data needed

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ================================================================
-- CORE TABLES
-- ================================================================

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

-- Water resources data
CREATE TABLE water_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
    groundwater_depth DECIMAL(6,2),
    water_quality_index DECIMAL(3,2),
    irrigation_infrastructure BOOLEAN DEFAULT false,
    drought_frequency DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Terrain and land use data
CREATE TABLE terrain_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
    avg_elevation DECIMAL(8,2),
    slope_variability DECIMAL(4,2),
    agricultural_land_percent DECIMAL(5,2),
    forest_cover_percent DECIMAL(5,2),
    urban_development_percent DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market access and economics data
CREATE TABLE market_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
    nearest_city VARCHAR(100),
    distance_to_city_miles DECIMAL(6,2),
    population_within_50mi INTEGER,
    major_highways TEXT[],
    transportation_score DECIMAL(3,2),
    avg_land_price_per_acre DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Farm suitability analysis results
CREATE TABLE farm_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
    farm_type VARCHAR(50) NOT NULL,
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 1),
    soil_score DECIMAL(3,2) CHECK (soil_score >= 0 AND soil_score <= 1),
    climate_score DECIMAL(3,2) CHECK (climate_score >= 0 AND climate_score <= 1),
    water_score DECIMAL(3,2) CHECK (water_score >= 0 AND water_score <= 1),
    terrain_score DECIMAL(3,2) CHECK (terrain_score >= 0 AND terrain_score <= 1),
    market_score DECIMAL(3,2) CHECK (market_score >= 0 AND market_score <= 1),
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- CACHE AND EXTERNAL DATA TABLES
-- ================================================================

-- USDA API data cache
CREATE TABLE usda_data_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL,
    data_year INTEGER NOT NULL,
    raw_data JSONB NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours'
);

-- External API response cache
CREATE TABLE api_cache (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    response_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour'
);

-- ================================================================
-- PERFORMANCE INDEXES
-- ================================================================

-- Primary lookup indexes
CREATE INDEX idx_counties_fips ON counties(fips);
CREATE INDEX idx_counties_state ON counties(state);
CREATE INDEX idx_counties_name ON counties(name);

-- Foreign key indexes
CREATE INDEX idx_soil_data_county ON soil_data(county_id);
CREATE INDEX idx_climate_data_county ON climate_data(county_id);
CREATE INDEX idx_water_data_county ON water_data(county_id);
CREATE INDEX idx_terrain_data_county ON terrain_data(county_id);
CREATE INDEX idx_market_data_county ON market_data(county_id);
CREATE INDEX idx_farm_analysis_county ON farm_analysis(county_id);

-- Query optimization indexes
CREATE INDEX idx_climate_data_year ON climate_data(year);
CREATE INDEX idx_farm_analysis_type ON farm_analysis(farm_type);
CREATE INDEX idx_usda_cache_type ON usda_data_cache(data_type);
CREATE INDEX idx_usda_cache_expires ON usda_data_cache(expires_at);
CREATE INDEX idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);

-- ================================================================
-- TRIGGERS AND FUNCTIONS
-- ================================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_counties_updated_at 
    BEFORE UPDATE ON counties 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Automatic cache cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM usda_data_cache WHERE expires_at < NOW();
    DELETE FROM api_cache WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE soil_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE terrain_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE usda_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- Public read access policies (data is publicly available)
CREATE POLICY "Public read access" ON counties FOR SELECT USING (true);
CREATE POLICY "Public read access" ON soil_data FOR SELECT USING (true);
CREATE POLICY "Public read access" ON climate_data FOR SELECT USING (true);
CREATE POLICY "Public read access" ON water_data FOR SELECT USING (true);
CREATE POLICY "Public read access" ON terrain_data FOR SELECT USING (true);
CREATE POLICY "Public read access" ON market_data FOR SELECT USING (true);
CREATE POLICY "Public read access" ON farm_analysis FOR SELECT USING (true);
CREATE POLICY "Public read access" ON usda_data_cache FOR SELECT USING (true);
CREATE POLICY "Public read access" ON api_cache FOR SELECT USING (true);

-- Allow inserts and updates for caching (service role only)
CREATE POLICY "Service role full access" ON usda_data_cache 
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON api_cache 
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON farm_analysis 
    FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- SAMPLE DATA FOR TESTING
-- ================================================================

-- Insert sample counties (diverse geographic representation)
INSERT INTO counties (fips, name, state, state_name, coordinates, population, area_sq_miles) VALUES
('48201', 'Harris County', 'TX', 'Texas', POINT(-95.3698, 29.7604), 4713325, 1777.10),
('06019', 'Fresno County', 'CA', 'California', POINT(-119.7871, 36.7378), 1008654, 5958.28),
('19169', 'Story County', 'IA', 'Iowa', POINT(-93.6319, 42.0308), 98537, 572.99),
('36117', 'Wayne County', 'NY', 'New York', POINT(-77.0867, 43.2642), 91283, 603.35),
('08069', 'Larimer County', 'CO', 'Colorado', POINT(-105.0842, 40.5853), 359066, 2631.45);

-- Insert sample soil data
INSERT INTO soil_data (county_id, soil_type, drainage_class, ph_level, organic_matter, permeability, slope_range, erosion_factor)
SELECT 
    c.id,
    CASE c.fips
        WHEN '48201' THEN 'Clay loam'
        WHEN '06019' THEN 'Sandy loam'
        WHEN '19169' THEN 'Silty clay loam'
        WHEN '36117' THEN 'Loam'
        WHEN '08069' THEN 'Sandy clay loam'
    END,
    CASE c.fips
        WHEN '48201' THEN 'Moderately well drained'
        WHEN '06019' THEN 'Well drained'
        WHEN '19169' THEN 'Poorly drained'
        WHEN '36117' THEN 'Well drained'
        WHEN '08069' THEN 'Well drained'
    END,
    CASE c.fips
        WHEN '48201' THEN 7.2
        WHEN '06019' THEN 6.8
        WHEN '19169' THEN 6.5
        WHEN '36117' THEN 6.9
        WHEN '08069' THEN 7.1
    END,
    CASE c.fips
        WHEN '48201' THEN 2.1
        WHEN '06019' THEN 1.8
        WHEN '19169' THEN 4.2
        WHEN '36117' THEN 3.1
        WHEN '08069' THEN 2.8
    END,
    CASE c.fips
        WHEN '48201' THEN 'Moderate'
        WHEN '06019' THEN 'High'
        WHEN '19169' THEN 'Low'
        WHEN '36117' THEN 'Moderate'
        WHEN '08069' THEN 'Moderate'
    END,
    CASE c.fips
        WHEN '48201' THEN '0-3%'
        WHEN '06019' THEN '2-8%'
        WHEN '19169' THEN '0-2%'
        WHEN '36117' THEN '3-8%'
        WHEN '08069' THEN '5-15%'
    END,
    CASE c.fips
        WHEN '48201' THEN 0.32
        WHEN '06019' THEN 0.28
        WHEN '19169' THEN 0.15
        WHEN '36117' THEN 0.24
        WHEN '08069' THEN 0.41
    END
FROM counties c;

-- Insert sample climate data (current year)
INSERT INTO climate_data (county_id, year, avg_temp_f, min_temp_f, max_temp_f, annual_precipitation, growing_season_days, frost_free_days, hardiness_zone)
SELECT 
    c.id,
    2024,
    CASE c.fips
        WHEN '48201' THEN 69.8
        WHEN '06019' THEN 64.2
        WHEN '19169' THEN 49.1
        WHEN '36117' THEN 48.6
        WHEN '08069' THEN 50.3
    END,
    CASE c.fips
        WHEN '48201' THEN 51.2
        WHEN '06019' THEN 47.1
        WHEN '19169' THEN 35.8
        WHEN '36117' THEN 35.2
        WHEN '08069' THEN 32.9
    END,
    CASE c.fips
        WHEN '48201' THEN 88.4
        WHEN '06019' THEN 81.3
        WHEN '19169' THEN 62.4
        WHEN '36117' THEN 62.0
        WHEN '08069' THEN 67.7
    END,
    CASE c.fips
        WHEN '48201' THEN 49.77
        WHEN '06019' THEN 11.45
        WHEN '19169' THEN 35.01
        WHEN '36117' THEN 33.15
        WHEN '08069' THEN 15.95
    END,
    CASE c.fips
        WHEN '48201' THEN 280
        WHEN '06019' THEN 300
        WHEN '19169' THEN 170
        WHEN '36117' THEN 160
        WHEN '08069' THEN 140
    END,
    CASE c.fips
        WHEN '48201' THEN 310
        WHEN '06019' THEN 340
        WHEN '19169' THEN 180
        WHEN '36117' THEN 170
        WHEN '08069' THEN 150
    END,
    CASE c.fips
        WHEN '48201' THEN '9a'
        WHEN '06019' THEN '9b'
        WHEN '19169' THEN '5a'
        WHEN '36117' THEN '6a'
        WHEN '08069' THEN '5b'
    END
FROM counties c;

-- Insert sample water data
INSERT INTO water_data (county_id, groundwater_depth, water_quality_index, irrigation_infrastructure, drought_frequency)
SELECT 
    c.id,
    CASE c.fips
        WHEN '48201' THEN 45.5
        WHEN '06019' THEN 120.0
        WHEN '19169' THEN 12.3
        WHEN '36117' THEN 25.8
        WHEN '08069' THEN 80.2
    END,
    CASE c.fips
        WHEN '48201' THEN 0.75
        WHEN '06019' THEN 0.65
        WHEN '19169' THEN 0.88
        WHEN '36117' THEN 0.82
        WHEN '08069' THEN 0.79
    END,
    CASE c.fips
        WHEN '48201' THEN true
        WHEN '06019' THEN true
        WHEN '19169' THEN false
        WHEN '36117' THEN false
        WHEN '08069' THEN true
    END,
    CASE c.fips
        WHEN '48201' THEN 0.15
        WHEN '06019' THEN 0.45
        WHEN '19169' THEN 0.08
        WHEN '36117' THEN 0.12
        WHEN '08069' THEN 0.25
    END
FROM counties c;

-- Insert sample terrain data
INSERT INTO terrain_data (county_id, avg_elevation, slope_variability, agricultural_land_percent, forest_cover_percent, urban_development_percent)
SELECT 
    c.id,
    CASE c.fips
        WHEN '48201' THEN 80.0
        WHEN '06019' THEN 328.0
        WHEN '19169' THEN 1050.0
        WHEN '36117' THEN 540.0
        WHEN '08069' THEN 5280.0
    END,
    CASE c.fips
        WHEN '48201' THEN 0.15
        WHEN '06019' THEN 0.35
        WHEN '19169' THEN 0.08
        WHEN '36117' THEN 0.22
        WHEN '08069' THEN 0.58
    END,
    CASE c.fips
        WHEN '48201' THEN 25.5
        WHEN '06019' THEN 65.2
        WHEN '19169' THEN 85.7
        WHEN '36117' THEN 72.3
        WHEN '08069' THEN 45.1
    END,
    CASE c.fips
        WHEN '48201' THEN 12.8
        WHEN '06019' THEN 8.5
        WHEN '19169' THEN 5.2
        WHEN '36117' THEN 35.6
        WHEN '08069' THEN 42.8
    END,
    CASE c.fips
        WHEN '48201' THEN 55.2
        WHEN '06019' THEN 15.8
        WHEN '19169' THEN 8.1
        WHEN '36117' THEN 18.5
        WHEN '08069' THEN 12.1
    END
FROM counties c;

-- Insert sample market data
INSERT INTO market_data (county_id, nearest_city, distance_to_city_miles, population_within_50mi, major_highways, transportation_score, avg_land_price_per_acre)
SELECT 
    c.id,
    CASE c.fips
        WHEN '48201' THEN 'Houston'
        WHEN '06019' THEN 'Fresno'
        WHEN '19169' THEN 'Ames'
        WHEN '36117' THEN 'Rochester'
        WHEN '08069' THEN 'Fort Collins'
    END,
    CASE c.fips
        WHEN '48201' THEN 0.0
        WHEN '06019' THEN 0.0
        WHEN '19169' THEN 5.0
        WHEN '36117' THEN 15.0
        WHEN '08069' THEN 0.0
    END,
    CASE c.fips
        WHEN '48201' THEN 7500000
        WHEN '06019' THEN 1200000
        WHEN '19169' THEN 250000
        WHEN '36117' THEN 850000
        WHEN '08069' THEN 450000
    END,
    CASE c.fips
        WHEN '48201' THEN ARRAY['I-45', 'I-10', 'US-59', 'I-610']
        WHEN '06019' THEN ARRAY['I-5', 'CA-99', 'CA-180']
        WHEN '19169' THEN ARRAY['I-35', 'US-30', 'US-69']
        WHEN '36117' THEN ARRAY['I-90', 'NY-14', 'NY-96']
        WHEN '08069' THEN ARRAY['I-25', 'US-287', 'CO-14']
    END,
    CASE c.fips
        WHEN '48201' THEN 0.95
        WHEN '06019' THEN 0.85
        WHEN '19169' THEN 0.70
        WHEN '36117' THEN 0.75
        WHEN '08069' THEN 0.80
    END,
    CASE c.fips
        WHEN '48201' THEN 15800.00
        WHEN '06019' THEN 12500.00
        WHEN '19169' THEN 9800.00
        WHEN '36117' THEN 4200.00
        WHEN '08069' THEN 8900.00
    END
FROM counties c;

-- Insert sample farm analysis results
INSERT INTO farm_analysis (county_id, farm_type, overall_score, soil_score, climate_score, water_score, terrain_score, market_score)
SELECT 
    c.id,
    farm_type,
    overall_score,
    soil_score,
    climate_score,
    water_score,
    terrain_score,
    market_score
FROM counties c
CROSS JOIN (
    VALUES 
    ('goat', 0.75, 0.80, 0.85, 0.70, 0.90, 0.50),
    ('apple', 0.65, 0.70, 0.90, 0.60, 0.75, 0.30),
    ('general', 0.70, 0.75, 0.80, 0.65, 0.80, 0.50)
) AS analysis_data(farm_type, overall_score, soil_score, climate_score, water_score, terrain_score, market_score);

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- You can run these after the schema creation to verify everything worked:

-- SELECT 'Counties created:' as status, count(*) as count FROM counties;
-- SELECT 'Soil data created:' as status, count(*) as count FROM soil_data;
-- SELECT 'Climate data created:' as status, count(*) as count FROM climate_data;
-- SELECT 'Water data created:' as status, count(*) as count FROM water_data;
-- SELECT 'Terrain data created:' as status, count(*) as count FROM terrain_data;
-- SELECT 'Market data created:' as status, count(*) as count FROM market_data;
-- SELECT 'Farm analysis created:' as status, count(*) as count FROM farm_analysis;

-- ================================================================
-- SCHEMA CREATION COMPLETE
-- ================================================================

-- Success! Your Farm Data Informer database schema is now ready.
-- All tables, indexes, security policies, and sample data have been created.
-- Issue #5: Data Pipeline Setup is now COMPLETE! ✅
