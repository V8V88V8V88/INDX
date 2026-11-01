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
  capitalDistrict?: string;
  region: "North" | "South" | "East" | "West" | "Central" | "Northeast";
  population: number;
  area: number; // sq km
  density: number; // per sq km
  literacyRate: number; // %
  sexRatio: number; // females per 1000 males
  gdp: number; // crores INR
  gdpYear?: string;
  gdpPerCapita: number; // INR per person
  hdi: number; // 0-1
  cities: City[];
  districts?: District[];
}

export type MetricKey = keyof Pick<State, "population" | "gdp" | "gdpPerCapita" | "literacyRate" | "hdi" | "density" | "sexRatio" | "area">;

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

// Government scheme data model.
// See scripts/check-scheme.ts for validation and index generation.

/** Central government, state, or union territory schemes. State and UT schemes set stateId. */
export type SchemeScope = "central" | "state" | "Union Territories";

/** Lifecycle state of a scheme. Renames/merges are captured via the link fields below. */
export type SchemeStatus =
  | "active"
  | "closed"
  | "merged"
  | "replaced"
  | "renamed"
  | "discontinued";

export type SchemeCategory =
  | "education"
  | "healthcare"
  | "employment"
  | "agriculture"
  | "women-child"
  | "financial-inclusion"
  | "housing"
  | "social-security"
  | "msme"
  | "rural-development"
  | "urban-development"
  | "infrastructure"
  | "scholarships"
  | "senior-citizens"
  | "sc-st-obc"
  | "state-welfare";

/** A citation. Prefer official government sources. */
export interface SchemeSource {
  title: string;
  url: string;
  /** ISO date (yyyy-mm-dd) the source was last checked. */
  accessed: string;
}

/** Eligibility rules. `appliesTo` lets a central scheme document state-specific conditions. */
export interface SchemeEligibility {
  /** e.g. "All India", "Uttar Pradesh", "Small & marginal farmers". */
  appliesTo: string;
  criteria: string;
}

export interface SchemeBenefit {
  summary: string;
  details?: string;
}

export interface SchemeApplicationStep {
  channel: string;
  steps: string;
  url?: string;
}

export interface Scheme {
  /** Stable slug, unique across every file, e.g. "pm-kisan". Never reuse. */
  id: string;
  name: string;
  /** Abbreviations, former names, or common alternatives used for search. */
  aliases?: string[];
  scope: SchemeScope;
  /** Required when scope === "state". A state/UT id from src/data/india.ts (e.g. "UP", "DL"). */
  stateId?: string;
  /** e.g. "Government of India" or "Government of Uttar Pradesh". */
  government: string;
  ministry?: string;
  department?: string;
  /** ISO date (yyyy-mm-dd) if known. */
  launchDate?: string;
  launchYear: number;
  categories: SchemeCategory[];
  objectives: string;
  targetBeneficiaries: string[];
  eligibility: SchemeEligibility[];
  benefits: SchemeBenefit[];
  application: SchemeApplicationStep[];
  officialUrls: string[];
  sources: SchemeSource[];
  status: SchemeStatus;
  statusNote?: string;
  /** Lifecycle links so we never duplicate a scheme that was renamed/merged/replaced. */
  renamedTo?: string;
  supersedes?: string[];
  supersededBy?: string[];
  /** ISO date (yyyy-mm-dd) this record was last edited. */
  lastUpdated: string;
  /** Set true only after a human has checked the record against a listed source. */
  verified: boolean;
}

/** Lightweight record written to public/data/schemes/index.json for search + listing. */
export interface SchemeSummary {
  id: string;
  name: string;
  aliases?: string[];
  scope: SchemeScope;
  stateId?: string;
  government: string;
  ministry?: string;
  categories: SchemeCategory[];
  launchYear: number;
  status: SchemeStatus;
  officialUrl?: string;
  /** File the full record lives in, without extension, e.g. "central" or "up". */
  file: string;
}
