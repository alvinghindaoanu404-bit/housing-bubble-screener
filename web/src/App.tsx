import { useEffect, useMemo, useState } from 'react'
import { Button } from './components/Button'
import { Legend } from './components/Legend'
import { Map3D } from './components/Map3D'
import { Story } from './components/Story'
import { loadData } from './data/loadData'
import type { AppData } from './data/types'
import { buildLayer } from './story/layers'
import { SECTIONS } from './story/sections'

// On screens at least this wide, the map is centred beside the story cards.
const WIDE_SCREEN_PX = 1024
const CARD_SPACE_PX = 400

/** True when the window is wide enough for cards and map side by side. */
function useIsWide() {
  const [isWide, setIsWide] = useState(window.innerWidth >= WIDE_SCREEN_PX)
  useEffect(() => {
    const update = () => setIsWide(window.innerWidth >= WIDE_SCREEN_PX)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return isWide
}

// App is the main component: the top-level piece of the page.
function App() {
  // "State" is a value the component remembers; when it changes, the page redraws.
  const [data, setData] = useState<AppData | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Which story section is in the middle of the screen (0 to 9).
  const [active, setActive] = useState(0)
  // True after "Explore the map" is pressed: the cards hide and the map unlocks.
  const [exploring, setExploring] = useState(false)
  const isWide = useIsWide()

  // Load the data files once, when the page opens.
  useEffect(() => {
    loadData()
      .then(setData)
      .catch((problem: Error) => setError(problem.message))
  }, [])

  // While exploring, stop the page from scrolling so the wheel zooms the map.
  useEffect(() => {
    document.body.style.overflow = exploring ? 'hidden' : ''
  }, [exploring])

  const section = SECTIONS[active]

  // The values the map should show for the active section.
  const layer = useMemo(
    () => (data ? buildLayer(data, section.layer, data.meta.last_quarter) : null),
    [data, section.layer],
  )

  return (
    <div className="bg-bg text-text">
      {/* The map stays fixed in the background while the story scrolls over it. */}
      <div className="fixed inset-0">
        {data && layer && (
          <Map3D
            countries={data.countries}
            layer={layer}
            camera={section.camera}
            interactive={exploring}
            dim={!exploring && section.dim === true}
            highlightGeo={exploring ? null : (section.highlightGeo ?? null)}
            paddingLeft={isWide && !exploring ? CARD_SPACE_PX : 0}
          />
        )}
        {error && (
          <p role="alert" className="absolute inset-0 grid place-items-center text-[#E0414B]">
            The data could not be loaded: {error}
          </p>
        )}
        {!data && !error && (
          <p className="absolute inset-0 grid place-items-center text-muted">Loading data…</p>
        )}
      </div>

      {data?.meta.data_status === 'demo' && (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-30 bg-[#F2C14E] px-4 py-2 text-center font-bold text-[#0B1020]"
        >
          DEMO DATA — not thesis results
        </div>
      )}

      {data && (
        <Story
          onActiveChange={setActive}
          onExplore={() => setExploring(true)}
          hidden={exploring}
        />
      )}

      {exploring && (
        <div className="fixed top-14 left-4 z-20 flex items-center gap-4">
          <Button onClick={() => setExploring(false)}>← Back to story</Button>
          <span className="text-sm text-muted">
            Drag to move · scroll to zoom · right-drag to rotate and tilt
          </span>
        </div>
      )}

      {data && layer && (
        <Legend
          layer={layer}
          source={data.meta.sources.map((s) => `${s.name} (${s.code})`).join(' · ')}
        />
      )}
    </div>
  )
}

export default App
