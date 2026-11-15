import { countryName, quarterNumber, sourceText } from '../data/helpers'
import type { AppData } from '../data/types'

/** A strip with one row per country. Each bubble episode is a shaded bar,
 *  placed by its start and end quarter. */
export function EpisodesTimeline({ data }: { data: AppData }) {
  const { meta, episodes } = data
  const first = quarterNumber(meta.first_quarter)
  const total = quarterNumber(meta.last_quarter) - first + 1

  // Group the episodes by country, in alphabetical order of the code.
  const countries = [...new Set(episodes.map((e) => e.geo))].sort()

  return (
    <div className="mt-4 rounded-xl border border-border bg-bg p-4">
      <div className="text-sm font-bold">
        Bubble episodes, {meta.first_quarter} to {meta.last_quarter}
      </div>

      {episodes.length === 0 && <p className="mt-2 text-sm text-muted">No episodes found.</p>}

      <div className="mt-3 flex flex-col gap-[3px]">
        {countries.map((geo) => (
          <div key={geo} className="flex items-center gap-2">
            <span className="w-6 text-xs text-muted" title={countryName(data, geo)}>
              {geo}
            </span>
            <div className="relative h-2.5 flex-1 rounded-sm bg-card">
              {episodes
                .filter((e) => e.geo === geo)
                .map((e) => {
                  const start = quarterNumber(e.start) - first
                  const length = quarterNumber(e.end) - quarterNumber(e.start) + 1
                  return (
                    <div
                      key={e.start}
                      title={`${countryName(data, geo)}: ${e.start} to ${e.end}`}
                      className="absolute inset-y-0 rounded-sm bg-accent-soft"
                      style={{
                        left: `${(start / total) * 100}%`,
                        width: `${(length / total) * 100}%`,
                      }}
                    />
                  )
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-1 flex justify-between pl-8 text-xs text-muted">
        <span>{meta.first_quarter}</span>
        <span>{meta.last_quarter}</span>
      </div>

      <p className="mt-3 text-xs text-muted">
        {episodes.length} episodes in {countries.length} countries. Hover a bar for its dates.
        <br />
        Source: {sourceText(data)}.
      </p>
    </div>
  )
}
