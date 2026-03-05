
export interface RawTrafficRecord {
  intersection_name: string;
  time_slot: string;
  is_rain: boolean;
  is_ramadan: boolean;
  traffic_level: 'Low' | 'Medium' | 'High';
  saturation_index: number;
}

export class DataAnalyzer {
  private static TRAFFIC_MAP = {
    'Low': 0.15,
    'Medium': 0.50,
    'High': 0.95
  };

  public static parseCSV(csvContent: string): RawTrafficRecord[] {
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(';').map(h => h.trim());
    const records: RawTrafficRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim());
      if (values.length < headers.length) continue;

      const record: any = {};
      headers.forEach((header, index) => {
        const val = values[index];
        if (header === 'intersection_name' || header === 'time_slot' || header === 'traffic_level') {
          record[header] = val;
        } else if (header === 'is_rain' || header === 'is_ramadan') {
          record[header] = val.toLowerCase() === 'true' || val === '1';
        }
      });

      // Map Traffic Level to Saturation Index
      const level = record.traffic_level as 'Low' | 'Medium' | 'High';
      record.saturation_index = this.TRAFFIC_MAP[level] || 0.15;

      records.push(record as RawTrafficRecord);
    }

    return records;
  }
}
