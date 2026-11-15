// Types describe the exact shape of each data file (CLAUDE.md section 5).
// A type is a description of what fields an object has and what kind of value
// each field holds. TypeScript uses it to warn us about mistakes before we run.

/** A quarter written as text, for example "2025-Q3". */
export type Quarter = string

/** meta.json */
export interface Meta {
  data_status: 'demo' | 'real'
  generated_at: string
  base_year: number
  first_quarter: Quarter
  last_quarter: Quarter
  sources: { name: string; code: string }[]
}

/** One row of panel.json: one country in one quarter.
 *  "number | null" means: a number, or null when the data is missing. */
export interface PanelRow {
  geo: string
  quarter: Quarter
  hpi_real: number | null
  price_to_rent: number | null
  price_to_income: number | null
  overvaluation_z: number | null
  rate_nominal: number | null
  rate_real: number | null
  in_bubble: boolean | null
  risk_score: number | null
}

/** One row of episodes.json: a bubble period found by the GSADF test. */
export interface Episode {
  geo: string
  start: Quarter
  end: Quarter
  series: string
}

/** One row of stress.json: the risk score under one interest-rate shock. */
export interface StressRow {
  geo: string
  shock_bp: -100 | 0 | 100 | 200 | 300
  risk_score: number | null
}

/** model_metrics.json */
export interface ModelMetrics {
  train_end: Quarter
  test_start: Quarter
  auroc: number
  hit_rate: number
  false_alarm_rate: number
  missed: { geo: string; start: Quarter }[]
  false_alarms: { geo: string; quarter: Quarter }[]
}

/** One country outline in countries.geojson. */
export interface CountryFeature {
  type: 'Feature'
  properties: { geo: string; name: string }
  geometry: { type: 'MultiPolygon'; coordinates: number[][][][] }
}

/** countries.geojson */
export interface CountriesGeoJSON {
  type: 'FeatureCollection'
  features: CountryFeature[]
}

/** Everything the dashboard needs, loaded together. */
export interface AppData {
  meta: Meta
  countries: CountriesGeoJSON
  panel: PanelRow[]
  episodes: Episode[]
  stress: StressRow[]
  modelMetrics: ModelMetrics
}
