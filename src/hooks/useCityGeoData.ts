import { useQuery } from "@tanstack/react-query";

interface CityGeoFeature {
    type: "Feature";
    geometry: {
        type: "Point";
        coordinates: [number, number]; // [longitude, latitude]
    };
    properties: {
        OBJECTID?: number;
        STNAME?: string;
        DTNAME?: string;
        DIST_HQ?: string;
        SUBDIST_HQ?: string;
        DIST_HQNM?: string;
        LOC_NAME?: string;
        STATE_HQ?: number | null;
    };
}

interface CityGeoData {
    type: "FeatureCollection";
    features: CityGeoFeature[];
}

async function fetchCityGeoData(stateCode: string): Promise<CityGeoFeature[]> {
    const allFeatures: CityGeoFeature[] = [];

    // Try to load district HQ points
    try {
        const districtHqRes = await fetch(`/geo/cities/${stateCode}_district_hq.json`);
        if (districtHqRes.ok) {
            const data: CityGeoData = await districtHqRes.json();
            allFeatures.push(...data.features.map(f => ({
                ...f,
                properties: { ...f.properties, isDistrictHQ: true }
            })));
        }
    } catch (e) {
        console.log(`No district HQ data for ${stateCode}`);
    }

    // Try to load sub-district HQ points
    try {
        const subDistrictHqRes = await fetch(`/geo/cities/${stateCode}_subdistrict_hq.json`);
        if (subDistrictHqRes.ok) {
            const data: CityGeoData = await subDistrictHqRes.json();
            allFeatures.push(...data.features.map(f => ({
                ...f,
                properties: { ...f.properties, isSubDistrictHQ: true }
            })));
        }
    } catch (e) {
        console.log(`No sub-district HQ data for ${stateCode}`);
    }

    return allFeatures;
}

export function useCityGeoData(stateCode: string) {
    return useQuery({
        queryKey: ["cityGeoData", stateCode],
        queryFn: () => fetchCityGeoData(stateCode),
        staleTime: 1000 * 60 * 60, // 1 hour cache
        retry: 1,
        enabled: !!stateCode,
    });
}
