import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface CleanedTrafficData {
  intersection_name: string;
  time_slot: string;
  is_rain: number;
  is_ramadan: number;
  event_type: string;
  traffic_level: 'Low' | 'Medium' | 'High';
  saturation_index: number;
}

export class ExcelParser {
  private static TRAFFIC_MAP: Record<string, number> = {
    'Low': 0.15,
    'Medium': 0.50,
    'High': 0.95
  };

  public static async parseFile(file: File): Promise<CleanedTrafficData[]> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      return this.parseCSV(file);
    } else {
      return this.parseXLSX(file);
    }
  }

  private static parseCSV(file: File): Promise<CleanedTrafficData[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const cleaned = this.cleanRawData(results.data);
            resolve(cleaned);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error)
      });
    });
  }

  private static parseXLSX(file: File): Promise<CleanedTrafficData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];
          const cleaned = this.cleanRawData(rawData);
          resolve(cleaned);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  private static cleanRawData(rawData: any[]): CleanedTrafficData[] {
    return rawData.map(row => {
      const trafficLevelRaw = String(row.Traffic_Level || row.traffic_level || 'Low').trim();
      // Normalize to Title Case for mapping
      const trafficLevel = (trafficLevelRaw.charAt(0).toUpperCase() + trafficLevelRaw.slice(1).toLowerCase()) as 'Low' | 'Medium' | 'High';
      
      const saturationIndex = this.TRAFFIC_MAP[trafficLevel] || 0.15;

      const rain = row.Rain !== undefined ? row.Rain : row.is_rain;
      const ramadan = row.Ramadan !== undefined ? row.Ramadan : row.is_ramadan;

      return {
        intersection_name: String(row.Intersection || row.intersection_name || '').trim(),
        time_slot: String(row.Time || row.time_slot || '').trim(),
        is_rain: (rain === true || rain === 1 || String(rain).toLowerCase() === 'true') ? 1 : 0,
        is_ramadan: (ramadan === true || ramadan === 1 || String(ramadan).toLowerCase() === 'true') ? 1 : 0,
        event_type: String(row.Event_Type || row.event_type || 'None').trim(),
        traffic_level: trafficLevel,
        saturation_index: saturationIndex
      };
    });
  }
}
