import type { AppData } from '../data/types'

/** Show a number, or "no data" when the value is missing (null). */
function show(value: number | null, digits: number) {
  return value === null ? 'no data' : value.toFixed(digits)
}

// A temporary component for milestone M1: it lists what was loaded, so we can
// see that the data files and the loader work. It will be replaced by the map.
// "props" are the inputs a component receives; here, the loaded data.
export function DebugData({ data }: { data: AppData }) {
  const { meta, countries, panel, episodes, stress, modelMetrics } = data
  const latest = panel.filter((row) => row.quarter === meta.last_quarter)
  const rowByGeo = new Map(latest.map((row) => [row.geo, row]))
  const missingCells = panel.filter((row) => row.hpi_real === null).length

  const files = [
    ['meta.json', `status "${meta.data_status}", ${meta.first_quarter} to ${meta.last_quarter}, base year ${meta.base_year}`],
    ['countries.geojson', `${countries.features.length} country outlines`],
    ['panel.json', `${panel.length} rows (${missingCells} with no data)`],
    ['episodes.json', `${episodes.length} bubble episodes`],
    ['stress.json', `${stress.length} rows`],
    ['model_metrics.json', `AUROC ${modelMetrics.auroc}, ${modelMetrics.missed.length} missed, ${modelMetrics.false_alarms.length} false alarms`],
  ]

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 text-left">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-bold">Loaded files</h2>
        <ul className="flex flex-col gap-2">
          {files.map(([name, summary]) => (
            <li key={name}>
              <span className="font-semibold text-accent">{name}</span>
              <span className="text-muted"> — {summary}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-xl font-bold">
          Countries in {meta.last_quarter}
        </h2>
        <table className="w-full">
          <thead>
            <tr className="text-left text-muted">
              <th className="pb-2 font-normal">Code</th>
              <th className="pb-2 font-normal">Country</th>
              <th className="pb-2 text-right font-normal">Real HPI</th>
              <th className="pb-2 text-right font-normal">Real rate (%)</th>
              <th className="pb-2 text-right font-normal">Risk score</th>
            </tr>
          </thead>
          <tbody>
            {countries.features.map(({ properties }) => {
              const row = rowByGeo.get(properties.geo)
              return (
                <tr key={properties.geo} className="border-t border-border">
                  <td className="py-1 text-muted">{properties.geo}</td>
                  <td className="py-1">{properties.name}</td>
                  <td className="py-1 text-right">{show(row?.hpi_real ?? null, 1)}</td>
                  <td className="py-1 text-right">{show(row?.rate_real ?? null, 2)}</td>
                  <td className="py-1 text-right">{show(row?.risk_score ?? null, 2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="mt-4 text-sm text-muted">
          Source: {meta.sources.map((s) => `${s.name} (${s.code})`).join(' · ')}.
          Quarter: {meta.last_quarter}.
        </p>
      </section>
    </div>
  )
}
