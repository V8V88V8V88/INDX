<div align="center">

<img src="public/logo.svg" alt="INDX" width="96">

# INDX

**India, mapped and indexed.**

Explore every state, union territory and district of India on an interactive map, with the numbers behind each one.

[![Live](https://img.shields.io/badge/Live-ind--x.vercel.app-000000?style=plastic&logo=vercel&logoColor=white)](https://ind-x.vercel.app)

[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=plastic&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-20232A?style=plastic&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=plastic&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MapLibre](https://img.shields.io/badge/MapLibre-396CB2?style=plastic&logo=maplibre&logoColor=white)](https://maplibre.org)
[![D3](https://img.shields.io/badge/D3.js-F9A03C?style=plastic&logo=d3dotjs&logoColor=white)](https://d3js.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=plastic&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Bun](https://img.shields.io/badge/Bun-000000?style=plastic&logo=bun&logoColor=white)](https://bun.sh)

[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue?style=plastic)](LICENSE)
[![Stars](https://img.shields.io/github/stars/V8V88V8V88/INDX?style=plastic)](https://github.com/V8V88V8V88/INDX/stargazers)

</div>

## What you can do

| | |
| --- | --- |
| **Map** | Color-coded map of India by any metric, down to district level |
| **States** | Each state's districts, cities and key numbers |
| **Compare** | Put states side by side, or against the national average |
| **Rankings** | Sort by population, GDP, literacy, HDI, density, sex ratio or area |
| **Search** | Jump to any state, district or city |

Covers all 28 states, 8 union territories and 733 districts.

## Data

India hasn't had a census since 2011, so population figures are official 2026 projections (RGI/MoHFW, with IIPS district projections). GDP comes from MoSPI, literacy from PLFS 2023-24. Sources and method are in [`scripts/data/README.md`](scripts/data/README.md).

## Run locally

```bash
bun install
bun run dev
```

Open http://localhost:3000. For a production build, run `bun run build` and then `bun start`.

## License

[AGPL-3.0](LICENSE) · Built by [Vaibhav Pratap Singh](https://v8v88v8v88.com/)
