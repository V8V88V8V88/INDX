# INDX — India Data Explorer

A modern, visual-first data visualization platform for exploring geographic and statistical data across India. Built with clean drill-downs from **Country → State → City**.

![INDX](https://img.shields.io/badge/status-Phase%201-teal)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan)

## Overview

INDX is a calm, analytical data platform designed for serious exploration. No clutter, no government-portal aesthetics—just clean data visualization with a professional engineering-grade design.

### Features

- **Interactive India Map** — Choropleth visualization with multiple metrics (Population, GDP, HDI, Literacy, Density)
- **State Drill-Down** — Click any state to explore detailed demographics, rankings, and city-level data
- **City Explorer** — View all major cities with tier classification, population, and geographic data
- **Comparative Analysis** — State vs National average comparisons
- **Ranked Lists** — Top states by various metrics with animated progress bars
- **Responsive Bento Layout** — Desktop-first design with mobile compatibility

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16 (App Router)** | Server-side rendering, routing, optimized builds |
| **TypeScript** | Type safety and developer experience |
| **Tailwind CSS 4** | Utility-first styling with CSS variables |
| **Framer Motion** | Smooth page transitions and micro-interactions |
| **D3.js** | Data-driven visualizations (available for extensions) |
| **Recharts** | Chart components (available for extensions) |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main India overview page
│   ├── state/[id]/page.tsx   # State detail page with city drill-down
│   ├── not-found.tsx         # 404 page
│   ├── layout.tsx            # Root layout with fonts
│   └── globals.css           # Design system tokens
├── components/
│   ├── Header.tsx            # Navigation with breadcrumbs
│   ├── IndiaMap.tsx          # Interactive SVG map
│   ├── MetricCard.tsx        # Summary statistic cards
│   ├── RankedList.tsx        # Ranked items with progress bars
│   ├── BarChart.tsx          # Horizontal bar visualization
│   ├── CityCard.tsx          # City information cards
│   ├── StateCard.tsx         # State preview cards
│   ├── StatComparison.tsx    # Side-by-side comparison table
│   └── MetricSelector.tsx    # Metric toggle buttons
├── data/
│   └── india.ts              # State and city datasets
└── types/
    └── index.ts              # TypeScript type definitions
```

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Design Philosophy

### Visual Direction
- **Minimal** — Generous whitespace, no visual clutter
- **Bento-style** — Card-based layouts with soft rounded corners
- **Muted palette** — Warm stone neutrals with teal accents
- **Strong typography** — Clear hierarchy with Inter font family
- **Subtle depth** — Light shadows and borders for layering

### Product Tone
- **Neutral & factual** — Data speaks for itself
- **Analytical** — Designed for understanding, not storytelling
- **Professional** — Engineering-grade, portfolio-worthy

## Data Coverage (Phase 1)

- **24 States & UTs** with full demographic data
- **85+ Cities** with tier classification
- Metrics: Population, GDP, HDI, Literacy Rate, Area, Density

## Roadmap

- [ ] Add more states and union territories
- [ ] Historical data comparison (year-over-year)
- [ ] Additional metrics (health, infrastructure, education)
- [ ] Export functionality (CSV, PDF reports)
- [ ] API layer with PostgreSQL + Prisma
- [ ] Multi-country support (Phase 2)

## License

MIT License — See [LICENSE](./LICENSE) for details.

---

Built as a serious data platform. Designed to impress.
