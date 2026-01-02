"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { State } from "@/types";
import { formatPopulation } from "@/data/india";

interface StateCardProps {
  state: State;
  delay?: number;
}

export function StateCard({ state, delay = 0 }: StateCardProps) {
  return (
    <Link href={`/state/${state.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        whileHover={{ y: -4 }}
        className="card card-interactive p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-md bg-bg-secondary px-2 py-1 text-xs font-medium text-text-muted">
            {state.region}
          </span>
          <span className="text-xs font-mono text-text-muted">{state.code}</span>
        </div>
        
        <h3 className="mb-1 text-lg font-semibold text-text-primary">
          {state.name}
        </h3>
        <p className="mb-4 text-sm text-text-tertiary">
          Capital: {state.capital}
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-text-muted">Population</p>
            <p className="font-medium text-text-secondary">
              {formatPopulation(state.population)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Literacy</p>
            <p className="font-medium text-text-secondary">
              {state.literacyRate}%
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">HDI</p>
            <p className="font-medium text-text-secondary">
              {state.hdi.toFixed(3)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Cities</p>
            <p className="font-medium text-text-secondary">
              {state.cities.length}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

