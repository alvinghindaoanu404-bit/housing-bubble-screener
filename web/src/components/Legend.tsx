import type { LayerView } from '../story/layers'
import { NO_DATA_HEX, RAMP_HEX } from '../theme'

interface LegendProps {
  layer: LayerView
  source: string
  /** Which bottom corner to sit in. */
  side: 'left' | 'right'
}

/** A small box explaining what the colours and heights on the map mean. */
export function Legend({ layer, source, side }: LegendProps) {
  return (
    <aside
      aria-label="Map legend"
      className={`fixed bottom-4 z-20 w-64 rounded-xl border border-border bg-card p-4 ${
        side === 'left' ? 'left-4' : 'right-4'
      }`}
    >
      <div className="font-bold">{layer.title}</div>
      <div className="text-xs text-muted">Height and colour · {layer.quarter}</div>

      <div
        className="mt-3 h-3 rounded-full"
        style={{ background: `linear-gradient(to right, ${RAMP_HEX.join(', ')})` }}
      />
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{layer.min.toFixed(layer.digits)}</span>
        <span>{layer.max.toFixed(layer.digits)}</span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span className="h-3 w-3 rounded-sm" style={{ background: NO_DATA_HEX }} />
        No data
      </div>

      <p className="mt-3 border-t border-border pt-2 text-xs text-muted">
        Source: {source}
        <br />© EuroGeographics for the administrative boundaries
      </p>
    </aside>
  )
}
