# CLAUDE.md — Housing Bubble Screener Dashboard

Instructions for Claude Code. Read this file fully before doing anything in this repository.

## 1. What this project is

This is the coded part of Alvin's bachelor thesis at ASE (FABIZ): **an early-warning screener for housing bubbles in EU countries and their exposure to interest-rate risk**, with Romania as the case study. Thesis deadline: May 2027.

The deliverable is an **interactive 3D web dashboard**:
- The first part is a **scroll story**. As the user scrolls, the 3D map of Europe moves (camera flies, tilts, zooms) and each section explains one step of the thesis and what is calculated in it.
- After the story, the map **unlocks for free exploration**. The user can rotate, zoom, click any country and see all its data.
- The site must feel alive: animated buttons, smooth transitions, extruded 3D countries that grow or shrink when the data changes.

It will be used in three places, and every decision must work for all three:
1. **Thesis defense**: shown live from a laptop. It must work **fully offline**.
2. **Shared online link**: hosted as a free static site (GitHub Pages or Vercel).
3. **Portfolio** for a master's application: needs a polished landing section and a clear README.

## 2. Who you are working with

Alvin is a **beginner** in coding, especially web development. You must work in **teaching mode**:
- Work on **one milestone at a time** (section 9). Never jump ahead.
- Before each step, say in 1–3 plain sentences **what** you are about to do and **why**.
- Give the **exact command** to type, and say what the expected result looks like.
- After each change, tell him **how to see it**, for example: "run `npm run dev`, then open http://localhost:5173".
- Explain any new concept (component, state, props, JSON, build) in one simple sentence the first time it appears.
- **Ask before** installing anything big, deleting files, or changing the folder structure.
- After each working milestone, make a git commit with a clear message, and explain what a commit is the first time.
- If something breaks, explain the error in plain words before fixing it.

## 3. Golden rules (never break these)

1. **No invented numbers.** Every number shown on screen must come from a file in `web/public/data/`. Never hard-code values in components.
2. **Demo data must be labelled.** Until the real thesis data exists, the dashboard runs on generated demo data, and a visible banner says **"DEMO DATA — not thesis results"**. The banner is driven by `meta.json → data_status`.
3. **The data contract (section 5) is fixed.** If a change to it seems needed, stop and ask Alvin first, because the thesis code must produce exactly these files.
4. **The dashboard displays results; it never calculates thesis results itself.** Bubble tests, models and stress tests run in the Python/R pipeline (`pipeline/`). The web app only reads their outputs. The only allowed in-browser calculation is the illustrative mortgage payment calculator in the story.
5. **Offline-first.** No map tiles from the internet, no CDN fonts, no external API calls at runtime. Everything ships inside the build.
6. **Every chart and panel shows its source** (for example "Source: Eurostat prc_hpi_q") and the quarter the data refers to.

## 4. Tech stack

| Part | Choice | Why |
|---|---|---|
| Build tool | Vite | Fast, simple, builds to static files |
| UI | React + TypeScript | Types catch mistakes early; explain types simply |
| 3D map | deck.gl (`@deck.gl/react`, `@deck.gl/layers`) with an extruded `GeoJsonLayer` | Smooth 3D extrusion and camera transitions |
| Base map | **None.** Country shapes from a local GeoJSON file on a dark background | Works offline, needs no API key |
| Animations | `motion` (Framer Motion) | Button effects, panel and text animations |
| Scroll story | `IntersectionObserver` (or the `scrollama` package) | Detects which story section is on screen |
| Charts | Recharts | Simple line and bar charts in panels |
| Styling | Tailwind CSS | Fast, consistent styling |
| Font | Inter via `@fontsource/inter` (self-hosted) | No internet needed |
| Data pipeline | Python (pandas, `eurostat` package), with R `psymonitor` for the bubble test | Built later, in the thesis phases |

Do not add other major libraries without asking.

## 5. Data contract

All files live in `web/public/data/`. The pipeline writes them; the web app only reads them. Country codes are Eurostat codes (note: Greece = `EL`, not `GR`). Quarters are strings like `"2025-Q3"`.

**`meta.json`**
```json
{
  "data_status": "demo",
  "generated_at": "2026-11-15",
  "base_year": 2015,
  "first_quarter": "2009-Q1",
  "last_quarter": "2026-Q2",
  "sources": [{ "name": "Eurostat — House price index", "code": "prc_hpi_q" }]
}
```
`data_status` is `"demo"` or `"real"`.

