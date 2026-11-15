"""Build web/public/data/countries.geojson from the Eurostat GISCO countries file.

Input: CNTR_RG_20M_2024_4326.geojson (all world countries, 1:20 million), from
https://gisco-services.ec.europa.eu/distribution/v2/countries/geojson/

Run it from the project folder with the path of the downloaded file:
    python pipeline/make_countries_geojson.py path/to/CNTR_RG_20M_2024_4326.geojson

What it does:
  1. keeps only the EU-27 countries;
  2. drops far-away pieces (French Guiana, Canary Islands, Azores...) so the
     map stays focused on Europe;
  3. rounds coordinates to 3 decimals (about 100 m) to keep the file small;
  4. renames the fields to "geo" and "name", as the data contract requires.
"""

import json
import sys
from pathlib import Path

OUT_FILE = (Path(__file__).resolve().parent.parent
            / "web" / "public" / "data" / "countries.geojson")

EU27 = {
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "EL",
    "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
    "SI", "ES", "SE",
}

# The "Europe box": west, south, east, north (degrees of longitude / latitude).
WEST, SOUTH, EAST, NORTH = -11.5, 34.0, 35.0, 72.0


def in_europe(polygon):
    """True if the middle of the polygon lies inside the Europe box."""
    outer_ring = polygon[0]
    lons = [point[0] for point in outer_ring]
    lats = [point[1] for point in outer_ring]
    lon = (min(lons) + max(lons)) / 2
    lat = (min(lats) + max(lats)) / 2
    return WEST <= lon <= EAST and SOUTH <= lat <= NORTH


def round_polygon(polygon):
    return [[[round(x, 3), round(y, 3)] for x, y, *_ in ring] for ring in polygon]


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    source = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))

    features = []
    for feature in source["features"]:
        props = feature["properties"]
        geo = props["CNTR_ID"]
        if geo not in EU27:
            continue
        geometry = feature["geometry"]
        # A Polygon is one shape; a MultiPolygon is a list of shapes (islands).
        polygons = (geometry["coordinates"] if geometry["type"] == "MultiPolygon"
                    else [geometry["coordinates"]])
        kept = [round_polygon(p) for p in polygons if in_europe(p)]
        features.append({
            "type": "Feature",
            "properties": {"geo": geo, "name": props["NAME_ENGL"]},
            "geometry": {"type": "MultiPolygon", "coordinates": kept},
        })

    found = {f["properties"]["geo"] for f in features}
    if found != EU27:
        sys.exit(f"Missing countries: {sorted(EU27 - found)}")

    features.sort(key=lambda f: f["properties"]["geo"])
    collection = {"type": "FeatureCollection", "features": features}
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(collection, separators=(",", ":")) + "\n",
                        encoding="utf-8")
    print(f"Wrote {OUT_FILE} ({OUT_FILE.stat().st_size / 1024:.0f} KB, "
          f"{len(features)} countries)")


if __name__ == "__main__":
    main()
