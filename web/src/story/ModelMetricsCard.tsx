import { countryName, sourceText } from '../data/helpers'
import type { AppData } from '../data/types'

/** One headline number with a short explanation under it. */
function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted">{hint}</div>
    </div>
  )
}

const percent = (share: number) => `${Math.round(share * 100)}%`

/** How well the early-warning model did on data it had not seen,
 *  including its mistakes. */
export function ModelMetricsCard({ data }: { data: AppData }) {
  const metrics = data.modelMetrics

  return (
    <div className="mt-4 rounded-xl border border-border bg-bg p-4">
      <div className="text-sm font-bold">Model performance on unseen data</div>
      <div className="text-xs text-muted">
        Trained up to {metrics.train_end} · tested from {metrics.test_start}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat
          label="AUROC"
          value={metrics.auroc.toFixed(2)}
          hint="1.0 is perfect, 0.5 is a coin flip"
        />
        <Stat
          label="Hit rate"
          value={percent(metrics.hit_rate)}
          hint="bubble episodes it flagged"
        />
        <Stat
          label="False alarms"
          value={percent(metrics.false_alarm_rate)}
          hint="calm quarters it flagged"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-bold text-[#E0414B]">Missed episodes</div>
          <ul className="mt-1 text-muted">
            {metrics.missed.length === 0 && <li>None</li>}
            {metrics.missed.map((item) => (
              <li key={item.geo + item.start}>
                {countryName(data, item.geo)}, from {item.start}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-bold text-[#F2C14E]">False alarms</div>
          <ul className="mt-1 text-muted">
            {metrics.false_alarms.length === 0 && <li>None</li>}
            {metrics.false_alarms.map((item) => (
              <li key={item.geo + item.quarter}>
                {countryName(data, item.geo)}, {item.quarter}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">Source: {sourceText(data)}.</p>
    </div>
  )
}
