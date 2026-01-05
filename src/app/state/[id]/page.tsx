"use client";

import { use, useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, MetricCard } from "@/components";
import { BarChart } from "@/components/BarChart";
import { StatComparison } from "@/components/StatComparison";
import { DistrictList } from "@/components/DistrictList";
import { StateMap } from "@/components/StateMap";
import { DistrictInfoCard } from "@/components/DistrictInfoCard";
import { getStateById, states } from "@/data/india";
import { useFormat } from "@/hooks/useFormat";
import { useDistricts } from "@/hooks/useDistricts";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StatePage({ params }: PageProps) {
  const { id } = use(params);
  const state = getStateById(id);
  const { formatPopulation, formatCurrency, formatArea, formatDensity } = useFormat();
  
  // Initialize from hash immediately to persist on refresh
  const getInitialDistrictFromHash = (): string | null => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("district-")) {
      return decodeURIComponent(hash.replace("district-", ""));
    }
    if (hash.startsWith("city-")) {
      const cityId = hash.replace("city-", "");
      // Will be converted to city name when state loads
      return cityId;
    }
    return null;
  };

  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(getInitialDistrictFromHash);
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

  // Mark page as ready after initial render
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsPageReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Process hash on mount and when dependencies change
  useEffect(() => {
    const processHash = (isInitial = false) => {
      const hash = window.location.hash.slice(1);

      if (!hash) {
        // Only clear on hash change, not on initial load if we have a selection
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
          // If we had cityId stored from initial load, try to find it now
          const foundCity = state.cities.find((c) => c.id === cityId);
          if (foundCity) {
            setSelectedDistrict(foundCity.name);
          }
        }
      }
      else if (hash.startsWith("district-")) {
        const districtName = decodeURIComponent(hash.replace("district-", ""));
        // If districts are loaded, try to match
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
          // Keep the district name we already have from initial load
          if (!selectedDistrict || selectedDistrict !== districtName) {
            setSelectedDistrict(districtName);
          }
        }
      }
    };

    // Process hash on mount and when districts/cities load
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
    
    // Check for hash changes periodically (for same-page navigation via router.push)
    const checkHashChange = () => {
      const currentHash = window.location.hash;
      if (currentHash !== lastHashRef.current) {
        lastHashRef.current = currentHash;
        handleHashChange();
      }
    };
    
    // Check every 150ms for hash changes (lightweight polling)
    const hashCheckInterval = setInterval(checkHashChange, 150);
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

    // Wait for page to be fully rendered and layout to stabilize before scrolling
    const scrollToMap = () => {
      const mapElement = document.getElementById("state-map");
      if (mapElement) {
        // Check if we're coming from spotlight (same origin referrer)
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

    // Wait for layout to stabilize
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

  const citiesByPopulation = [...state.cities].sort((a, b) => b.population - a.population);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header
        breadcrumbs={[{ label: state.name, href: `/state/${state.id}` }]}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-accent-primary/20 px-3 py-1 text-xs font-medium text-accent-primary">
              {state.region} India
            </span>
            <span className="rounded-full bg-bg-tertiary px-3 py-1 text-xs font-medium text-text-muted">
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
              />
              <MetricCard
                title="GDP"
                value={formatCurrency(state.gdp * 10000000)}
                unit=""
                subtitle={`#${gdpRank} in India`}
                delay={0.15}
              />
              <MetricCard
                title="Literacy Rate"
                value={state.literacyRate}
                unit="%"
                subtitle={`#${literacyRank} in India`}
                delay={0.2}
              />
              <MetricCard
                title="HDI"
                value={state.hdi.toFixed(3)}
                subtitle={`#${hdiRank} in India`}
                delay={0.25}
              />
            </div>

            {/* District Info Card - Reserve space to prevent layout shift */}
            <div className="min-h-[200px] transition-all duration-200">
              <AnimatePresence mode="wait">
                {selectedDistrict && (
                  <DistrictInfoCard
                    key={selectedDistrict}
                    district={selectedDistrictInfo}
                    districtName={selectedDistrict}
                    onClose={() => {
                      setSelectedDistrict(null);
                      setHasScrolled(false);
                      // Remove hash when closing
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
          <div id="state-map">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center justify-center"
              style={{ overflow: "visible" }}
            >
              <div className="w-full" style={{ minHeight: "500px", overflow: "visible" }}>
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
            delay={0.3}
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
            delay={0.35}
            items={citiesByPopulation.slice(0, 6).map((city) => ({
              name: city.name,
              value: city.population,
              displayValue: formatPopulation(city.population),
              highlight: city.isCapital,
            }))}
          />
        </section>

        {/* Additional Metrics */}
        <section className="mb-10">
          <div className="card p-6">
            <h3 className="mb-5 text-sm font-medium uppercase tracking-wider text-text-muted">
              Geographic & Demographic Data
            </h3>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <p className="mb-1 text-xs text-text-muted">Total Area</p>
                <p className="text-xl font-semibold text-text-primary">
                  {formatArea(state.area)}
                </p>
                <p className="text-xs text-text-muted">sq km</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-text-muted">Density</p>
                <p className="text-xl font-semibold text-text-primary">
                  {formatDensity(state.density)}
                </p>
                <p className="text-xs text-text-muted"></p>
              </div>
              <div>
                <p className="mb-1 text-xs text-text-muted">Major Cities</p>
                <p className="text-xl font-semibold text-text-primary">
                  {state.cities.length}
                </p>
                <p className="text-xs text-text-muted">tracked</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-text-muted">Tier 1 Cities</p>
                <p className="text-xl font-semibold text-text-primary">
                  {state.cities.filter((c) => c.tier === 1).length}
                </p>
                <p className="text-xs text-text-muted">metros</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-text-muted">Urban Pop.</p>
                <p className="text-xl font-semibold text-text-primary">
                  {formatPopulation(
                    state.cities.reduce((sum, c) => sum + c.population, 0)
                  )}
                </p>
                <p className="text-xs text-text-muted">in tracked cities</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-text-muted">Per Capita GDP</p>
                <p className="text-xl font-semibold text-text-primary">
                  {formatCurrency(Math.round((state.gdp * 10000000) / state.population))}
                </p>
                <p className="text-xs text-text-muted">approx</p>
              </div>
            </div>
          </div>
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
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
