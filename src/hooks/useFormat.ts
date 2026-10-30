"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useSettings } from "@/contexts/SettingsContext";
import { FY_AVERAGE_INR_PER_USD, getServerUsdRate, getUsdRate, subscribeUsdRate } from "@/lib/fx";
import { formatNumber as formatNumberIN, formatPopulation as formatPopulationIN } from "@/data/india";

export function useFormat() {
    const { settings } = useSettings();
    const usdRate = useSyncExternalStore(subscribeUsdRate, getUsdRate, getServerUsdRate);
    const tUnits = useTranslations("Units");
    const tCommon = useTranslations("Common");
    const units = {
        thousand: tUnits("thousand"),
        lakh: tUnits("lakh"),
        crore: tUnits("crore"),
        lakhCrore: tUnits("lakhCrore"),
    };

    const formatNumber = (val: number): string => {
        if (settings.numberFormat === "indian") {
            return formatNumberIN(val, units);
        }
        // International Format (K, M, B, T)
        if (val >= 1000000000000) return (val / 1000000000000).toFixed(2) + " " + tUnits("trillion");
        if (val >= 1000000000) return (val / 1000000000).toFixed(2) + " " + tUnits("billion");
        if (val >= 1000000) return (val / 1000000).toFixed(2) + " " + tUnits("million");
        if (val >= 1000) return (val / 1000).toFixed(1) + " " + tUnits("thousand");
        return val.toLocaleString("en-US");
    };

    const formatPopulation = (val: number | undefined | null): string => {
        if (val === undefined || val === null) return tCommon("notAvailable");
        if (settings.numberFormat === "indian") {
            return formatPopulationIN(val, units);
        }
        return formatNumber(val);
    };

    const formatCurrency = (valInINR: number, fiscalYear?: string): string => {
        if (settings.currency === "INR") {
            return "₹" + formatNumber(valInINR);
        }

        const rate = (fiscalYear && FY_AVERAGE_INR_PER_USD[fiscalYear]) || usdRate.inrPerUsd;
        const valInUSD = valInINR / rate;

        // Apply formatting to USD value
        if (valInUSD >= 1000000000) return "$" + (valInUSD / 1000000000).toFixed(2) + " " + tUnits("billion");
        if (valInUSD >= 1000000) return "$" + (valInUSD / 1000000).toFixed(2) + " " + tUnits("million");
        if (valInUSD >= 1000) return "$" + (valInUSD / 1000).toFixed(1) + " " + tUnits("thousand");
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
        const value = settings.distanceUnit === "km" ? valInSqKm : valInSqKm * 0.386102;
        const unit = settings.distanceUnit === "km" ? " km²" : " mi²";
        if (value < 100000) {
            return Math.round(value).toLocaleString(settings.numberFormat === "indian" ? "en-IN" : "en-US") + unit;
        }
        return formatNumber(value) + unit;
    };

    return {
        formatNumber,
        formatPopulation,
        formatCurrency,
        formatDistance,
        formatDensity,
        formatArea,
        usdRate
    };
}
