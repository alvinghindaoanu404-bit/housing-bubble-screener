import { formatShock } from '../data/helpers'
import type { AppData, PanelRow } from '../data/types'

/** The things the map can show. */
export type LayerKey = 'risk' | 'hpi' | 'overvaluation' | 'rate' | 'stress'

/** The buttons of the layer switcher in explore mode, in display order. */
export const LAYER_OPTIONS: { key: LayerKey; label: string }[] = [
  { key: 'hpi', label: 'Real prices' },
  { key: 'overvaluation', label: 'Overvaluation' },
  { key: 'rate', label: 'Interest rates' },
  { key: 'risk', label: 'Risk score' },
  { key: 'stress', label: 'Stress test' },
]

/** Everything the map and the legend need to draw one layer. */
export interface LayerView {
  title: string
  quarter: string
  /** One value per country code; null means "no data". */
  values: Map<string, number | null>
  /** The values at the bottom and the top of the colour ramp. */
  min: number
  max: number
  /** How many decimals to show. */
  digits: number
}

// Which rate shock the stress slider starts on.
export const DEFAULT_SHOCK_BP = 200

// For each layer that comes from panel.json: its title, its column, and its
// decimals. "range" is set only where the scale is fixed by definition
// (a probability always runs from 0 to 1); otherwise it is read from the data.
const PANEL_LAYERS: Record<
  Exclude<LayerKey, 'stress'>,
  { title: string; field: keyof PanelRow; digits: number; range?: [number, number] }
> = {
  risk: { title: 'Risk score', field: 'risk_score', digits: 2, range: [0, 1] },
  hpi: { title: 'Real house price index', field: 'hpi_real', digits: 1 },
  overvaluation: { title: 'Overvaluation (z-score)', field: 'overvaluation_z', digits: 2 },
  rate: { title: 'Real interest rate (%)', field: 'rate_real', digits: 2 },
}

/** True for layers that have a value for every quarter (so the time slider applies). */
export function hasTimeline(key: LayerKey) {
  return key !== 'stress'
}

/** The smallest and largest value of one column over ALL quarters and countries.
 *  Using one scale for every quarter keeps colours comparable through time. */
function fullRange(panel: PanelRow[], field: keyof PanelRow): [number, number] {
  let min = Infinity
  let max = -Infinity
  for (const row of panel) {
    const value = row[field]
    if (typeof value !== 'number') continue
    if (value < min) min = value
    if (value > max) max = value
  }
  if (min === Infinity) return [0, 1]
  return min === max ? [min, min + 1] : [min, max]
}

/** Collect the values of one layer for one quarter.
 *  shockBp is used only by the stress layer: which rate shock to show. */
export function buildLayer(
  data: AppData,
  key: LayerKey,
  quarter: string,
  shockBp: number,
): LayerView {
  const values = new Map<string, number | null>()

  if (key === 'stress') {
    for (const row of data.stress) {
      if (row.shock_bp === shockBp) values.set(row.geo, row.risk_score)
    }
    return {
      title:
        shockBp === 0
          ? 'Risk score with no rate shock'
          : `Risk score after a ${formatShock(shockBp)} rate shock`,
      quarter: data.meta.last_quarter,
      values,
      min: 0,
      max: 1,
      digits: 2,
    }
  }

  const layer = PANEL_LAYERS[key]
  for (const row of data.panel) {
    if (row.quarter === quarter) values.set(row.geo, row[layer.field] as number | null)
  }
  const [min, max] = layer.range ?? fullRange(data.panel, layer.field)
  return { title: layer.title, quarter, values, min, max, digits: layer.digits }
}
