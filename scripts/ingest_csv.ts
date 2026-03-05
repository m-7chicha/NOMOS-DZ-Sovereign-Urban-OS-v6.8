import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { geocodeNodes } from '../src/utils/nominatim_bridge.js';

const SUPABASE_URL = 'https://inrtymnmzqkrxuftasrl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlucnR5bW5tenFrcnh1ZnRhc3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDA5NjMsImV4cCI6MjA4Nzk3Njk2M30.04tsyekDQTJyE0S0mz07dK1hI-MyIK0Jsgb_1L5xj-E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function ingestCSV(filePath: string) {
  try {
    console.log(`Reading CSV from ${filePath}...`);
    const csvData = fs.readFileSync(filePath, 'utf-8');
    const lines = csvData.split("\n").filter(line => line.trim() !== "");
    if (lines.length < 2) {
      throw new Error("CSV must contain headers and at least one row");
    }

    const headers = lines[0].split(";").map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(";").map(v => v.trim());
      const row: Record<string, any> = {};
      headers.forEach((h, i) => {
        row[h] = values[i];
      });
      return row;
    });

    console.log(`Parsed ${rows.length} rows. Geocoding nodes...`);
    const geocodedNodes = await geocodeNodes();

    const transformedRows = rows.map(row => {
      const intersection = row.intersection_name;
      const coords = geocodedNodes[intersection];
      
      let location = null;
      if (coords) {
        location = `SRID=4326;POINT(${coords.lon} ${coords.lat})`;
      }

      let trafficLevel = row.traffic_level;
      if (!['Low', 'Medium', 'High'].includes(trafficLevel)) {
        trafficLevel = 'Medium'; // Default fallback
      }

      return {
        intersection_name: row.intersection_name,
        location: location,
        time_slot: row.time_slot,
        is_rain: row.is_rain === "true" || row.is_rain === "1",
        is_ramadan: row.is_ramadan === "true" || row.is_ramadan === "1",
        traffic_level: trafficLevel,
        saturation_index: parseFloat(row.saturation_index)
      };
    });

    const CHUNK_SIZE = 200;
    let insertedCount = 0;

    console.log(`Starting batch ingestion of ${transformedRows.length} records...`);
    for (let i = 0; i < transformedRows.length; i += CHUNK_SIZE) {
      const chunk = transformedRows.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from("urban_events").insert(chunk);
      
      if (error) {
        console.error("Error inserting chunk:", error);
      } else {
        insertedCount += chunk.length;
        console.log(`Inserted ${insertedCount} / ${transformedRows.length} rows...`);
      }
    }

    console.log(`Successfully ingested ${insertedCount} rows.`);
  } catch (error) {
    console.error("Ingestion error:", error);
  }
}

// Execute if run directly
const args = process.argv.slice(2);
if (args.length > 0) {
  ingestCSV(args[0]);
}
