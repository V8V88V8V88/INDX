"use client";

import { use, useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
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
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  if (!state) {
    notFound();
  }
  
  const { data: districts } = useDistricts(state.id);
  
  // Function to normalize district names for matching
  const normalizeDistrictName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[’'".,()/]/g, "")
      .replace(/&/g, "and");
  };
  
  // Handle hash fragments from URL (e.g., #city-VIS, #district-Name)
  useEffect(() => {
    const processHash = () => {
      const hash = window.location.hash.slice(1); // Remove the '#'
      
      if (!hash) {
        setSelectedDistrict(null);
        return;
      }

      // Handle city hash (#city-ID)
      if (hash.startsWith("city-")) {
        const cityId = hash.replace("city-", "");
        const city = state.cities.find((c) => c.id === cityId);
        if (city) {
          setSelectedDistrict(city.name);
        }
      }
      // Handle district hash (#district-Name)
      else if (hash.startsWith("district-")) {
        const districtName = decodeURIComponent(hash.replace("district-", ""));
        // Try to find matching district using normalized names
        if (districts && districts.length > 0) {
          const normalizedHash = normalizeDistrictName(districtName);
          const match = districts.find((d) => {
            const normalizedDistrict = normalizeDistrictName(d.name);
            return normalizedDistrict === normalizedHash || 
                   normalizedDistrict.includes(normalizedHash) || 
                   normalizedHash.includes(normalizedDistrict);
          });
          if (match) {
            setSelectedDistrict(match.name);
          } else {
            // Fallback to the hash name if no match found
            setSelectedDistrict(districtName);
          }
        }
        // If districts not loaded yet, don't set anything - will retry when districts load
      }
    };

    // Process hash immediately (cities work immediately, districts need data)
    processHash();

    // Listen for hash changes (for same-page navigation)
    const handleHashChange = () => processHash();
    window.addEventListener("hashchange", handleHashChange);
    
    // Also check hash on focus (for programmatic hash changes)
    const handleFocus = () => processHash();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [state.cities, districts]);

  // Scroll to map section when district is selected from hash
  useEffect(() => {
    if (!selectedDistrict || !window.location.hash) return;

    const hash = window.location.hash.slice(1);
    if (!hash.startsWith("city-") && !hash.startsWith("district-")) return;

    // Scroll to map section (not districts) since user clicked from search
    const timeoutId = setTimeout(() => {
      const mapElement = document.getElementById("state-map");
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedDistrict]);
  
  // Get district info from fetched districts data
  const selectedDistrictInfo = useMemo(() => {
    if (!selectedDistrict || !districts || districts.length === 0) return null;
    
    // Try exact match first
    let match = districts.find(
      (d) => normalizeDistrictName(d.name) === normalizeDistrictName(selectedDistrict)
    );
    
    // If no exact match, try partial match (e.g., "North West" matches "North West Delhi")
    if (!match) {
      match = districts.find((d) => {
        const geoName = normalizeDistrictName(selectedDistrict);
        const districtName = normalizeDistrictName(d.name);
        return districtName.includes(geoName) || geoName.includes(districtName);
      });
    }
    
    return match || null;
  }, [selectedDistrict, districts]);

  // Calculate national averages
  const nationalAvgLiteracy = states.reduce((sum, s) => sum + s.literacyRate, 0) / states.length;
  const nationalAvgHDI = states.reduce((sum, s) => sum + s.hdi, 0) / states.length;
  const nationalAvgDensity = states.reduce((sum, s) => sum + s.density, 0) / states.length;
  const nationalAvgGDP = states.reduce((sum, s) => sum + s.gdp, 0) / states.length;

  // State rank calculations
  const populationRank = states.filter((s) => s.population > state.population).length + 1;
  const gdpRank = states.filter((s) => s.gdp > state.gdp).length + 1;
  const literacyRank = states.filter((s) => s.literacyRate > state.literacyRate).length + 1;
  const hdiRank = states.filter((s) => s.hdi > state.hdi).length + 1;

  // City data for charts
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
              onClick={() => setSelectedDistrict(state.capital)}
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
            
            {/* District Info Card */}
            {selectedDistrict && (
              <DistrictInfoCard
                district={selectedDistrictInfo}
                districtName={selectedDistrict}
                onClose={() => setSelectedDistrict(null)}
              />
            )}
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
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary">
                <span className="text-xs font-bold text-white">IX</span>
              </div>
              <span className="font-semibold text-text-primary">INDX</span>
            </div>
            <p className="text-sm text-text-muted">
              Data visualization platform · Built for analytical exploration
            </p>
            <div className="flex flex-col items-end gap-1 sm:items-center">
              <p className="text-sm text-text-muted">© 2026 INDX</p>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <p className="text-sm text-text-muted">
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