**`countries.geojson`**: EU-27 country outlines (Eurostat GISCO, country level), simplified so the file is small. Each feature has `properties.geo` (the country code) and `properties.name`.

**`panel.json`**: one row per country per quarter.
```json
[{
  "geo": "RO", "quarter": "2025-Q3",
  "hpi_real": 128.4,
  "price_to_rent": 1.12,
  "price_to_income": 1.05,
  "overvaluation_z": 0.8,
  "rate_nominal": 6.4,
  "rate_real": 1.1,
  "in_bubble": false,
  "risk_score": 0.34
}]
```
- `price_to_rent` and `price_to_income` are indices relative to the long-run average (1.0 = average).
- `overvaluation_z` is how many standard deviations the valuation is above its own average.
- `risk_score` is the model's probability (0–1).
- Any value may be `null` when data is missing. The UI must handle `null` gracefully (grey country plus a "no data" tooltip).

**`episodes.json`**: bubble periods found by the GSADF test.
```json
[{ "geo": "ES", "start": "2004-Q1", "end": "2007-Q4", "series": "price_to_rent" }]
```

**`stress.json`**: risk score under interest-rate shocks.
```json
[{ "geo": "RO", "shock_bp": 200, "risk_score": 0.52 }]
```
`shock_bp` is one of `-100, 0, 100, 200, 300`.

**`model_metrics.json`**
```json
{
  "train_end": "2016-Q4", "test_start": "2017-Q1",
  "auroc": 0.78, "hit_rate": 0.70, "false_alarm_rate": 0.22,
  "missed": [{ "geo": "NL", "start": "2019-Q2" }],
  "false_alarms": [{ "geo": "PL", "quarter": "2018-Q3" }]
}
```

**Demo data generator**: create `pipeline/make_demo_data.py`. It writes all files above with plausible but clearly fake values and `data_status: "demo"`. Seed the random generator so the output is the same every time.

## 6. The scroll story (sections and camera)

Each section is a text card on one side of the screen while the 3D map stays fixed in the background. When a section enters the screen, the camera flies (1.5–2 s) and the map layer changes. Each card explains in plain language **what is calculated in the thesis at this step**.

| # | Section | Map shows | Camera | Card content |
|---|---|---|---|---|
| 0 | Hero | All of Europe, slow auto-rotation, height = latest `risk_score` | High, tilted 45° | Title, one-line pitch, animated "Start the story" button, demo banner if needed |
| 1 | The question | Map dimmed | Same | Why interest rates and house prices are linked. Mini calculator: loan amount + rate slider → monthly payment (example: €100,000, 25 years, 2% ≈ €424 vs 5% ≈ €585) |
| 2 | House prices | Height + colour = `hpi_real`; the time slider auto-plays through the quarters | Europe, medium tilt | What the HPI is, nominal vs real prices |
| 3 | Prices vs fundamentals | Colour = `overvaluation_z` (blue → red) | Same | Price-to-rent and price-to-income explained (the "P/E ratio of houses") |
| 4 | Bubble detection | Countries pulse (glow) during their `episodes`; a timeline strip shows episodes as shaded bars | Flies to Spain/Ireland as an example, then back | What the GSADF test does (the "snowball" analogy), how episodes are dated |
| 5 | Interest rates | Height = `rate_real` | Europe | Real vs nominal rates, the 2022–23 rate shock |
| 6 | Early warning | Height = `risk_score` | Europe | What the model predicts and how well. Show `model_metrics` honestly, including misses and false alarms |
| 7 | Stress test | Height = `stress.risk_score`; slider from −100 to +300 bp re-extrudes the map live | Europe | Which markets are most exposed to a rate rise |
| 8 | Romania | Romania highlighted, the rest dimmed | Flies close to Romania | Case study: Romania's ratios vs the EU, risk score, stress result, data limits |
| 9 | Explore | Full free map | User-controlled | "Now explore" message. The map unlocks |

**Explore mode (section 9):**
- Drag to rotate, scroll or pinch to zoom, right-drag to tilt.
- A layer switcher: Real prices · Overvaluation · Interest rates · Risk score · Stress test.
- A time slider with play/pause.
- Clicking a country opens a side panel with: name, latest values, a price-to-rent line chart with bubble episodes shaded, a rate chart, the risk score gauge and the stress results.
- Hovering a country shows a tooltip.
- A "Back to story" button.

## 7. Design and animation spec

