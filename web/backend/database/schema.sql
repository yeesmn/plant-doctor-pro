DROP TABLE IF EXISTS care_suggestions;
DROP TABLE IF EXISTS plant_data;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS plant_types;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- Plant type reference table
-- Stores ideal environmental range for each plant type
-- =====================================================
CREATE TABLE IF NOT EXISTS plant_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    plant_type TEXT UNIQUE NOT NULL,

    -- Temperature range, Celsius
    min_temperature NUMERIC,
    max_temperature NUMERIC,

    -- Humidity range, percentage
    min_humidity NUMERIC,
    max_humidity NUMERIC,

    -- Light range, lux
    min_light NUMERIC,
    max_light NUMERIC,

    -- Soil moisture range
    -- If you use raw analog value, document calibration clearly.
    -- For many capacitive sensors: higher value = drier soil.
    min_moisture NUMERIC,
    max_moisture NUMERIC,

    -- Optional tilt/growth condition threshold
    max_roll NUMERIC,
    max_pitch NUMERIC,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Devices table
-- Each Arduino kit/device is connected to one plant type
-- =====================================================
CREATE TABLE IF NOT EXISTS devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    plant_type_id UUID NOT NULL REFERENCES plant_types(id) ON DELETE RESTRICT,

    plant_name TEXT UNIQUE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Sensor readings table
-- Stores Arduino sensor data
-- =====================================================
CREATE TABLE IF NOT EXISTS plant_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,

    moisture NUMERIC,
    light NUMERIC,
    temperature NUMERIC,
    humidity NUMERIC,
    roll NUMERIC,
    pitch NUMERIC,

    plant_status TEXT,

    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Care suggestions table
-- Suggestions can optionally reference a specific reading
-- =====================================================
CREATE TABLE IF NOT EXISTS care_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,

    plant_data_id UUID REFERENCES plant_data(id) ON DELETE SET NULL,

    suggestion TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 이 정책이 없으면 데이터가 있어도 빈 배열 반환됨
CREATE POLICY "Allow public read"
ON devices
FOR SELECT
USING (true);