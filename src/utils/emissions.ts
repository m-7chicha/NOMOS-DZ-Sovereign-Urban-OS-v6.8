export interface EmissionsData {
  node_name: string;
  saturation_index: number;
  traffic_level: 'Low' | 'Medium' | 'High';
}

export interface EmissionsResult {
  node_name: string;
  co2_emissions: number; // kg CO2 per hour
  fuel_waste: number; // liters per hour
  green_score: number; // 0-100
  is_hotspot: boolean;
}

// Standardized coefficients from NOMOS-DZ Protocol
const IDLE_TIME_FACTOR = {
  'Low': 0.05,
  'Medium': 0.35,
  'High': 0.75
};

// Constants for urban fleets
const CARBON_CONSTANT = 2.3; // kg CO2 per liter of fuel
const FUEL_CONSUMPTION_IDLE = 1.5; // Liters per hour for average urban vehicle
const SOVEREIGN_TARGET = 85;

// Estimated vehicle volumes for Algiers nodes (baseline)
const NODE_VOLUMES: Record<string, number> = {
  "Bab Ezzouar": 2800,
  "Dar El Beida": 2400,
  "Ben Aknoun": 3200,
  "Cheraga": 2100,
  "Hydra": 1800,
  "Baraki": 1500
};

export function calculateEnvironmentalImpact(data: EmissionsData): EmissionsResult {
  const idleFactor = IDLE_TIME_FACTOR[data.traffic_level];
  const volume = NODE_VOLUMES[data.node_name] || 2000;
  
  // Fuel Waste (L/hr) = Volume * Idle Factor * Idle Consumption Rate
  const fuel_waste = volume * idleFactor * FUEL_CONSUMPTION_IDLE;
  
  // CO2 Emissions (kg/hr) = Fuel Waste * Carbon Constant
  const co2_emissions = fuel_waste * CARBON_CONSTANT;
  
  // Green Score: Inverse of saturation with a baseline
  const green_score = Math.max(0, 100 - (data.saturation_index * 100));
  
  // Carbon Hotspot: Green Score below Sovereign Target
  const is_hotspot = green_score < SOVEREIGN_TARGET;

  return {
    node_name: data.node_name,
    co2_emissions: Number(co2_emissions.toFixed(2)),
    fuel_waste: Number(fuel_waste.toFixed(2)),
    green_score: Number(green_score.toFixed(1)),
    is_hotspot
  };
}
