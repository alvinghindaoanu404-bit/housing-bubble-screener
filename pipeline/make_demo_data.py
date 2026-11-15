"""Generate DEMO data for the Housing Bubble Screener dashboard.

Every number written by this script is FAKE. The values are only shaped to
look plausible, so the dashboard can be built before the real thesis results
exist. The files are marked with data_status = "demo", which makes the
dashboard show its "DEMO DATA" banner.

Run it from the project folder with:
    python pipeline/make_demo_data.py

It writes the files described in CLAUDE.md section 5 into web/public/data/.
It does NOT write countries.geojson (the map shapes are real, not generated).
"""

import json
import math
import random
from pathlib import Path

# A fixed seed makes the "random" numbers identical on every run.
SEED = 2027
OUT_DIR = Path(__file__).resolve().parent.parent / "web" / "public" / "data"

FIRST_YEAR, LAST_YEAR, LAST_QUARTER_OF_LAST_YEAR = 2009, 2026, 2
BASE_YEAR = 2015
TRAIN_END, TEST_START = "2016-Q4", "2017-Q1"
SHOCKS_BP = [-100, 0, 100, 200, 300]

# EU-27, Eurostat codes (Greece is EL, not GR).
COUNTRIES = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "EL",
    "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
    "SI", "ES", "SE",
]

# Extra interest (percentage points) some countries pay above the common level.
RATE_SPREAD = {"RO": 3.5, "HU": 3.0, "PL": 2.5, "CZ": 1.2, "BG": 1.0,
               "HR": 1.0, "EL": 1.5, "SE": 0.3, "DK": 0.1}

# Countries whose first two years are left empty, to test "no data" handling.
MISSING_EARLY = {"MT": 8, "CY": 8}

# Made-up yearly paths: a common interest rate and a common inflation rate.
COMMON_RATE = {2009: 3.8, 2010: 3.5, 2011: 4.2, 2012: 3.6, 2013: 2.9, 2014: 2.0,
               2015: 1.2, 2016: 0.9, 2017: 1.1, 2018: 1.1, 2019: 0.4, 2020: 0.1,
               2021: 0.2, 2022: 2.0, 2023: 3.3, 2024: 3.0, 2025: 3.0, 2026: 3.1,
               2027: 3.1}
COMMON_INFLATION = {2009: 0.5, 2010: 1.6, 2011: 2.7, 2012: 2.5, 2013: 1.4,
                    2014: 0.4, 2015: 0.1, 2016: 0.2, 2017: 1.5, 2018: 1.8,
                    2019: 1.2, 2020: 0.3, 2021: 2.6, 2022: 8.4, 2023: 5.4,
                    2024: 2.4, 2025: 2.2, 2026: 2.1, 2027: 2.1}


def make_quarters():
    """Return the list of quarters as (year, quarter number, "2025-Q3" label)."""
    quarters = []
    for year in range(FIRST_YEAR, LAST_YEAR + 1):
        for q in range(1, 5):
            if year == LAST_YEAR and q > LAST_QUARTER_OF_LAST_YEAR:
                break
            quarters.append((year, q, f"{year}-Q{q}"))
    return quarters


def yearly_path(path, year, q):
    """Slide smoothly from this year's value towards next year's value."""
    step = (q - 1) / 4
    return path[year] * (1 - step) + path[year + 1] * step


def logistic(x):
    """Squash any number into the range 0..1 (used for probabilities)."""
    return 1 / (1 + math.exp(-x))


def mean(values):
    return sum(values) / len(values)


def std(values):
    m = mean(values)
    return math.sqrt(mean([(v - m) ** 2 for v in values]))


def find_runs(flags, min_length):
    """Find stretches of True values that last at least min_length quarters."""
    runs, start = [], None
    for i, flag in enumerate(flags + [False]):
        if flag and start is None:
            start = i
        elif not flag and start is not None:
            if i - start >= min_length:
                runs.append((start, i - 1))
            start = None
    return runs