**Look**
- Dark theme. Background `#0B1020`, cards `#121A2E` with a subtle 1px border `#24304D`, text `#E6EAF2`, secondary text `#8B95AD`.
- One accent colour, `#4F8CFF`, for buttons and highlights.
- Risk colour ramp (low → high): `#2D6CDF` → `#3FB8AF` → `#F2C14E` → `#F2784B` → `#E0414B`.
- Font: Inter. Big, bold section titles; 16px body text.
- 8px spacing grid, 12px rounded corners.
- Always show a small legend for the active map layer.

**Animations**
- Buttons: on hover, scale to 1.04 with a soft accent glow; on press, scale to 0.97; duration 150–200 ms.
- Story cards: fade and slide up when entering.
- Country extrusion: when values change, heights animate over about 800 ms (deck.gl `transitions`).
- Camera: `FlyToInterpolator`, 1.5–2 s, eased.
- Countries in a bubble episode: a gentle pulsing glow.
- Side panel: slides in from the right.
- Respect `prefers-reduced-motion`: when the user's system asks for reduced motion, turn off the pulsing and auto-rotation and shorten the transitions.

**Quality**
- Keyboard accessible: buttons and sliders reachable with Tab, visible focus ring.
- Works on a laptop screen first (the defense). Phone: the story still reads, and explore mode can be simplified.
- Target 60 fps on a normal laptop. Keep the GeoJSON simplified.

## 8. Folder structure

```
/
├── CLAUDE.md
├── README.md
├── pipeline/                 # Python/R thesis code (later phases)
│   ├── make_demo_data.py
│   └── ...
└── web/
    ├── public/data/          # the data contract files (section 5)
    ├── src/
    │   ├── components/       # Map3D, StoryCard, SidePanel, Legend, TimeSlider, Button...
    │   ├── story/            # one file per story section + camera settings
    │   ├── data/             # loading and typing the JSON files
    │   ├── styles/
    │   └── App.tsx
    └── package.json
```

## 9. Build plan — milestones (do them in order)

Start each milestone by restating its goal; end it by showing Alvin how to view the result and making a commit.

- **M0 — Setup.** Check that Node.js (LTS) and git are installed. Create the Vite + React + TypeScript app in `web/`, add Tailwind, initialise git. Result: a blank page running locally.
- **M1 — Demo data.** Write `pipeline/make_demo_data.py`, generate all data files, add the simplified EU GeoJSON. Write TypeScript types matching section 5 and a loader. Result: the data loads (shown in a simple debug list).
- **M2 — 3D map.** Extruded EU countries with the risk colour ramp, hover tooltips, drag/zoom/tilt, legend. Result: a movable 3D Europe.
- **M3 — Scroll story skeleton.** All 10 sections as cards; scrolling switches layers and flies the camera. Text can be placeholder at first.
- **M4 — Story content and panels.** Real explanatory text from section 6, the mortgage calculator, the episodes timeline, the model metrics card.
- **M5 — Explore mode.** Layer switcher, time slider with play/pause, side panel with charts, "Back to story".
- **M6 — Stress test slider.** Live re-extrusion from `stress.json`.
- **M7 — Animation and polish.** Button effects, card entrances, pulsing episodes, reduced-motion support, loading screen, demo banner.
- **M8 — Offline check and deployment.** `npm run build`, test the built site with Wi-Fi turned off, deploy to GitHub Pages or Vercel, and write the README (what it is, screenshots, how to run, data sources).
- **M9 — Real data swap (after the thesis analysis is done).** The pipeline writes the real files with `data_status: "real"`. Check that everything still renders, the demo banner disappears, and the numbers match the thesis tables.

## 10. Thesis data notes (for the pipeline later)

- The coordinator requires **Eurostat** data.
- House prices: `prc_hpi_q` (quarterly HPI). Eurostat rescaled the HPI and rent indices to base 2025 in July 2026, with the 2015-base data still available. Use one base consistently and record it in `meta.json`.
- Rents and general prices: HICP (`prc_hicp_midx`), with the rentals component for rents and the all-items index for deflating.
- Interest rates: the exact Eurostat series is still to be confirmed with the coordinator. The candidate is the long-term interest rates (convergence criterion) series. Verify the dataset code before using it.
- Income for price-to-income: the dataset is still to be decided.
- The bubble test (GSADF) uses the R package `psymonitor`.
- Do not start the real pipeline until Alvin says the thesis analysis phase has begun.
