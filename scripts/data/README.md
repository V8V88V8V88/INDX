# Data build

`build_data.py` regenerates `public/data/districts/*.json` and the population, density,
sex ratio, GSDP and `capitalDistrict` fields in `src/data/india.ts`. It reads only the files
in `sources/` and needs no API keys or network access.

```sh
bun run build:data            # rebuild
bun run build:data -- --check # validate only, write nothing
```

The build fails if:
- a state's district totals don't match its 2026 total,
- a map district has no data,
- a capital district is missing,
- a value is out of range.

## Why projections

India has had no census since 2011; Census 2027 enumeration runs from late 2026 into
early 2027, and its results come later. The latest official population figures are therefore the
RGI/MoHFW Technical Group projections, which the IIPS district projections below are controlled to.

## Sources

| File | What | Origin |
| --- | --- | --- |
| `iips-district-projections-2011-2031.json` | Male/female population for 640 districts (2011 boundaries), 2011 and 2026 | Table 8 of Dhar M. (2022), *Projection of district-level annual population by quinquennial age-group and sex from 2012 to 2031 in India*, IIPS Mumbai — <https://www.iipsindia.ac.in/sites/default/files/FULL_REPORT_WITH_FINAL_TABLES.pdf> (parsed with `pdftotext -layout`) |
| `wikipedia/districts-{AP,TG,UP}.wikitext` | 2011 census population/area on current district boundaries | `https://en.wikipedia.org/w/index.php?title=List_of_districts_of_<State>&action=raw` |
| `wikipedia/state-gdp.wikitext` | GSDP at current prices (MoSPI), ₹ billion | `List_of_Indian_states_and_union_territories_by_GDP`, same URL pattern |
| `legacy-districts/` | The district files before this build: 2011 literacy, headquarters, tiers, census areas, and the 2011 size of districts created after 2011 | git history |

State literacy (PLFS 2023-24), area and HDI in `india.ts` are not touched by the build.

## Method

- The district list is exactly the set drawn in `public/geo/states/<STATE>.json`.
- Districts unchanged since 2011 take their IIPS 2026 population and sex ratio directly.
- Districts split after 2011 form a group with their parent. The parent's 2026 projection is
  shared out by each member's 2011 population on current boundaries, so nothing is counted twice.
  The configuration lives in `CONFIG` in the script.
- Unchanged districts keep their census area. Split districts share the remaining state area
  by map area (or by Wikipedia area where available).
- IIPS extrapolated a few tiny UTs exponentially (Daman, Diu, Dadra & Nagar Haveli). Where a
  projected sex ratio drifts more than 15% from 2011, the build uses the 2011 census × the
  national growth factor instead and prints a note.
- District literacy is the 2011 census value. No newer district-level figure exists.
