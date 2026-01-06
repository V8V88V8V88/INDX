"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components";
import { InlineSearch } from "@/components/InlineSearch";
import { StateMap } from "@/components/StateMap";
import { CityCard } from "@/components/CityCard";
import { getStateById, states } from "@/data/india";
import { useFormat } from "@/hooks/useFormat";
import { useDistricts } from "@/hooks/useDistricts";
import type { State, City } from "@/types";

interface SearchResult {
  type: "state" | "city" | "district";
  id: string;
  name: string;
  stateName?: string;
  stateId?: string;
  state?: State;
  city?: City;
  district?: import("@/types").District;
}

type CompareItem = {
  type: "state" | "city" | "district";
  state?: State;
  city?: City;
  district?: import("@/types").District;
  districtState?: State;
};

export default function ComparePage() {
  const [leftItem, setLeftItem] = useState<CompareItem | null>(null);
  const [rightItem, setRightItem] = useState<CompareItem | null>(null);
  const { formatPopulation, formatCurrency, formatArea, formatDensity } = useFormat();

  const leftState = leftItem?.type === "state" ? leftItem.state : (leftItem?.type === "city" && leftItem.city ? getStateById(leftItem.city.stateId) : (leftItem?.type === "district" ? leftItem.districtState : null));
  const rightState = rightItem?.type === "state" ? rightItem.state : (rightItem?.type === "city" && rightItem.city ? getStateById(rightItem.city.stateId) : (rightItem?.type === "district" ? rightItem.districtState : null));

  const { data: leftDistricts } = useDistricts(leftState?.id || "");
  const { data: rightDistricts } = useDistricts(rightState?.id || "");

  const leftName =
    (leftItem?.type === "state" && leftItem.state?.name) ||
    (leftItem?.type === "city" && leftItem.city?.name) ||
    (leftItem?.type === "district" && leftItem.district?.name) ||
    "";

  const rightName =
    (rightItem?.type === "state" && rightItem.state?.name) ||
    (rightItem?.type === "city" && rightItem.city?.name) ||
    (rightItem?.type === "district" && rightItem.district?.name) ||
    "";

  const handleLeftSelect = (result: SearchResult) => {
    if (result.type === "state" && result.state) {
      setLeftItem({ type: "state", state: result.state });
    } else if (result.type === "city" && result.city) {
      const state = result.state || (result.stateId ? getStateById(result.stateId) : null);
      if (state) {
        setLeftItem({ type: "city", city: result.city, state }); // Keeping state in leftItem context might be better managed by just deriving it, but existing logic used implicit derived state var. Wait, existing logic set state in setLeftItem? No, CompareItem doesn't have state prop for city type in my new definition? Ah, existing definition didn't have state in CompareItem for city type, but `setLeftItem` line 47 in original code had `state` property!
        // The original CompareItem type: type: "state" | "city"; state?: State; city?: City; 
        // So passing state is valid.
      }
    } else if (result.type === "district" && result.district) {
      const state = result.state || (result.stateId ? getStateById(result.stateId) : null);
      if (state) {
        setLeftItem({ type: "district", district: result.district, districtState: state });
      }
    } else if (result.stateId) {
      const state = getStateById(result.stateId);
      if (state) {
        setLeftItem({ type: "state", state });
      }
    }
  };

  const handleRightSelect = (result: SearchResult) => {
    if (result.type === "state" && result.state) {
      setRightItem({ type: "state", state: result.state });
    } else if (result.type === "city" && result.city) {
      const state = result.state || (result.stateId ? getStateById(result.stateId) : null);
      if (state) {
        setRightItem({ type: "city", city: result.city, state }); // Using state property on CompareItem
      }
    } else if (result.type === "district" && result.district) {
      const state = result.state || (result.stateId ? getStateById(result.stateId) : null);
      if (state) {
        setRightItem({ type: "district", district: result.district, districtState: state });
      }
    } else if (result.stateId) {
      const state = getStateById(result.stateId);
      if (state) {
        setRightItem({ type: "state", state });
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header breadcrumbs={[{ label: "Compare", href: "/compare" }]} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-display mb-3 text-text-primary">Compare</h1>
          <p className="max-w-2xl text-lg text-text-tertiary">
            Select two states or cities to compare their geographic, demographic, and economic data side by side.
          </p>
        </motion.section>

        {/* Search Section */}
        <section className="mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-text-secondary">
                Item 1
              </label>
              <InlineSearch
                placeholder="Search for first state or city..."
                onSelect={handleLeftSelect}
                selectedState={leftState || undefined}
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-text-secondary">
                Item 2
              </label>
              <InlineSearch
                placeholder="Search for second state or city..."
                onSelect={handleRightSelect}
                selectedState={rightState || undefined}
              />
            </div>
          </div>
        </section>

        {/* Maps/Info Section */}
        {(leftItem || rightItem) && (
          <section className="mb-10">
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4"
              >
                {leftItem?.type === "state" && leftItem.state ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-text-primary">{leftItem.state.name}</h2>
                      <span className="rounded-full bg-accent-primary px-3 py-1 text-xs font-semibold text-white">
                        {leftItem.state.code}
                      </span>
                    </div>
                    <div className="card p-4" style={{ minHeight: "500px", overflow: "visible" }}>
                      <StateMap
                        stateCode={leftItem.state.id}
                        state={leftItem.state}
                        selectedDistrict={null}
                        onDistrictSelect={() => { }}
                        onDistrictClick={() => { }}
                      />
                    </div>
                  </>
                ) : (leftItem?.type === "city" && leftItem.city && leftState) || (leftItem?.type === "district" && leftItem.district && leftState) ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-text-primary">
                        {leftItem.type === "city" ? leftItem.city!.name : leftItem.district!.name}
                      </h2>
                      <span className="rounded-full bg-accent-secondary px-3 py-1 text-xs font-semibold text-white">
                        {leftItem.type === "city"
                          ? (leftItem.city!.tier === 1 ? "Metro" : `Tier ${leftItem.city!.tier}`)
                          : `Tier ${leftItem.district!.tier || 3}`}
                      </span>
                    </div>
                    <div className="card p-4" style={{ minHeight: "500px", overflow: "visible" }}>
                      <StateMap
                        stateCode={leftState.id}
                        state={leftState}
                        selectedDistrict={leftItem.type === "city" ? leftItem.city!.name : leftItem.district!.name}
                        onDistrictSelect={() => { }}
                        onDistrictClick={() => { }}
                      />
                    </div>
                    {leftItem.type === "city" ? (
                      <CityCard city={leftItem.city!} stateName={leftState.name} />
                    ) : (
                      <CityCard
                        city={{
                          ...leftItem.district!,
                          id: leftItem.district!.id || leftItem.district!.name,
                          districtId: leftItem.district!.id,
                          isCapital: !!leftItem.district!.isCapital,
                          isMetro: !!leftItem.district!.isMetro || leftItem.district!.tier === 1,
                          tier: (leftItem.district!.tier || 3) as any,
                        }}
                        stateName={leftState.name}
                      />
                    )}
                  </>
                ) : (
                  <div className="card p-4 flex items-center justify-center" style={{ minHeight: "500px" }}>
                    <p className="text-text-muted">Select a state, city, or district</p>
                  </div>
                )}
              </motion.div>

              <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-border-light -translate-x-1/2" />

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4"
              >
                {rightItem?.type === "state" && rightItem.state ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-text-primary">{rightItem.state.name}</h2>
                      <span className="rounded-full bg-accent-primary px-3 py-1 text-xs font-semibold text-white">
                        {rightItem.state.code}
                      </span>
                    </div>
                    <div className="card p-4" style={{ minHeight: "500px", overflow: "visible" }}>
                      <StateMap
                        stateCode={rightItem.state.id}
                        state={rightItem.state}
                        selectedDistrict={null}
                        onDistrictSelect={() => { }}
                        onDistrictClick={() => { }}
                      />
                    </div>
                  </>
                ) : (rightItem?.type === "city" && rightItem.city && rightState) || (rightItem?.type === "district" && rightItem.district && rightState) ? (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-text-primary">
                        {rightItem.type === "city" ? rightItem.city!.name : rightItem.district!.name}
                      </h2>
                      <span className="rounded-full bg-accent-secondary px-3 py-1 text-xs font-semibold text-white">
                        {rightItem.type === "city"
                          ? (rightItem.city!.tier === 1 ? "Metro" : `Tier ${rightItem.city!.tier}`)
                          : `Tier ${rightItem.district!.tier || 3}`}
                      </span>
                    </div>
                    <div className="card p-4" style={{ minHeight: "500px", overflow: "visible" }}>
                      <StateMap
                        stateCode={rightState.id}
                        state={rightState}
                        selectedDistrict={rightItem.type === "city" ? rightItem.city!.name : rightItem.district!.name}
                        onDistrictSelect={() => { }}
                        onDistrictClick={() => { }}
                      />
                    </div>
                    {rightItem.type === "city" ? (
                      <CityCard city={rightItem.city!} stateName={rightState.name} />
                    ) : (
                      <CityCard
                        city={{
                          ...rightItem.district!,
                          id: rightItem.district!.id || rightItem.district!.name,
                          districtId: rightItem.district!.id,
                          isCapital: !!rightItem.district!.isCapital,
                          isMetro: !!rightItem.district!.isMetro || rightItem.district!.tier === 1,
                          tier: (rightItem.district!.tier || 3) as any,
                        }}
                        stateName={rightState.name}
                      />
                    )}
                  </>
                ) : (
                  <div className="card p-4 flex items-center justify-center" style={{ minHeight: "500px" }}>
                    <p className="text-text-muted">Select a state, city, or district</p>
                  </div>
                )}
              </motion.div>
            </div>
          </section>
        )}

        {/* Comparison Data Section */}
        {leftItem && rightItem && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-text-primary">Comparison</h2>

            {/* Basic Stats */}
            <div className="card p-6">
              <h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Basic Statistics
              </h3>
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4 border-b border-border-light pb-4">
                  <div className="text-xs font-semibold text-text-muted">Metric</div>
                  <div className="text-center text-xs font-semibold text-accent-primary">
                    {leftName || "—"}
                  </div>
                  <div className="text-center text-xs font-semibold text-accent-primary">
                    {rightName || "—"}
                  </div>
                </div>

                {(() => {
                  const leftIsState = leftItem.type === "state";
                  const rightIsState = rightItem.type === "state";
                  const leftStateData = leftIsState ? leftItem.state : leftState;
                  const rightStateData = rightIsState ? rightItem.state : rightState;

                  const commonMetrics = [
                    {
                      label: "Population",
                      left: leftIsState
                        ? formatPopulation(leftItem.state!.population)
                        : (leftItem.type === "city" ? formatPopulation(leftItem.city!.population) : formatPopulation(leftItem.district!.population)),
                      right: rightIsState
                        ? formatPopulation(rightItem.state!.population)
                        : (rightItem.type === "city" ? formatPopulation(rightItem.city!.population) : formatPopulation(rightItem.district!.population))
                    },
                    {
                      label: "Area",
                      left: leftIsState
                        ? formatArea(leftItem.state!.area)
                        : (leftItem.type === "city" ? formatArea(leftItem.city!.area) : formatArea(leftItem.district!.area)),
                      right: rightIsState
                        ? formatArea(rightItem.state!.area)
                        : (rightItem.type === "city" ? formatArea(rightItem.city!.area) : formatArea(rightItem.district!.area))
                    },
                    {
                      label: "Density",
                      left: leftIsState
                        ? formatDensity(leftItem.state!.density)
                        : (leftItem.type === "city"
                          ? formatDensity(Math.round(leftItem.city!.population / leftItem.city!.area))
                          : formatDensity(leftItem.district!.density)),
                      right: rightIsState
                        ? formatDensity(rightItem.state!.density)
                        : (rightItem.type === "city"
                          ? formatDensity(Math.round(rightItem.city!.population / rightItem.city!.area))
                          : formatDensity(rightItem.district!.density))
                    },
                  ];

                  const stateOnlyMetrics = leftIsState && rightIsState ? [
                    { label: "Literacy Rate", left: `${leftItem.state!.literacyRate.toFixed(1)}%`, right: `${rightItem.state!.literacyRate.toFixed(1)}%` },
                    { label: "HDI", left: leftItem.state!.hdi.toFixed(3), right: rightItem.state!.hdi.toFixed(3) },
                    { label: "Sex Ratio", left: leftItem.state!.sexRatio.toString(), right: rightItem.state!.sexRatio.toString() },
                    { label: "GDP", left: formatCurrency(leftItem.state!.gdp * 10000000), right: formatCurrency(rightItem.state!.gdp * 10000000) },
                    { label: "Capital", left: leftItem.state!.capital, right: rightItem.state!.capital },
                    { label: "Region", left: leftItem.state!.region, right: rightItem.state!.region },
                    { label: "Major Cities", left: leftItem.state!.cities.length.toString(), right: rightItem.state!.cities.length.toString() },
                  ] : [];

                  const cityOnlyMetrics = (!leftIsState && !rightIsState) ? [
                    {
                      label: "Tier",
                      left: leftItem.type === "city"
                        ? (leftItem.city!.tier === 1 ? "Metro" : `Tier ${leftItem.city!.tier}`)
                        : (leftItem.district!.tier === 1 ? "Metro" : `Tier ${leftItem.district!.tier || 3}`),
                      right: rightItem.type === "city"
                        ? (rightItem.city!.tier === 1 ? "Metro" : `Tier ${rightItem.city!.tier}`)
                        : (rightItem.district!.tier === 1 ? "Metro" : `Tier ${rightItem.district!.tier || 3}`)
                    },
                    {
                      label: "Metro",
                    left: leftItem.type === "city"
                      ? (leftItem.city!.isMetro || leftItem.city!.tier === 1 ? "Yes" : "No")
                      : (leftItem.district!.isMetro || leftItem.district!.tier === 1 ? "Yes" : "No"),
                    right: rightItem.type === "city"
                      ? (rightItem.city!.isMetro || rightItem.city!.tier === 1 ? "Yes" : "No")
                      : (rightItem.district!.isMetro || rightItem.district!.tier === 1 ? "Yes" : "No")
                    },
                    {
                      label: "Capital",
                    left: leftItem.type === "city"
                      ? (leftItem.city!.isCapital ? "Yes" : "No")
                      : (leftItem.district!.isCapital ? "Yes" : "No"),
                    right: rightItem.type === "city"
                      ? (rightItem.city!.isCapital ? "Yes" : "No")
                      : (rightItem.district!.isCapital ? "Yes" : "No")
                    },
                    {
                      label: "State",
                      left: leftStateData?.name || "",
                      right: rightStateData?.name || ""
                    },
                    {
                      label: "Sex Ratio",
                      left: leftItem.type === "district" ? (leftItem.district!.sexRatio || "N/A") : "N/A",
                      right: rightItem.type === "district" ? (rightItem.district!.sexRatio || "N/A") : "N/A"
                    },
                    {
                      label: "Literacy",
                      left: leftItem.type === "district" ? `${leftItem.district!.literacyRate}%` : "N/A",
                      right: rightItem.type === "district" ? `${rightItem.district!.literacyRate}%` : "N/A"
                    }
                  ] : [];

                  return [...commonMetrics, ...stateOnlyMetrics, ...cityOnlyMetrics].map((item, index, arr) => (
                    <div
                      key={item.label}
                      className={`grid grid-cols-3 gap-4 items-center py-2 ${index !== arr.length - 1 ? 'border-b border-border-light/50' : ''}`}
                    >
                      <div className="text-sm font-medium text-text-secondary">{item.label}</div>
                      <div className="text-center font-mono text-base text-text-primary">
                        {item.left}
                      </div>
                      <div className="text-center font-mono text-base text-text-primary">
                        {item.right}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Top Cities Comparison - Only show if both are states */}
            {leftItem.type === "state" && rightItem.type === "state" && leftItem.state && rightItem.state && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="mb-4 text-sm font-semibold text-text-primary">
                    Top Cities - {leftItem.state.name}
                  </h3>
                  <div className="space-y-3">
                    {[...leftItem.state.cities]
                      .sort((a, b) => b.population - a.population)
                      .slice(0, 5)
                      .map((city) => (
                        <div key={city.id} className="flex items-center justify-between py-2 border-b border-border-light/50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{city.name}</p>
                            <p className="text-xs text-text-muted">{city.tier === 1 ? "Metro" : `Tier ${city.tier}`}</p>
                          </div>
                          <p className="text-sm font-mono text-text-secondary">
                            {formatPopulation(city.population)}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="mb-4 text-sm font-semibold text-text-primary">
                    Top Cities - {rightItem.state.name}
                  </h3>
                  <div className="space-y-3">
                    {[...rightItem.state.cities]
                      .sort((a, b) => b.population - a.population)
                      .slice(0, 5)
                      .map((city) => (
                        <div key={city.id} className="flex items-center justify-between py-2 border-b border-border-light/50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{city.name}</p>
                            <p className="text-xs text-text-muted">{city.tier === 1 ? "Metro" : `Tier ${city.tier}`}</p>
                          </div>
                          <p className="text-sm font-mono text-text-secondary">
                            {formatPopulation(city.population)}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </motion.section>
        )}
      </main>
    </div>
  );
}