def make_country(rng, geo, quarters, boom_countries):
    """Build all the quarterly series for one country."""
    n = len(quarters)

    # --- House prices: a slow trend + a gentle cycle + (maybe) one boom. ---
    trend = rng.uniform(0.002, 0.009)          # growth per quarter
    cycle_size = rng.uniform(0.03, 0.08)
    cycle_length = rng.uniform(36, 60)         # in quarters
    cycle_shift = rng.uniform(0, cycle_length)
    has_boom = geo in boom_countries
    boom_size = rng.uniform(0.18, 0.32)
    boom_centre = rng.uniform(8, n - 6)
    boom_width = rng.uniform(4, 7)

    gap, noise = [], 0.0   # gap = how far prices are from their slow trend
    for t in range(n):
        noise = 0.7 * noise + rng.gauss(0, 0.008)
        value = cycle_size * math.sin(2 * math.pi * (t + cycle_shift) / cycle_length)
        if has_boom:
            value += boom_size * math.exp(-((t - boom_centre) / boom_width) ** 2)
        gap.append(value + noise)

    hpi = [math.exp(trend * t + gap[t]) for t in range(n)]
    base = mean([hpi[t] for t in range(n) if quarters[t][0] == BASE_YEAR])
    hpi = [100 * v / base for v in hpi]       # so that the base year = 100

    # --- Valuation ratios, relative to their own average (1.0 = average). ---
    rent_noise = [rng.gauss(0, 0.01) for _ in range(n)]
    income_noise = [rng.gauss(0, 0.015) for _ in range(n)]
    ptr = [math.exp(gap[t] + rent_noise[t]) for t in range(n)]
    pti = [math.exp(0.8 * gap[t] + income_noise[t]) for t in range(n)]
    ptr = [v / mean(ptr) for v in ptr]
    pti = [v / mean(pti) for v in pti]

    # --- Overvaluation: distance from the average, in standard deviations. ---
    combined = [(ptr[t] + pti[t]) / 2 for t in range(n)]
    z = [(v - mean(combined)) / std(combined) for v in combined]

    # --- Bubble episodes: overvaluation stays high for a year or more. ---
    episodes = find_runs([v > 1.3 for v in z], min_length=4)
    in_bubble = [any(a <= t <= b for a, b in episodes) for t in range(n)]

    # --- Interest rates. ---
    spread = RATE_SPREAD.get(geo, rng.uniform(-0.2, 0.6))
    inflation_extra = rng.uniform(-0.3, 0.8) + (1.5 if spread > 2 else 0)
    rate_nominal, rate_real = [], []
    for t, (year, q, _) in enumerate(quarters):
        nominal = yearly_path(COMMON_RATE, year, q) + spread + rng.gauss(0, 0.12)
        if geo == "EL" and 2011 <= year <= 2012:
            nominal += 9.0                     # made-up debt-crisis spike
        inflation = yearly_path(COMMON_INFLATION, year, q) + inflation_extra
        rate_nominal.append(nominal)
        rate_real.append(nominal - inflation + rng.gauss(0, 0.1))

    # --- Risk score: a made-up probability, NOT a real model. ---
    risk = []
    for t in range(n):
        growth = math.log(hpi[t] / hpi[t - 4]) if t >= 4 else 0.0
        risk.append(logistic(-1.6 + 1.1 * z[t] + 6 * growth - 0.12 * rate_real[t]))

    rows = []
    for t, (_, _, label) in enumerate(quarters):
        if t < MISSING_EARLY.get(geo, 0):
            rows.append({"geo": geo, "quarter": label, "hpi_real": None,
                         "price_to_rent": None, "price_to_income": None,
                         "overvaluation_z": None, "rate_nominal": None,
                         "rate_real": None, "in_bubble": None, "risk_score": None})
            continue
        rows.append({
            "geo": geo, "quarter": label,
            "hpi_real": round(hpi[t], 1),
            "price_to_rent": round(ptr[t], 2),
            "price_to_income": round(pti[t], 2),
            "overvaluation_z": round(z[t], 2),
            "rate_nominal": round(rate_nominal[t], 2),
            "rate_real": round(rate_real[t], 2),
            "in_bubble": in_bubble[t],
            "risk_score": round(risk[t], 2),
        })

    first_ok = MISSING_EARLY.get(geo, 0)
    episode_rows = [
        {"geo": geo, "start": quarters[max(a, first_ok)][2],
         "end": quarters[b][2], "series": "price_to_rent"}
        for a, b in episodes if b >= first_ok
    ]
    return rows, episode_rows


