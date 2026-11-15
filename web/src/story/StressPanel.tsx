import { ShockSlider } from '../components/ShockSlider'
import type { ShockControl } from '../components/ShockSlider'
import { countryName, formatShock, sourceText } from '../data/helpers'
import type { AppData } from '../data/types'

// How many countries to list under the slider.
const TOP_COUNT = 5

/** The stress slider, plus the countries with the highest risk score
 *  at the chosen shock. The list only sorts values from stress.json. */
export function StressPanel({ data, control }: { data: AppData; control: ShockControl }) {
  const highest = data.stress
    .filter((row) => row.shock_bp === control.value && row.risk_score !== null)
    .sort((a, b) => (b.risk_score as number) - (a.risk_score as number))
    .slice(0, TOP_COUNT)

  return (
    <div className="mt-4 rounded-xl border border-border bg-bg p-4">
      <ShockSlider {...control} />

      <div className="mt-4 text-sm font-bold">
        Highest risk scores at {formatShock(control.value)}
      </div>
      <ol className="mt-2 flex flex-col gap-1 text-sm">
        {highest.map((row, position) => (
          <li key={row.geo} className="flex justify-between border-t border-border pt-1">
            <span>
              <span className="text-muted">{position + 1}.</span> {countryName(data, row.geo)}
            </span>
            <span className="font-bold">{(row.risk_score as number).toFixed(2)}</span>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-xs text-muted">
        Source: {sourceText(data)}. {data.meta.last_quarter}.
      </p>
    </div>
  )
}
