-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the urban_events table
CREATE TABLE IF NOT EXISTS urban_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intersection_name TEXT NOT NULL,
    location GEOGRAPHY(POINT) NOT NULL,
    time_slot TIME NOT NULL,
    is_rain BOOLEAN,
    is_ramadan BOOLEAN,
    traffic_level TEXT CHECK (traffic_level IN ('Low', 'Medium', 'High')),
    saturation_index DECIMAL(3,2)
);

-- Create a GIST spatial index on the location column (compatible with Huawei GaussDB spatial standards)
CREATE INDEX IF NOT EXISTS urban_events_location_gix ON urban_events USING GIST (location);
