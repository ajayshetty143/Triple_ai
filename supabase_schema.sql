-- ========================================================
-- Autonomous Smart City Incident Investigation System
-- Supabase Schema & Mock Sensor Seed Data
-- ========================================================

-- 1. Create the Sensors Table
CREATE TABLE IF NOT EXISTS city_sensors (
    id TEXT PRIMARY KEY,
    sensor_name TEXT NOT NULL,
    sensor_type TEXT NOT NULL,          -- flood_gauge, power_grid, traffic_camera, medical_hub, gas_pipeline
    location TEXT NOT NULL,
    status TEXT NOT NULL,               -- CRITICAL, WARNING, NORMAL, OFFLINE
    telemetry JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional for testing, allows public read)
ALTER TABLE city_sensors ENABLE ROW LEVEL SECURITY;

-- Allow public read access for our API route
CREATE POLICY "Allow public read access" 
ON city_sensors 
FOR SELECT 
USING (true);

-- Allow public update for live demo mutations (changing sensor status in demo)
CREATE POLICY "Allow public update access" 
ON city_sensors 
FOR UPDATE 
USING (true);

-- 2. Clear existing records to prevent duplicate key errors during resets
TRUNCATE TABLE city_sensors;

-- 3. Seed Realistic Urban Infrastructure Telemetry
INSERT INTO city_sensors (id, sensor_name, sensor_type, location, status, telemetry) VALUES
(
    'SENS-GAS-07',
    'Mainline Gas Pressure Monitor G-7',
    'gas_pipeline',
    'Sector 4 - 5th Ave & Elm Junction',
    'CRITICAL',
    '{
        "pressure_psi": 18.2,
        "nominal_psi": 45.0,
        "leak_detected": true,
        "hazard_zone_radius_m": 450
    }'::jsonb
),
(
    'SENS-FLOOD-01',
    'Riverside Arterial Water Gauge',
    'flood_gauge',
    'Sector 4 - Lower River District',
    'CRITICAL',
    '{
        "water_level_m": 4.85,
        "flood_threshold_m": 3.80,
        "rate_of_rise_m_hr": 0.45,
        "road_submerged": true
    }'::jsonb
),
(
    'SENS-PWR-04',
    'Substation Beta-9 High-Voltage Grid',
    'power_grid',
    'Sector 4 - South Industrial Border',
    'WARNING',
    '{
        "load_percentage": 94,
        "transformer_temp_c": 88,
        "flood_barrier_engaged": false,
        "backup_generator_ready": true
    }'::jsonb
),
(
    'SENS-HOSP-01',
    'St. Jude Metropolitan ER & Trauma Center',
    'medical_hub',
    'Sector 3 - Medical District',
    'WARNING',
    '{
        "er_occupancy_pct": 89,
        "available_trauma_bays": 2,
        "primary_ambulance_route": "Riverside Arterial (Currently Obstructed)",
        "divert_incoming_status": false
    }'::jsonb
),
(
    'SENS-TRF-08',
    '5th Ave Central Corridor Traffic Cam',
    'traffic_camera',
    'Sector 4 - Commercial Corridor',
    'CRITICAL',
    '{
        "congestion_index": 9.4,
        "vehicles_stranded": 42,
        "emergency_lane_clear": false,
        "visibility_m": 120
    }'::jsonb
),
(
    'SENS-TRF-12',
    'Northbound Bypass Expressway Cam',
    'traffic_camera',
    'Sector 2 - Northern Arterial',
    'NORMAL',
    '{
        "congestion_index": 2.1,
        "average_speed_kmh": 68,
        "emergency_lane_clear": true,
        "route_viable_for_detour": true
    }'::jsonb
);