def make_stress(rng, panel):
    """Risk score under each interest-rate shock, starting from the latest quarter."""
    stress = []
    for geo in COUNTRIES:
        latest = [r for r in panel if r["geo"] == geo][-1]["risk_score"]
        latest = min(max(latest, 0.01), 0.99)
        sensitivity = rng.uniform(0.15, 0.6)   # how much a +100 bp shock hurts
        base_logit = math.log(latest / (1 - latest))
        for shock in SHOCKS_BP:
            score = logistic(base_logit + sensitivity * shock / 100)
            stress.append({"geo": geo, "shock_bp": shock, "risk_score": round(score, 2)})
    return stress


def make_model_metrics(rng, panel, episodes):
    """Made-up model quality numbers, with examples of misses and false alarms."""
    late_episodes = [e for e in episodes if e["start"] >= TEST_START]
    missed = rng.sample(late_episodes, k=min(2, len(late_episodes)))
    calm_rows = [r for r in panel
                 if r["quarter"] >= TEST_START and r["in_bubble"] is False]
    false_alarms = rng.sample(calm_rows, k=3)
    return {
        "train_end": TRAIN_END, "test_start": TEST_START,
        "auroc": round(rng.uniform(0.72, 0.82), 2),
        "hit_rate": round(rng.uniform(0.62, 0.75), 2),
        "false_alarm_rate": round(rng.uniform(0.18, 0.28), 2),
        "missed": [{"geo": e["geo"], "start": e["start"]} for e in missed],
        "false_alarms": sorted(
            ({"geo": r["geo"], "quarter": r["quarter"]} for r in false_alarms),
            key=lambda item: item["quarter"]),
    }


def write_json(name, data):
    path = OUT_DIR / name
    path.write_text(json.dumps(data, indent=1) + "\n", encoding="utf-8")
    print(f"  wrote {name}")


def main():
    rng = random.Random(SEED)
    quarters = make_quarters()
    boom_countries = set(rng.sample(COUNTRIES, k=11))

    panel, episodes = [], []
    for geo in COUNTRIES:
        rows, episode_rows = make_country(rng, geo, quarters, boom_countries)
        panel.extend(rows)
        episodes.extend(episode_rows)

    meta = {
        "data_status": "demo",
        "generated_at": "2026-11-15",   # fixed, so every run gives identical files
        "base_year": BASE_YEAR,
        "first_quarter": quarters[0][2],
        "last_quarter": quarters[-1][2],
        "sources": [
            {"name": "DEMO — generated by pipeline/make_demo_data.py", "code": "demo"},
            {"name": "Eurostat GISCO — Countries 2024, 1:20M (map shapes)",
             "code": "CNTR_RG_20M_2024_4326"},
        ],
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Writing demo data to {OUT_DIR}")
    write_json("meta.json", meta)
    write_json("panel.json", panel)
    write_json("episodes.json", episodes)
    write_json("stress.json", make_stress(rng, panel))
    write_json("model_metrics.json", make_model_metrics(rng, panel, episodes))
    print(f"Done: {len(COUNTRIES)} countries x {len(quarters)} quarters = "
          f"{len(panel)} panel rows, {len(episodes)} bubble episodes.")


if __name__ == "__main__":
    main()
