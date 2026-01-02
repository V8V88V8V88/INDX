// geo types
export interface State {
  id: string;
  name: string;
  code: string;
  capital: string;
  region: "North" | "South" | "East" | "West" | "Central" | "Northeast";
  population: number;
  area: number;
  density: number;
  literacyRate: number;
  gdp: number;
  hdi: number;
  cities: City[];
}

export interface City {
  id: string;
  name: string;
  stateId: string;
  population: number;
  area: number;
  isCapital: boolean;
  isMetro: boolean;
  tier: 1 | 2 | 3;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  population: number;
  area: number;
  states: State[];
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
