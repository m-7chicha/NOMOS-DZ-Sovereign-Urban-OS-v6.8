export const PRIMARY_NODES = [
  "Bab Ezzouar",
  "Dar El Beida",
  "Ben Aknoun",
  "Cheraga",
  "Hydra",
  "Baraki"
];

const CACHE: Record<string, { lat: number, lon: number }> = {};

/**
 * Fetches coordinates for a specific node name in Algiers.
 */
export async function getCoordinates(nodeName: string): Promise<{ lat: number, lon: number } | null> {
  if (CACHE[nodeName]) return CACHE[nodeName];

  try {
    const query = encodeURIComponent(`${nodeName}, Algiers, Algeria`);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: {
        "User-Agent": "NOMOS-DZ/1.0"
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
      CACHE[nodeName] = coords;
      return coords;
    }
  } catch (error) {
    console.error(`Geocoding error for ${nodeName}:`, error);
  }
  return null;
}

/**
 * Batch geocodes all primary Algiers nodes.
 */
export async function geocodeNodes(): Promise<Record<string, { lat: number, lon: number }>> {
  const results: Record<string, { lat: number, lon: number }> = {};

  for (const node of PRIMARY_NODES) {
    const coords = await getCoordinates(node);
    if (coords) {
      results[node] = coords;
    }
    // Rate limiting for Nominatim (1 request per second)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}
