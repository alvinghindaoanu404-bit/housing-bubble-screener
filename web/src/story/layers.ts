import type { AppData, PanelRow } from '../data/types'

/** The things the map can show. */
export type LayerKey = 'risk' | 'hpi' | 'overvaluation' | 'rate' | 'stress'

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

// Which rate shock the story shows until the slider arrives in M6.
const STORY_SHOCK_BP = 200

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

/** The smallest and largest value shown, ignoring missing ones. */
function rangeOf(values: Map<string, number | null>): [number, number] {
  const numbers = [...values.values()].filter((v): v is number => v !== null)
  if (numbers.length === 0) return [0, 1]
  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  return min === max ? [min, min + 1] : [min, max]
}

/** Collect the values of one layer for one quarter. */
export function buildLayer(data: AppData, key: LayerKey, quarter: string): LayerView {
  const values = new Map<string, number | null>()

  if (key === 'stress') {
    for (const row of data.stress) {
      if (row.shock_bp === STORY_SHOCK_BP) values.set(row.geo, row.risk_score)
    }
    return {
      title: `Risk score after a +${STORY_SHOCK_BP} bp rate shock`,
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
  const [min, max] = layer.range ?? rangeOf(values)
  return { title: layer.title, quarter, values, min, max, digits: layer.digits }
}
