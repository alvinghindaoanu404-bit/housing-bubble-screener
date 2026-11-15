import { useEffect, useMemo, useState } from 'react'
import { Legend } from './components/Legend'
import { Map3D } from './components/Map3D'
import { loadData } from './data/loadData'
import type { AppData } from './data/types'

// App is the main component: the top-level piece of the page.
function App() {
  // "State" is a value the component remembers; when it changes, the page redraws.
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load the data files once, when the page opens.
  useEffect(() => {
    loadData()
      .then(setData)
      .catch((problem: Error) => setError(problem.message))
  }, [])

  // The latest risk score of each country, looked up by country code.
  const riskByGeo = useMemo(() => {
    const lookup = new Map<string, number | null>()
    if (data) {
      for (const row of data.panel) {
        if (row.quarter === data.meta.last_quarter) lookup.set(row.geo, row.risk_score)
      }
    }
    return lookup
  }, [data])

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-bg text-text">
      {data && (
        <Map3D
          countries={data.countries}
          values={riskByGeo}
          min={0}
          max={1}
          label="Risk score"
          quarter={data.meta.last_quarter}
          digits={2}
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col">
        {data?.meta.data_status === 'demo' && (
          <div
            role="status"
            className="bg-[#F2C14E] px-4 py-2 text-center font-bold text-[#0B1020]"
          >
            DEMO DATA — not thesis results
          </div>
        )}
        <header className="p-6">
          <h1 className="text-3xl font-bold">Housing Bubble Screener</h1>
          <p className="mt-1 text-muted">
            Drag to move · scroll to zoom · right-drag to rotate and tilt
          </p>
        </header>
      </div>

      {error && (
        <p role="alert" className="absolute inset-0 grid place-items-center text-[#E0414B]">
          The data could not be loaded: {error}
        </p>
      )}
      {!data && !error && (
        <p className="absolute inset-0 grid place-items-center text-muted">Loading data…</p>
      )}

      {data && (
        <p className="pointer-events-none absolute bottom-4 right-4 z-10 text-xs text-muted">
          © EuroGeographics for the administrative boundaries
        </p>
      )}

      {data && (
        <Legend
          title="Risk score"
          minLabel="0 (low)"
          maxLabel="1 (high)"
          quarter={data.meta.last_quarter}
          source={data.meta.sources.map((s) => `${s.name} (${s.code})`).join(' · ')}
        />
      )}
    </main>
  )
}

export default App
