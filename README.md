# Housing Bubble Screener

An interactive 3D dashboard for a bachelor thesis at ASE Bucharest (FABIZ): **an early-warning screener for housing bubbles in EU countries and their exposure to interest-rate risk**, with Romania as the case study.

**Live site: https://alvinghindaoanu404-bit.github.io/housing-bubble-screener/**

> **Status: demo data.** The dashboard currently runs on generated demo data, and says so in a banner at the top of the page. None of the numbers are thesis results. The real results replace the demo files once the thesis analysis is done.

## What it does

The page has two parts.

**1. A scroll story.** Ten cards explain the thesis one step at a time. Behind them, a 3D map of the EU changes what it shows and flies to a new position for each step:

| # | Card | The map shows |
|---|---|---|
| 0 | Hero | The latest risk score of each country |
| 1 | The question | A mortgage payment calculator (the map is dimmed) |
| 2 | House prices | The real house price index, played through the years |
| 3 | Prices vs fundamentals | Overvaluation relative to rents and incomes |
| 4 | Bubble detection | Countries glowing during their bubble episodes, plus a timeline |
| 5 | Interest rates | Real interest rates |
| 6 | Early warning | The risk score, with the model's hits, misses and false alarms |
| 7 | Stress test | The risk score under a rate shock, with a live slider |
| 8 | Romania | Romania compared with the EU median |
| 9 | Explore | A button that unlocks the map |

**2. Explore mode.** The map unlocks: drag to move, scroll to zoom, right-drag to rotate and tilt. A layer switcher chooses what the map shows, a time slider moves through the quarters, and clicking a country opens a panel with its charts.

## Screenshots

_To be added: the hero, one story card, and explore mode with the side panel open._

## How to run it

You need [Node.js](https://nodejs.org) (LTS version) installed.

**The quick way (Windows, works offline).** Double-click `start-dashboard.bat`. It opens the dashboard in your browser. The first time, run `npm install` inside the `web` folder once, with internet.

**For development.** In a terminal:

```
cd web
npm install
npm run dev
```

Then open http://localhost:5173. The page updates by itself when a file is saved.

**To build the final site.**

```
cd web
npm run build
npm run preview
```

`npm run build` writes the finished site into `web/dist`. `npm run preview` serves that folder at http://localhost:4173.

The built site makes no internet requests: the map shapes, the data and the font are all inside it. It does need to be opened through a small local server (which is what `npm run preview` and the `.bat` file do). Opening `index.html` directly from the folder does not work, because browsers block pages opened that way from reading data files.

## The data

The dashboard only displays results. All calculations for the thesis happen in the pipeline (`pipeline/`), which writes the files in `web/public/data/`. The one exception is the mortgage calculator, which is an illustration and is labelled as such.

| File | Contents |
|---|---|
| `meta.json` | Data status (`demo` or `real`), base year, first and last quarter, sources |
| `countries.geojson` | Outlines of the 27 EU countries |
| `panel.json` | One row per country per quarter: real house price index, price-to-rent, price-to-income, overvaluation, interest rates, bubble flag, risk score |
| `episodes.json` | Bubble episodes found by the GSADF test |
| `stress.json` | Risk score under interest-rate shocks of -100, 0, +100, +200 and +300 basis points |
| `model_metrics.json` | Model quality on unseen data, with missed episodes and false alarms |

To regenerate the demo data (the output is identical on every run):

```
python pipeline/make_demo_data.py
```

### Sources

**Used now**

- Country outlines: Eurostat GISCO, Countries 2024, scale 1:20 million (`CNTR_RG_20M_2024_4326`). © EuroGeographics for the administrative boundaries. Overseas territories and far-away islands are left off the map so that it stays focused on Europe.
- Everything else: demo data from `pipeline/make_demo_data.py`.

**Planned for the real data (Eurostat)**

- House prices: quarterly house price index, `prc_hpi_q`.
- Rents and general prices: HICP, `prc_hicp_midx` (the rentals component for rents, the all-items index for deflating).
- Interest rates: to be confirmed. The candidate is the long-term interest rate series used for the convergence criterion.
- Income, for price-to-income: to be decided.
- Bubble test: GSADF, with the R package `psymonitor`.

## Project structure

```
pipeline/                 Python scripts that write the data files
  make_demo_data.py         generates the demo data
  make_countries_geojson.py builds the map file from the GISCO download
web/                      the dashboard
  public/data/              the data files listed above
  src/
    components/             the map, story cards, legend, sliders, side panel
    story/                  the story's text, camera positions and panels
    data/                   loading and describing the data files
start-dashboard.bat       one-click launcher (Windows)
CLAUDE.md                 the full project specification
```

## Built with

Vite, React and TypeScript · deck.gl for the 3D map · Recharts for the charts · Motion for animations · Tailwind CSS for styling · Inter as the font.
