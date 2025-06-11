// Farm and location related types
export interface County {
  id: string;
  name: string;
  state: string;
  fips: string;
  coordinates: [number, number]; // [lat, lng]
  bounds?: [[number, number], [number, number]]; // [[south, west], [north, east]]
}

export interface FarmSuitabilityScore {
  overall: number;
  factors: {
    soil: number;
    climate: number;
    water: number;
    terrain: number;
    market: number;
  };
  farmType: 'goat' | 'apple' | 'general';
}

export interface MapState {
  center: [number, number];
  zoom: number;
  selectedCounty: County | null;
}

// API response types
export interface USDADataResponse {
  data: any[];
  status: string;
  message?: string;
}

export interface WeatherData {
  temperature: number;
  precipitation: number;
  humidity: number;
  date: string;
}
