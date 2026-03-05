export interface NodeImpact {
  node_id: string;
  predicted_saturation: number;
  arrival_time: string; // HH:MM format
}

// Static connectivity weight matrix for the 6 Algiers nodes
// 1.0 means highly connected, 0.0 means not connected
const connectivityWeight: Record<string, Record<string, number>> = {
  "Bab Ezzouar": { "Dar El Beida": 0.9, "Ben Aknoun": 0.4, "Cheraga": 0.2, "Hydra": 0.3, "Baraki": 0.5 },
  "Dar El Beida": { "Bab Ezzouar": 0.9, "Ben Aknoun": 0.3, "Cheraga": 0.1, "Hydra": 0.2, "Baraki": 0.6 },
  "Ben Aknoun": { "Bab Ezzouar": 0.4, "Dar El Beida": 0.3, "Cheraga": 0.8, "Hydra": 0.9, "Baraki": 0.2 },
  "Cheraga": { "Bab Ezzouar": 0.2, "Dar El Beida": 0.1, "Ben Aknoun": 0.8, "Hydra": 0.6, "Baraki": 0.1 },
  "Hydra": { "Bab Ezzouar": 0.3, "Dar El Beida": 0.2, "Ben Aknoun": 0.9, "Cheraga": 0.6, "Baraki": 0.2 },
  "Baraki": { "Bab Ezzouar": 0.5, "Dar El Beida": 0.6, "Ben Aknoun": 0.2, "Cheraga": 0.1, "Hydra": 0.2 }
};

export function calculateSystemicImpact(
  sourceNode: string,
  sourceTrafficLevel: 'Low' | 'Medium' | 'High',
  currentSaturation: Record<string, number>,
  isRain: boolean,
  currentTime: string // HH:MM
): NodeImpact[] {
  const impacts: NodeImpact[] = [];

  if (sourceTrafficLevel !== 'High') {
    return impacts; // Contagion only triggers on High traffic
  }

  const baseIncrease = isRain ? 0.25 : 0.15;
  const timeDelayMinutes = isRain ? 30 : 15;

  const [hours, minutes] = currentTime.split(':').map(Number);
  const arrivalDate = new Date();
  arrivalDate.setHours(hours, minutes + timeDelayMinutes, 0, 0);
  
  const arrivalTimeStr = `${arrivalDate.getHours().toString().padStart(2, '0')}:${arrivalDate.getMinutes().toString().padStart(2, '0')}`;

  const connections = connectivityWeight[sourceNode];
  if (!connections) return impacts;

  for (const [targetNode, weight] of Object.entries(connections)) {
    if (weight > 0.3) { // Only propagate to significantly connected nodes
      const currentSat = currentSaturation[targetNode] || 0;
      const predictedSat = Math.min(1.0, currentSat + (baseIncrease * weight));
      
      impacts.push({
        node_id: targetNode,
        predicted_saturation: Number(predictedSat.toFixed(2)),
        arrival_time: arrivalTimeStr
      });
    }
  }

  return impacts;
}
