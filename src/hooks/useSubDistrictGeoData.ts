import { useQuery } from "@tanstack/react-query";
import * as d3 from "d3";

interface SubDistrictFeature {
    type: "Feature";
    id: number;
    geometry: {
        type: "Polygon" | "MultiPolygon";
        coordinates: number[][][] | number[][][][];
    };
    properties: {
        OBJECTID?: number;
        stcode11?: string;
        dtcode11?: string;
        sdtcode11?: string;
        stname?: string;
        dtname?: string;
        sdtname?: string;
        Shape_Length?: number;
        Shape_Area?: number;
        Subdt_LGD?: number;
        Dist_LGD?: number;
        State_LGD?: number;
    };
}

interface SubDistrictGeoData {
    type: "FeatureCollection";
    features: SubDistrictFeature[];
}

async function fetchSubDistrictGeoData(stateCode: string): Promise<SubDistrictGeoData | null> {
    try {
        const res = await fetch(`/geo/subdistricts/${stateCode}.json`);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.log(`No sub-district data for ${stateCode}`);
        return null;
    }
}

export function useSubDistrictGeoData(stateCode: string) {
    return useQuery({
        queryKey: ["subDistrictGeoData", stateCode],
        queryFn: () => fetchSubDistrictGeoData(stateCode),
        staleTime: 1000 * 60 * 60, // 1 hour cache
        retry: 1,
        enabled: !!stateCode,
    });
}

// District name mapping: state GeoJSON name -> sub-district GeoJSON dtname
// Some districts have different names in state vs sub-district GeoJSON
const DISTRICT_NAME_MAP: Record<string, string> = {
    // UP specific mappings
    "amroha": "jyotiba phule nagar",
    "lakhimpur kheri": "kheri",
    "barabanki": "bara banki",
    "ayodhya": "faizabad",
    "bhadohi": "sant ravidas nagar (bhadohi)",
    "sambhal": "moradabad", // Sambhal was carved out of Moradabad, sub-district GeoJSON may not have separate entry
    "kasganj": "kanshiram nagar", // Kasganj was renamed from Kanshiram Nagar
};

// Tehsil-level filtering for districts that share tehsils with other districts
// When a district is carved out, filter only its specific tehsils
// IMPORTANT: This ensures tehsils from one district don't show in another
const DISTRICT_TEHSIL_FILTER: Record<string, string[]> = {
    // Sambhal district tehsils (carved out of Moradabad in 2011)
    // Note: Gunnaur is incorrectly assigned to Budaun in GeoJSON, but belongs to Sambhal
    "sambhal": ["sambhal", "chandausi", "gunnaur"],
    
    // Add more mappings here as you verify official sources
    // Format: "district_name": ["tehsil1", "tehsil2", ...]
};

// Tehsil-to-district mapping: Correct district assignment for tehsils
// This overrides incorrect assignments in GeoJSON
// Format: "tehsil_name": "correct_district_name"
const TEHSIL_TO_DISTRICT_MAP: Record<string, string> = {
    // Sambhal tehsils (incorrectly assigned in GeoJSON)
    "gunnaur": "sambhal",  // Assigned to Budaun in GeoJSON, but belongs to Sambhal
    "sambhal": "sambhal",  // Assigned to Moradabad in GeoJSON, but belongs to Sambhal
    "chandausi": "sambhal",  // Assigned to Moradabad in GeoJSON, but belongs to Sambhal
    
    // Add more corrections here as you find them
};

// Helper function to get the sub-district GeoJSON name for a district
function getSubDistrictName(districtName: string): string {
    const normalized = districtName.toLowerCase().trim();
    return DISTRICT_NAME_MAP[normalized] || normalized;
}

// Helper function to filter sub-districts by district name
export function filterSubDistrictsByDistrict(
    geoData: SubDistrictGeoData | null | undefined,
    districtName: string
): SubDistrictFeature[] {
    if (!geoData || !districtName) return [];

    const normalizedDistrict = districtName.toLowerCase().trim();
    // Try mapped name first, then fallback to original
    const searchName = getSubDistrictName(normalizedDistrict);
    
    console.log('[filterSubDistrictsByDistrict] Filtering for:', normalizedDistrict, '-> searching as:', searchName);
    
    // Get all unique dtnames for debugging
    const allDtnames = new Set(geoData.features.map(f => (f.properties.dtname || "").toLowerCase().trim()));
    const dtnameArray = Array.from(allDtnames);
    console.log('[filterSubDistrictsByDistrict] Available dtnames (first 20):', dtnameArray.slice(0, 20));

    // Check if this district has specific tehsil filtering (for carved-out districts)
    const tehsilFilter = DISTRICT_TEHSIL_FILTER[normalizedDistrict];
    
    // STRICT: Only exact string match - no closest match, no substring, no word boundary matching
    const results = geoData.features.filter(feature => {
        const dtname = (feature.properties.dtname || "").toLowerCase().trim();
        const sdtname = (feature.properties.sdtname || "").toLowerCase().trim();
        
        // Check if this tehsil has a correct district assignment (overrides GeoJSON)
        const correctDistrict = TEHSIL_TO_DISTRICT_MAP[sdtname];
        if (correctDistrict) {
            // This tehsil belongs to a specific district - only include if it matches
            if (correctDistrict === normalizedDistrict) {
                console.log('[filterSubDistrictsByDistrict] MATCH (corrected assignment):', sdtname, 'belongs to', normalizedDistrict);
                return true;
            } else {
                // This tehsil belongs to a different district - exclude it
                return false;
            }
        }
        
        // If there's a tehsil filter, search across ALL districts for those specific tehsils
        // This handles cases where tehsils are incorrectly assigned to other districts in GeoJSON
        if (tehsilFilter && tehsilFilter.length > 0) {
            const tehsilMatches = tehsilFilter.some(allowedTehsil => 
                sdtname === allowedTehsil.toLowerCase().trim()
            );
            if (tehsilMatches) {
                console.log('[filterSubDistrictsByDistrict] MATCH (filtered tehsil):', sdtname, 'found in district:', dtname);
                return true;
            }
            return false;
        }
        
        // No tehsil filter - check if district name matches
        let districtMatches = false;
        if (dtname === searchName) {
            districtMatches = true;
        } else if (dtname === normalizedDistrict) {
            districtMatches = true;
        }
        
        if (!districtMatches) {
            return false;
        }
        
        // District matches and no tehsil filter - include this tehsil
        console.log('[filterSubDistrictsByDistrict] MATCH:', dtname, 'tehsil:', sdtname);
        return true;
    });
    
    console.log('[filterSubDistrictsByDistrict] Found', results.length, 'matches');
    if (results.length > 0) {
        const uniqueDtnames = new Set(results.map(f => f.properties.dtname));
        console.log('[filterSubDistrictsByDistrict] Result dtnames:', Array.from(uniqueDtnames));
    }
    
    return results;
}
