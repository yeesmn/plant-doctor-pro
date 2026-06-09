DROP TABLE IF EXISTS care_suggestions;
DROP TABLE IF EXISTS plant_data;
DROP TABLE IF EXISTS devices;

CREATE TABLE IF NOT EXISTS devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plant_type TEXT NOT NULL,
    plant_name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS plant_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    moisture NUMERIC,
    light NUMERIC,
    temperature NUMERIC,
    plant_status TEXT,
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS care_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    suggestion TEXT,
    created_at  TIMESTAMP DEFAULT NOW()  
);