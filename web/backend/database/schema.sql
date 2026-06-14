DROP TABLE IF EXISTS care_suggestions;
DROP TABLE IF EXISTS plant_data;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS plant_types;
DROP TABLE IF EXISTS profiles;

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    display_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE plant_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    plant_type TEXT UNIQUE NOT NULL,

    min_temp NUMERIC,
    max_temp NUMERIC,
    min_humidity NUMERIC,
    max_humidity NUMERIC,
    min_light NUMERIC,
    max_light NUMERIC,
    min_moisture NUMERIC,
    max_moisture NUMERIC,

    max_abs_roll NUMERIC,
    max_abs_pitch NUMERIC,

    description TEXT,

    created_at TIMESTAMP DEFAULT NOW(),

    CHECK (min_temp IS NULL OR max_temp IS NULL OR min_temp <= max_temp),
    CHECK (min_humidity IS NULL OR max_humidity IS NULL OR min_humidity <= max_humidity),
    CHECK (min_light IS NULL OR max_light IS NULL OR min_light <= max_light),
    CHECK (min_moisture IS NULL OR max_moisture IS NULL OR min_moisture <= max_moisture),
    CHECK (max_abs_roll IS NULL OR max_abs_roll >= 0),
    CHECK (max_abs_pitch IS NULL OR max_abs_pitch >= 0)
);

CREATE TABLE devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    plant_type_id UUID REFERENCES plant_types(id) ON DELETE SET NULL,

    plant_name TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, plant_name)
);

CREATE TABLE plant_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,

    moisture NUMERIC,
    light NUMERIC,
    temperature NUMERIC,
    humidity NUMERIC,
    roll NUMERIC,
    pitch NUMERIC,
    plant_status TEXT,

    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE care_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,

    suggestion TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);