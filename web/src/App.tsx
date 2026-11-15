import { useEffect, useState } from 'react'
import { DebugData } from './components/DebugData'
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

  return (
    <main className="min-h-screen bg-bg text-text">
      {data?.meta.data_status === 'demo' && (
        <div
          role="status"
          className="bg-[#F2C14E] px-4 py-2 text-center font-bold text-[#0B1020]"
        >
          DEMO DATA — not thesis results
        </div>
      )}

      <div className="flex flex-col gap-8 p-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold">Housing Bubble Screener</h1>
          <p className="mt-2 text-muted">M1 — data check. The 3D map comes next.</p>
        </header>

        {error && (
          <p role="alert" className="text-center text-[#E0414B]">
            The data could not be loaded: {error}
          </p>
        )}
        {!data && !error && <p className="text-center text-muted">Loading data…</p>}
        {data && <DebugData data={data} />}
      </div>
    </main>
  )
}

export default App
