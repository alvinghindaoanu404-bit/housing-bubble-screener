import type {
  AppData,
  CountriesGeoJSON,
  Episode,
  Meta,
  ModelMetrics,
  PanelRow,
  StressRow,
} from './types'

// The data files are shipped inside the site itself (web/public/data/),
// so this works offline. BASE_URL is the folder the site is served from.
const DATA_URL = `${import.meta.env.BASE_URL}data/`

/** Read one JSON file from the data folder. */
async function loadFile<T>(name: string): Promise<T> {
  const response = await fetch(DATA_URL + name)
  if (!response.ok) {
    throw new Error(`Could not load ${name} (status ${response.status})`)
  }
  return (await response.json()) as T
}

/** Load all six data files at the same time. */
export async function loadData(): Promise<AppData> {
  const [meta, countries, panel, episodes, stress, modelMetrics] =
    await Promise.all([
      loadFile<Meta>('meta.json'),
      loadFile<CountriesGeoJSON>('countries.geojson'),
      loadFile<PanelRow[]>('panel.json'),
      loadFile<Episode[]>('episodes.json'),
      loadFile<StressRow[]>('stress.json'),
      loadFile<ModelMetrics>('model_metrics.json'),
    ])
  return { meta, countries, panel, episodes, stress, modelMetrics }
}
