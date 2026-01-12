"use client";

import { use, useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, MetricCard, PageLoader } from "@/components";
import { BarChart } from "@/components/BarChart";
import { StatComparison } from "@/components/StatComparison";
import { DistrictList } from "@/components/DistrictList";
import { StateMap } from "@/components/StateMap";
import { DistrictInfoCard } from "@/components/DistrictInfoCard";
import { getStateById, states } from "@/data/india";
import { useFormat } from "@/hooks/useFormat";
import { useDistricts } from "@/hooks/useDistricts";
import type { City, District } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StatePage({ params }: PageProps) {
  const { id } = use(params);
  const state = getStateById(id);
  const { formatPopulation, formatCurrency, formatArea, formatDensity } = useFormat();
  const prefersReducedMotion = useReducedMotion();
  const smooth: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.8, ease: [0.22, 1, 0.36, 1] };

  const getInitialDistrictFromHash = (): string | null => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("district-")) {
      return decodeURIComponent(hash.replace("district-", ""));
    }
    if (hash.startsWith("city-")) {
      const cityId = hash.replace("city-", "");
      return cityId;
    }
    return null;
  };

  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [isPageReady, setIsPageReady] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const initialHashProcessed = useRef(false);
  const lastHashRef = useRef<string>(typeof window !== "undefined" ? window.location.hash : "");

  if (!state) {
    notFound();
  }

  const { data: districts } = useDistricts(state.id);

  const capitalToDistrictMap: Record<string, string> = {
    "Itanagar": "Papum Pare",
  };

  const normalizeDistrictName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[’'".,()/]/g, "")
      .replace(/&/g, "and");
  };

  // Keep this in sync with DistrictList's definition so that "major" places
  // are derived from shared parameters instead of duplicated data.
  const isMajorArea = (d: District, city?: City) => {
    const pop = d.population;
    const tier = city?.tier ?? d.tier;
    const isMetro = !!(city?.isMetro || d.isMetro);
    const density = d.density;
    const literacy = d.literacyRate || 0;

    if (isMetro || tier === 1) return true;

    const bigUrban = pop >= 3_000_000 && density >= 1200;
    const goodQuality = literacy >= 75;

    return bigUrban && goodQuality;
  };

  useEffect(() => {
    // Smart Pre-load:
    // We delay the "ready" state slightly to allowing heavy components (Map, Charts)
    // to hydrate and render their initial frame BEHIND the loader.
    // This ensures that when the loader fades out, the UI is fully painted and 60fps smooth.
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const processHash = (isInitial = false) => {
      const hash = window.location.hash.slice(1);

      if (!hash) {
        if (!isInitial) {
          setSelectedDistrict(null);
        }
        return;
      }

      if (hash.startsWith("city-")) {
        const cityId = hash.replace("city-", "");
        const city = state.cities.find((c) => c.id === cityId);
        if (city) {
          setSelectedDistrict(city.name);
        } else if (selectedDistrict === cityId) {
          const foundCity = state.cities.find((c) => c.id === cityId);
          if (foundCity) {
            setSelectedDistrict(foundCity.name);
          }
        }
      }
      else if (hash.startsWith("district-")) {
        const districtName = decodeURIComponent(hash.replace("district-", ""));
        if (districts && districts.length > 0) {
          const normalizedHash = normalizeDistrictName(districtName);
          const match = districts.find((d) => {
            const normalizedDistrict = normalizeDistrictName(d.name);
            return normalizedDistrict === normalizedHash ||
              normalizedDistrict.includes(normalizedHash) ||
              normalizedHash.includes(normalizedDistrict);
          });
          setSelectedDistrict(match ? match.name : districtName);
        } else {
          if (!selectedDistrict || selectedDistrict !== districtName) {
            setSelectedDistrict(districtName);
          }
        }
      }
    };
    if (!initialHashProcessed.current) {
      processHash(true);
      initialHashProcessed.current = true;
    } else {
      processHash(false);
    }

    const handleHashChange = () => {
      initialHashProcessed.current = false;
      processHash(false);
      setHasScrolled(false); // Reset scroll flag on hash change
      lastHashRef.current = window.location.hash;
    };

    const checkHashChange = () => {
      const currentHash = window.location.hash;
      if (currentHash !== lastHashRef.current) {
        lastHashRef.current = currentHash;
        handleHashChange();
      }
    };

    // Increased interval to reduce main thread overhead
    const hashCheckInterval = setInterval(checkHashChange, 500);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      clearInterval(hashCheckInterval);
    };
  }, [state.cities, districts, state.id]);

  useEffect(() => {
    if (!selectedDistrict || !window.location.hash || !isPageReady || hasScrolled) return;

    const hash = window.location.hash.slice(1);
    if (!hash.startsWith("city-") && !hash.startsWith("district-")) return;

    const scrollToMap = () => {
      const mapElement = document.getElementById("state-map");
      if (mapElement) {
        const isFromSpotlight = document.referrer &&
          document.referrer.includes(window.location.origin) &&
          !document.referrer.includes(window.location.pathname);

        mapElement.scrollIntoView({
          behavior: isFromSpotlight ? "auto" : "smooth",
          block: "center"
        });
        setHasScrolled(true);
      }
    };
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToMap);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [selectedDistrict, isPageReady, hasScrolled]);

  const selectedDistrictInfo = useMemo(() => {
    if (!selectedDistrict || !districts || districts.length === 0) return null;

    let match = districts.find(
      (d) => normalizeDistrictName(d.name) === normalizeDistrictName(selectedDistrict)
    );

    if (!match) {
      match = districts.find((d) => {
        const geoName = normalizeDistrictName(selectedDistrict);
        const districtName = normalizeDistrictName(d.name);
        return districtName.includes(geoName) || geoName.includes(districtName);
      });
    }

    return match || null;
  }, [selectedDistrict, districts]);

  const nationalAvgLiteracy = states.reduce((sum, s) => sum + s.literacyRate, 0) / states.length;
  const nationalAvgHDI = states.reduce((sum, s) => sum + s.hdi, 0) / states.length;
  const nationalAvgDensity = states.reduce((sum, s) => sum + s.density, 0) / states.length;
  const nationalAvgGDP = states.reduce((sum, s) => sum + s.gdp, 0) / states.length;

  const populationRank = states.filter((s) => s.population > state.population).length + 1;
  const gdpRank = states.filter((s) => s.gdp > state.gdp).length + 1;
  const literacyRank = states.filter((s) => s.literacyRate > state.literacyRate).length + 1;
  const hdiRank = states.filter((s) => s.hdi > state.hdi).length + 1;

  const majorAreasByPopulation = useMemo(() => {
    if (districts && districts.length > 0) {
      const districtData = [...districts]
        .sort((a, b) => b.population - a.population)
        .slice(0, 5)
        .map((district) => {
          const matchedCity = state.cities.find(
            (c) =>
              normalizeDistrictName(c.name) === normalizeDistrictName(district.name) ||
              normalizeDistrictName(c.name) === normalizeDistrictName(district.headquarters || "")
          );

          return {
            name: district.name,
            value: district.population,
            displayValue: formatPopulation(district.population),
            highlight: !!(matchedCity?.isCapital || district.isCapital),
          };
        });

      if (districtData.length > 0) {
        return districtData;
      }
    }

    if (state.cities && state.cities.length > 0) {
      return [...state.cities]
        .sort((a, b) => b.population - a.population)
        .slice(0, 5)
        .map((city) => ({
          name: city.name,
          value: city.population,
          displayValue: formatPopulation(city.population),
          highlight: city.isCapital || false,
        }));
    }

    return [];
  }, [districts, state.cities, formatPopulation]);

  return (
    <div className="min-h-screen bg-bg-primary">
      <AnimatePresence>
        {!isPageReady && <PageLoader />}
      </AnimatePresence>

      <Header
        breadcrumbs={[{ label: state.name, href: `/state/${state.id}` }]}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero Section */}
        <motion.section
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          animate={isPageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={smooth}
          className="mb-8"
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-accent-primary px-3 py-1 text-xs font-semibold text-white">
              {state.region} India
            </span>
            <span className="rounded-full bg-bg-tertiary border border-accent-primary/40 dark:border-accent-primary/60 px-3 py-1 text-xs font-medium text-accent-primary dark:text-accent-secondary">
              {state.code}
            </span>
          </div>
          <h1 className="text-display mb-3 text-text-primary">{state.name}</h1>
          <p className="max-w-2xl text-lg text-text-tertiary">
            Capital:{" "}
            <button
              onClick={() => {
                const capital = state.capital;
                if (districts && districts.length > 0) {
                  const normalizedCapital = normalizeDistrictName(capital);
                  let districtMatch = districts.find((d) => {
                    const normalizedDistrict = normalizeDistrictName(d.name);
                    return normalizedDistrict === normalizedCapital;
                  });
                  if (!districtMatch) {
                    districtMatch = districts.find((d) => {
                      const normalizedHq = normalizeDistrictName(d.headquarters || "");
                      return normalizedHq === normalizedCapital;
                    });
                  }
                  if (!districtMatch && capitalToDistrictMap[capital]) {
                    const mappedDistrictName = capitalToDistrictMap[capital];
                    districtMatch = districts.find((d) => {
                      return normalizeDistrictName(d.name) === normalizeDistrictName(mappedDistrictName);
                    });
                  }
                  if (districtMatch) {
                    setSelectedDistrict(districtMatch.name);
                  } else {
                    setSelectedDistrict(capital);
                  }
                } else if (capitalToDistrictMap[capital]) {
                  setSelectedDistrict(capitalToDistrictMap[capital]);
                } else {
                  setSelectedDistrict(capital);
                }
              }}
              className="text-text-secondary hover:text-accent-primary hover:underline transition-colors cursor-pointer"
            >
              {state.capital}
            </button>
            {" · "}
            {state.cities.length} major cities tracked
            {" · "}
            {formatArea(state.area)} area
          </p>
        </motion.section>

        {/* Metrics & Map Grid */}
        <div className="mb-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column: Metrics */}
          <div className="flex flex-col gap-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MetricCard
                title="Population"
                value={formatPopulation(state.population)}
                subtitle={`#${populationRank} in India`}
                delay={0.1}
                trigger={isPageReady}
              />
              <MetricCard
                title="GDP"
                value={formatCurrency(state.gdp * 10000000)}
                unit=""
                subtitle={`#${gdpRank} in India`}
                delay={0.15}
                trigger={isPageReady}
              />
              <MetricCard
                title="Literacy Rate"
                value={state.literacyRate}
                unit="%"
                subtitle={`#${literacyRank} in India`}
                delay={0.2}
                trigger={isPageReady}
              />
              <MetricCard
                title="HDI"
                value={state.hdi.toFixed(3)}
                subtitle={`#${hdiRank} in India`}
                delay={0.25}
                trigger={isPageReady}
              />
            </div>

            <div className="min-h-[200px] transition-all duration-200">
              <AnimatePresence mode="wait" initial={false}>
                {selectedDistrict && (
                  <DistrictInfoCard
                    key={selectedDistrict}
                    district={selectedDistrictInfo}
                    districtName={selectedDistrict}
                    onClose={() => {
                      setSelectedDistrict(null);
                      setHasScrolled(false);
                      if (window.location.hash) {
                        window.history.replaceState(null, "", window.location.pathname);
                      }
                    }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Map - Now takes full column */}
          <div id="state-map" className="-mt-4">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97 }}
              animate={isPageReady ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
              transition={prefersReducedMotion ? { duration: 0 } : { ...smooth, delay: 0.1 }}
              className="flex flex-col items-center justify-center"
              style={{ overflow: "visible" }}
            >
              <div className="w-full" style={{ minHeight: "650px", overflow: "visible" }}>
                <StateMap
                  stateCode={state.id}
                  state={state}
                  selectedDistrict={selectedDistrict}
                  onDistrictSelect={setSelectedDistrict}
                  onDistrictClick={setSelectedDistrict}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Comparison and Charts Row */}
        <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StatComparison
            title="vs National Average"
            stateName={state.name}
            delay={0.15}
            trigger={isPageReady}
            items={[
              {
                label: "Literacy Rate",
                stateValue: state.literacyRate.toFixed(1),
                nationalValue: nationalAvgLiteracy.toFixed(1),
                unit: "%",
                higher: state.literacyRate > nationalAvgLiteracy ? "state" : "national",
              },
              {
                label: "HDI",
                stateValue: state.hdi.toFixed(3),
                nationalValue: nationalAvgHDI.toFixed(3),
                higher: state.hdi > nationalAvgHDI ? "state" : "national",
              },
              {
                label: "Density",
                stateValue: formatDensity(state.density),
                nationalValue: formatDensity(Math.round(nationalAvgDensity)),
                unit: "",
                higher: null,
              },
              {
                label: "GDP",
                stateValue: formatCurrency(state.gdp * 10000000),
                nationalValue: formatCurrency(Math.round(nationalAvgGDP) * 10000000),
                unit: "",
                higher: state.gdp > nationalAvgGDP ? "state" : "national",
              },
            ]}
          />

          <BarChart
            title="Cities by Population"
            delay={0.18}
            trigger={isPageReady}
            items={majorAreasByPopulation}
          />
        </section>

        {/* Additional Metrics */}
        <section className="mb-10">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            animate={isPageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={prefersReducedMotion ? { duration: 0 } : { ...smooth, delay: 0.2 }}
            className="card p-6"
          >
            <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Geographic & Demographic Data
            </h3>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-muted">Total Area</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatArea(state.area)}
                </p>
                <p className="text-xs text-text-muted">sq km</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-muted">Density</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatDensity(state.density)}
                </p>
                <p className="text-xs text-text-muted"></p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-muted">Total Districts</p>
                <p className="text-2xl font-bold text-text-primary">
                  {districts?.length || 0}
                </p>
                <p className="text-xs text-text-muted">districts</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-muted">Major Districts</p>
                <p className="text-2xl font-bold text-text-primary">
                  {districts?.filter((d) => {
                    const matchedCity = state.cities.find(
                      (c) =>
                        normalizeDistrictName(c.name) === normalizeDistrictName(d.name) ||
                        normalizeDistrictName(c.name) === normalizeDistrictName(d.headquarters || "")
                    );
                    return isMajorArea(d, matchedCity);
                  }).length || 0}
                </p>
                <p className="text-xs text-text-muted">metros</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-muted">District Pop.</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatPopulation(
                    districts?.reduce((sum, d) => sum + (d.population || 0), 0) || 0
                  )}
                </p>
                <p className="text-xs text-text-muted">total districts</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-text-muted">Per Capita GDP</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatCurrency(Math.round((state.gdp * 10000000) / state.population))}
                </p>
                <p className="text-xs text-text-muted">approx</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Districts & Cities Section */}
        <section className="mb-12" data-districts-section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-headline text-text-primary">Districts</h2>
              <p className="text-text-tertiary">
                Administrative divisions of {state.name}
              </p>
            </div>
            <div className="flex gap-2 text-xs text-text-muted">
              <span>{state.cities.length} major cities</span>
            </div>
          </div>
          <DistrictList
            stateCode={state.id}
            stateName={state.name}
            cities={state.cities}
            selectedDistrict={selectedDistrict}
            onDistrictSelect={setSelectedDistrict}
          />
        </section>

        {/* Back Navigation */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={isPageReady ? { opacity: 1 } : { opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { ...smooth, delay: 0.2 }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border-light px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-secondary"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to India
          </Link>
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 border-t border-border-light py-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-text-muted text-center">
              Maps, data, and everything in between
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-text-muted">© 2026 INDX</p>
              <span className="text-text-muted">|</span>
              <Link href="/about" className="text-sm text-accent-primary hover:opacity-80 transition-colors">
                About
              </Link>
            </div>
            <p className="text-sm text-text-muted text-center">
              Made with <span className="text-accent-primary">❤️</span> by{" "}
              <a href="https://v8v88v8v88.com/" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">
                Vaibhav Pratap Singh
              </a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
