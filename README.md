# INDX — India Data Explorer

A comprehensive data visualization platform for exploring India's geographic and statistical data. Built with Next.js, React, and D3.js.

## 🌟 Features

### Interactive Maps
- **India Map**: Interactive choropleth map of all 28 states and 8 union territories
- **State Maps**: Detailed district-level maps for each state
- **Dynamic Metrics**: Visualize data by Population, GDP, Literacy Rate, HDI, Density, Sex Ratio, and Area
- **Color-coded Legends**: Synchronized color scales matching map visualizations
- **Zoom & Pan**: Fullscreen mode with zoom controls for detailed exploration

### State & District Pages
- **State Details**: Comprehensive statistics, rankings, and comparisons
- **District Information**: Detailed district-level data with interactive maps
- **City Data**: Information about major cities within each state
- **Comparative Analysis**: State metrics compared against national averages
- **Bar Charts**: Visual representation of city populations and other metrics

### Search & Navigation
- **Spotlight Search**: Apple Spotlight-style search (Cmd+K / Ctrl+K) for quick navigation
- **Fuzzy Search**: Search by state codes (e.g., "UP" for Uttar Pradesh, "MP" for Madhya Pradesh)
- **Multi-type Search**: Search across states, cities, and districts simultaneously
- **Keyboard Navigation**: Full keyboard support with arrow keys and Enter
- **Smart Highlighting**: Auto-highlight and scroll to selected locations on maps

### Data Visualization
- **Metric Cards**: Key indicators with rankings and trends
- **Ranked Lists**: Sortable lists of states by various metrics
- **Bar Charts**: Population and metric comparisons
- **Statistical Comparisons**: State vs National averages

### UI/UX Features
- **Dark Mode**: Theme toggle with multiple accent colors
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Smooth Animations**: Framer Motion powered transitions
- **Accessible**: Keyboard navigation and ARIA labels

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS
- **Maps**: D3.js (geoMercator, geoPath)
- **Animations**: Framer Motion
- **Data Fetching**: TanStack Query (React Query)
- **State Management**: React Hooks (useState, useEffect, useMemo)
- **Language**: TypeScript
- **Package Manager**: Bun

## 📦 Installation

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `bun install`
3. Run the development server: `bun run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Home page with India map
│   ├── state/[id]/        # State detail pages
│   └── settings/          # Settings page
├── components/            # React components
│   ├── IndiaMap.tsx       # Interactive India map
│   ├── StateMap.tsx       # State district maps
│   ├── Spotlight.tsx      # Search functionality
│   ├── DistrictList.tsx   # District/city listings
│   ├── MetricCard.tsx     # Metric display cards
│   └── ...
├── data/                  # Static data files
│   └── india.ts          # State, city, and country data
├── hooks/                 # Custom React hooks
│   ├── useDistricts.ts   # District data fetching
│   └── useFormat.ts      # Number formatting utilities
├── lib/                   # Utility libraries
│   ├── api.ts            # API functions
│   └── query-provider.tsx # React Query setup
└── types/                 # TypeScript type definitions
```

## 🎨 Features in Detail

### Interactive Maps
- Click on states to navigate to state detail pages
- Hover to see tooltips with state data and country averages
- Switch between different metrics (Population, GDP, Literacy, HDI, etc.)
- State names displayed with text shadows for visibility
- Fullscreen mode for detailed exploration

### State Pages
- Key metrics: Population, GDP, Literacy Rate, HDI
- Interactive district maps with hover and click effects
- District information cards with detailed statistics
- City listings with filtering and sorting
- Comparative charts and visualizations
- Click on capital name to highlight district on map

### Search (Spotlight)
- **Keyboard Shortcut**: `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
- **Search Icon**: Click the search icon in the header
- **Search Types**:
  - States (full name or code: UP, MP, etc.)
  - Cities (with state context)
  - Districts (with state context)
- **Features**:
  - Real-time search as you type
  - Keyboard navigation (↑↓ arrows, Enter to select)
  - Auto-highlight and scroll to selected location
  - Works across all pages

### Settings
- Theme customization (accent colors)
- Visual preferences
- Application behavior settings

## 📊 Data Sources

- Census of India 2011
- RBI estimates
- NITI Aayog projections
- 2026 projected data

## 🎯 Current Status

### ✅ Implemented
- Home page with interactive India map
- State detail pages with district maps
- District and city data visualization
- Spotlight search functionality
- Dark mode and theme customization
- Responsive design
- Keyboard navigation
- Hash fragment routing for deep links

### 🔄 Data Coverage
- All 28 states and 8 union territories
- Major cities with tier classification
- District-level data (via API)
- Population, GDP, Literacy, HDI metrics
- Geographic boundaries (GeoJSON)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is built for data visualization and exploration.

## 👨‍💻 Author

Made with ❤️ by [Vaibhav](https://v8v88v8v88.com/)

---

**Note**: This is a data visualization platform built for analytical exploration of India's geographic and statistical data.
