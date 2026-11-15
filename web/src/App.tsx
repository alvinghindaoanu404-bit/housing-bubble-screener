import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from './components/Button'
import { LayerSwitcher } from './components/LayerSwitcher'
import { Legend } from './components/Legend'
import { Map3D } from './components/Map3D'
import { SidePanel } from './components/SidePanel'
import { Story } from './components/Story'
import { TimeSlider } from './components/TimeSlider'
import { quarterNumber, sourceText } from './data/helpers'
import { loadData } from './data/loadData'
import type { AppData } from './data/types'
import { buildLayer, hasTimeline } from './story/layers'
import type { LayerKey } from './story/layers'
import { SECTIONS } from './story/sections'

// On screens at least this wide, the map is centred beside the story cards.
const WIDE_SCREEN_PX = 1024
const CARD_SPACE_PX = 400
// How long each quarter stays on screen while playing, in milliseconds.
const PLAY_STEP_MS = 300

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
  // Explore mode: the layer chosen in the switcher, and the clicked country.
  const [exploreLayer, setExploreLayer] = useState<LayerKey>('risk')
  const [selectedGeo, setSelectedGeo] = useState<string | null>(null)
  // The position of the quarter shown on the map; null means "the latest".
  const [quarterIndex, setQuarterIndex] = useState<number | null>(null)
  // True while the map is playing through the quarters.
  const [playing, setPlaying] = useState(false)
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

  // Every quarter in the data, oldest first.
  const quarters = useMemo(() => {
    if (!data) return []
    const unique = [...new Set(data.panel.map((row) => row.quarter))]
    return unique.sort((a, b) => quarterNumber(a) - quarterNumber(b))
  }, [data])
  const lastIndex = quarters.length - 1
  const shownIndex = quarterIndex ?? lastIndex

  // A ref is a value that can be read instantly, without waiting for a redraw.
  // It mirrors "playing", so a tick that was already scheduled can tell that
  // playback was stopped in the meantime and must not move the quarter.
  const playingRef = useRef(false)
  const play = useCallback((on: boolean) => {
    playingRef.current = on
    setPlaying(on)
  }, [])

  // While playing, step to the next quarter after a short wait; stop at the end.
  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => {
      if (!playingRef.current) return
      if (shownIndex >= lastIndex) play(false)
      else setQuarterIndex(shownIndex + 1)
    }, PLAY_STEP_MS)
    return () => clearTimeout(timer)
  }, [playing, shownIndex, lastIndex, play])

  // Called by the story when a new section reaches the middle of the screen.
  const onActiveChange = useCallback(
    (index: number) => {
      setActive(index)
      if (SECTIONS[index].autoplay) {
        // Start from the oldest quarter and play forward.
        setQuarterIndex(0)
        play(true)
      } else {
        play(false)
        setQuarterIndex(null)
      }
    },
    [play],
  )

  const togglePlay = () => {
    // Pressing play at the end starts again from the beginning.
    if (!playing && shownIndex >= lastIndex) setQuarterIndex(0)
    play(!playing)
  }

  const enterExplore = () => {
    play(false)
    setQuarterIndex(null)
    setExploring(true)
  }

  const leaveExplore = () => {
    setExploring(false)
    setSelectedGeo(null)
    play(false)
    setQuarterIndex(null)
  }

  const closePanel = useCallback(() => setSelectedGeo(null), [])

  const section = SECTIONS[active]
  const layerKey = exploring ? exploreLayer : section.layer
  const quarter = quarters[shownIndex]

  // The values the map should show right now.
  const layer = useMemo(
    () => (data && quarter ? buildLayer(data, layerKey, quarter) : null),
    [data, layerKey, quarter],
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
            onSelect={setSelectedGeo}
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
          data={data}
          onActiveChange={onActiveChange}
          onExplore={enterExplore}
          hidden={exploring}
        />
      )}

      {data && exploring && (
        <>
          <div className="fixed top-14 left-4 z-20 flex flex-col items-start gap-3">
            <Button onClick={leaveExplore}>← Back to story</Button>
            <LayerSwitcher
              value={exploreLayer}
              onChange={(key) => {
                setExploreLayer(key)
                // The stress test has no history, so stop playing.
                if (!hasTimeline(key)) play(false)
              }}
            />
            <p className="text-sm text-muted">
              Drag to move · scroll to zoom · right-drag to rotate and tilt · click a country
            </p>
          </div>

          <div className="fixed bottom-4 left-[18rem] z-20 w-[min(36rem,calc(100vw-19rem))]">
            <TimeSlider
              quarters={quarters}
              index={shownIndex}
              onChange={(index) => {
                play(false)
                setQuarterIndex(index)
              }}
              playing={playing}
              onTogglePlay={togglePlay}
              disabled={!hasTimeline(exploreLayer)}
            />
          </div>

          <SidePanel data={data} geo={selectedGeo} onClose={closePanel} />
        </>
      )}

      {data && layer && (
        <Legend layer={layer} source={sourceText(data)} side={exploring ? 'left' : 'right'} />
      )}
    </div>
  )
}

export default App
