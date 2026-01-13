"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { formatNumber as formatNumberIN, formatPopulation as formatPopulationIN } from "@/data/india";

export function useFormat() {
    const { settings } = useSettings();

    const formatNumber = (val: number): string => {
        if (settings.numberFormat === "indian") {
            return formatNumberIN(val);
        }
        // International Format (K, M, B)
        if (val >= 1000000000) return (val / 1000000000).toFixed(2) + " B";
        if (val >= 1000000) return (val / 1000000).toFixed(2) + " M";
        if (val >= 1000) return (val / 1000).toFixed(1) + " K";
        return val.toLocaleString("en-US");
    };

    const formatPopulation = (val: number | undefined | null): string => {
        if (val === undefined || val === null) return "N/A";
        if (settings.numberFormat === "indian") {
            return formatPopulationIN(val);
        }
        // International Format
        if (val >= 1000000000) return (val / 1000000000).toFixed(2) + " B";
        if (val >= 1000000) return (val / 1000000).toFixed(2) + " M";
        if (val >= 1000) return (val / 1000).toFixed(1) + " K";
        return val.toLocaleString("en-US");
    };

    const formatCurrency = (valInINR: number): string => {
        if (settings.currency === "INR") {
            if (settings.numberFormat === "indian") {
                return "₹" + formatNumberIN(valInINR);
            }
            return "₹" + formatNumber(valInINR);
        }

        // Convert to USD (Approx ₹84 = $1)
        const valInUSD = valInINR / 84;

        // Apply formatting to USD value
        if (valInUSD >= 1000000000) return "$" + (valInUSD / 1000000000).toFixed(2) + " B";
        if (valInUSD >= 1000000) return "$" + (valInUSD / 1000000).toFixed(2) + " M";
        if (valInUSD >= 1000) return "$" + (valInUSD / 1000).toFixed(1) + " K";
        return "$" + valInUSD.toLocaleString("en-US", { maximumFractionDigits: 0 });
    };

    const formatDistance = (valInKm: number): string => {
        if (settings.distanceUnit === "km") {
            return valInKm.toLocaleString("en-US") + " km";
        }

        // Convert to Miles (1 km = 0.621371 miles)
        const valInMiles = valInKm * 0.621371;
        return valInMiles.toLocaleString("en-US", { maximumFractionDigits: 1 }) + " mi";
    };

    const formatDensity = (valInSqKm: number): string => {
        if (settings.distanceUnit === "km") {
            return valInSqKm.toLocaleString("en-US") + "/km²";
        }
        // Density per sq mile = Density per sq km / (0.621371^2) approx * 2.59
        // People / sq_km * 2.58999 = People / sq_mile
        const valInSqMile = valInSqKm * 2.58999;
        return Math.round(valInSqMile).toLocaleString("en-US") + "/mi²";
    };

    const formatArea = (valInSqKm: number): string => {
        if (settings.distanceUnit === "km") {
            return formatNumber(valInSqKm) + " km²";
        }
        // Area in sq miles = sq km * 0.386102
        const valInSqMiles = valInSqKm * 0.386102;
        return formatNumber(valInSqMiles) + " mi²";
    };

    return {
        formatNumber,
        formatPopulation,
        formatCurrency,
        formatDistance,
        formatDensity,
        formatArea
    };
}
