import { sourceText } from '../data/helpers'
import type { AppData, PanelRow } from '../data/types'

const GEO = 'RO'

// The rows of the comparison table: label, column in panel.json, decimals.
const ROWS: { label: string; field: keyof PanelRow; digits: number }[] = [
  { label: 'Price-to-rent (1.0 = average)', field: 'price_to_rent', digits: 2 },
  { label: 'Price-to-income (1.0 = average)', field: 'price_to_income', digits: 2 },
  { label: 'Overvaluation (z-score)', field: 'overvaluation_z', digits: 2 },
  { label: 'Real interest rate (%)', field: 'rate_real', digits: 2 },
  { label: 'Risk score', field: 'risk_score', digits: 2 },
]

/** The middle value of a list: half the countries are above it, half below.
 *  This is only a way of displaying the 27 values, not a thesis result. */
function median(values: number[]) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

const show = (value: number | null, digits: number) =>
  value === null ? 'no data' : value.toFixed(digits)

/** Romania's latest values next to the EU median, plus its stress results. */
export function RomaniaPanel({ data }: { data: AppData }) {
  const quarter = data.meta.last_quarter
  const latest = data.panel.filter((row) => row.quarter === quarter)
  const romania = latest.find((row) => row.geo === GEO)
  const stress = data.stress
    .filter((row) => row.geo === GEO)
    .sort((a, b) => a.shock_bp - b.shock_bp)

  return (
    <div className="mt-4 rounded-xl border border-border bg-bg p-4">
      <div className="text-sm font-bold">Romania vs the EU, {quarter}</div>

      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <th className="pb-1 text-left font-normal">Indicator</th>
            <th className="pb-1 text-right font-normal">Romania</th>
            <th className="pb-1 text-right font-normal">EU median</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ label, field, digits }) => {
            const euValues = latest
              .map((row) => row[field])
              .filter((value): value is number => typeof value === 'number')
            const own = romania ? (romania[field] as number | null) : null
            return (
              <tr key={field} className="border-t border-border">
                <td className="py-1 text-muted">{label}</td>
                <td className="py-1 text-right font-bold">{show(own, digits)}</td>
                <td className="py-1 text-right">{show(median(euValues), digits)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-4 text-sm font-bold">Risk score under rate shocks</div>
      <div className="mt-2 grid grid-cols-5 gap-1 text-center">
        {stress.map((row) => (
          <div key={row.shock_bp} className="rounded-lg border border-border bg-card py-2">
            <div className="text-xs text-muted">
              {row.shock_bp > 0 ? '+' : ''}
              {row.shock_bp} bp
            </div>
            <div className="font-bold">{show(row.risk_score, 2)}</div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted">
        EU median = the middle of the 27 country values shown on the map.
        <br />
        Source: {sourceText(data)}.
      </p>
    </div>
  )
}
