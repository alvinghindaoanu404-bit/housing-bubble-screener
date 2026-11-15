import { NO_DATA_HEX, RAMP_HEX } from './colorRamp'

interface LegendProps {
  title: string
  minLabel: string
  maxLabel: string
  quarter: string
  source: string
}

/** A small box explaining what the colours and heights on the map mean. */
export function Legend({ title, minLabel, maxLabel, quarter, source }: LegendProps) {
  return (
    <aside
      aria-label="Map legend"
      className="absolute bottom-4 left-4 z-10 w-64 rounded-xl border border-border bg-card p-4"
    >
      <div className="font-bold">{title}</div>
      <div className="text-xs text-muted">Height and colour · {quarter}</div>

      <div
        className="mt-3 h-3 rounded-full"
        style={{ background: `linear-gradient(to right, ${RAMP_HEX.join(', ')})` }}
      />
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <span className="h-3 w-3 rounded-sm" style={{ background: NO_DATA_HEX }} />
        No data
      </div>

      <p className="mt-3 border-t border-border pt-2 text-xs text-muted">Source: {source}</p>
    </aside>
  )
}
