// geo types
export interface District {
  id: string;
  name: string;
  stateId: string;
  population: number;
  area: number; // sq km
  density: number;
  literacyRate: number;
  sexRatio: number; // females 
  headquarters?: string;
  tier?: number;
  /**
   * True if this district contains the state/UT capital
   */
  isCapital?: boolean;
  /**
   * True if this district includes a metro city
   */
  isMetro?: boolean;
}

export interface State {
  id: string;
  name: string;
  code: string;
  capital: string;
  region: "North" | "South" | "East" | "West" | "Central" | "Northeast";
  population: number;
  area: number; // sq km
  density: number; // per sq km
  literacyRate: number; // %
  sexRatio: number; // females per 1000 males
  gdp: number; // crores INR
  hdi: number; // 0-1
  cities: City[];
  districts?: District[];
}

export type MetricKey = keyof Pick<State, "population" | "gdp" | "literacyRate" | "hdi" | "density" | "sexRatio" | "area">;

export interface City {
  id: string;
  name: string;
  stateId: string;
  districtId?: string;
  population: number;
  area: number;
  isCapital: boolean;
  isMetro: boolean;
  tier: 1 | 1.5 | 2 | 2.5 | 3 | 4;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  population: number;
  area: number;
  states: State[];
}

// API response types
export interface CensusAPIResponse {
  records: CensusRecord[];
  total: number;
  count: number;
}

export interface CensusRecord {
  state_name: string;
  district_name: string;
  population: string;
  area_sq_km: string;
  density: string;
  literacy_rate: string;
  sex_ratio: string;
}

// viz types
export interface DataPoint {
  label: string;
  value: number;
  unit?: string;
  change?: number;
  trend?: "up" | "down" | "stable";
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface RankedItem {
  rank: number;
  name: string;
  value: number;
  unit: string;
  stateId?: string;
  cityId?: string;
}

// map state
export interface MapViewState {
  selectedState: string | null;
  hoveredState: string | null;
  zoomLevel: number;
}

// ui
export interface BreadcrumbItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: { value: number; direction: "up" | "down" | "stable" };
  icon?: React.ReactNode;
}
