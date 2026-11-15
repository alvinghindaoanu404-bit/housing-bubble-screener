import type { AppData } from '../data/types'

/** Five small tiles: one country's risk score under each rate shock. */
export function StressTiles({ data, geo }: { data: AppData; geo: string }) {
  const rows = data.stress
    .filter((row) => row.geo === geo)
    .sort((a, b) => a.shock_bp - b.shock_bp)

  if (rows.length === 0) return <p className="text-sm text-muted">No data</p>

  return (
    <div className="grid grid-cols-5 gap-1 text-center">
      {rows.map((row) => (
        <div key={row.shock_bp} className="rounded-lg border border-border bg-card py-2">
          <div className="text-xs text-muted">
            {row.shock_bp > 0 ? '+' : ''}
            {row.shock_bp} bp
          </div>
          <div className="font-bold">
            {row.risk_score === null ? 'no data' : row.risk_score.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  )
}
