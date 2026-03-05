import { createClient } from "@supabase/supabase-js";
import { geocodeNodes } from "../src/utils/nominatim_bridge.js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "https://inrtymnmzqkrxuftasrl.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlucnR5bW5tenFrcnh1ZnRhc3JsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDA5NjMsImV4cCI6MjA4Nzk3Njk2M30.04tsyekDQTJyE0S0mz07dK1hI-MyIK0Jsgb_1L5xj-E";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixData() {
  console.log("Starting data correction for Algiers nodes...");
  
  try {
    // 1. Geocode nodes
    const geocodedNodes = await geocodeNodes();
    console.log("Geocoding complete:", geocodedNodes);

    // 2. Fetch records with missing location or saturation_index
    // Note: Using the table name provided by the user
    const tableName = "NOMOS_dz_dataset_events_extended";
    
    const { data: records, error: fetchError } = await supabase
      .from(tableName)
      .select("id, intersection_name, traffic_level")
      .or("location.is.null,saturation_index.is.null");

    if (fetchError) {
      console.error("Error fetching records:", fetchError);
      return;
    }

    console.log(`Found ${records?.length || 0} records to update.`);

    if (!records || records.length === 0) return;

    // 3. Update records
    for (const record of records) {
      const coords = geocodedNodes[record.intersection_name];
      let location = null;
      if (coords) {
        location = `SRID=4326;POINT(${coords.lon} ${coords.lat})`;
      }

      // Calculate a mock saturation index if missing
      const saturation_index = record.traffic_level === "High" ? 0.85 + Math.random() * 0.15 :
                              record.traffic_level === "Medium" ? 0.45 + Math.random() * 0.35 :
                              0.1 + Math.random() * 0.3;

      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          location: location,
          saturation_index: saturation_index
        })
        .eq("id", record.id);

      if (updateError) {
        console.error(`Error updating record ${record.id}:`, updateError);
      }
    }

    console.log("Data correction complete.");
  } catch (error) {
    console.error("Unexpected error during data correction:", error);
  }
}

fixData();
