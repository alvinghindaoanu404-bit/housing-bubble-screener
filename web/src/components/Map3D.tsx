import { FlyToInterpolator, MapView } from '@deck.gl/core'
import type { PickingInfo } from '@deck.gl/core'
import { GeoJsonLayer } from '@deck.gl/layers'
import { DeckGL } from '@deck.gl/react'
import { useEffect, useMemo, useState } from 'react'
import type { CountriesGeoJSON, CountryFeature } from '../data/types'
import type { LayerView } from '../story/layers'
import type { Camera } from '../story/sections'
import { COLORS } from '../theme'
import { hexToRgb, rampColor } from './colorRamp'
import type { RGB } from './colorRamp'

// How far the user may zoom out and in.
const ZOOM_LIMITS = { minZoom: 2.5, maxZoom: 7 }
// How long a camera flight and a height change take, in milliseconds.
// The second number of each pair is used when the system asks for less motion.
const FLIGHT_MS = [1800, 0]
const GROW_MS = [800, 150]
// How tall (in metres on the map) a country with the highest value becomes.
const MAX_HEIGHT_M = 350_000
// A thin slab for countries with no data, so they stay visible and hoverable.
const NO_DATA_HEIGHT_M = 4_000
// The page background, used to darken countries.
const BACKGROUND: RGB = hexToRgb(COLORS.bg)
// The hero map sways gently: this many degrees each way, once per this many seconds,
// starting after the camera flight has finished.
const SWAY_DEGREES = 12
const SWAY_PERIOD_S = 24
const SWAY_DELAY_S = 2
// Countries in a bubble episode glow: a light overlay that fades in and out.
const GLOW_COLOR: RGB = [226, 236, 248]
const GLOW_PERIOD_S = 1.6
// The tooltip flips to the left of the mouse this close to the right edge.
const TOOLTIP_FLIP_PX = 240
// While the story is running the map must not react to dragging or scrolling,
// otherwise scrolling the page would zoom the map instead.
const LOCKED_CONTROLLER = {
  scrollZoom: false,
  dragPan: false,
  dragRotate: false,
  doubleClickZoom: false,
  touchZoom: false,
  touchRotate: false,
  keyboard: false,
}

/** Start slowly, speed up, then slow down again. */
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/** Mix a colour with the background; share = 1 gives pure background. */
function darken(color: RGB, share: number): RGB {
  return [
    Math.round(color[0] + (BACKGROUND[0] - color[0]) * share),
    Math.round(color[1] + (BACKGROUND[1] - color[1]) * share),
    Math.round(color[2] + (BACKGROUND[2] - color[2]) * share),
  ]
}

/** A stopwatch for animations: while "running" is true it returns the seconds
 *  passed since it started, refreshed about 30 times per second. */
function useClock(running: boolean) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!running) return
    const start = performance.now()
    let last = start
    let frame = requestAnimationFrame(function tick(now) {
      if (now - last > 33) {
        last = now
        setSeconds((now - start) / 1000)
      }
      frame = requestAnimationFrame(tick)
    })
    return () => {
      cancelAnimationFrame(frame)
      setSeconds(0)
    }
  }, [running])
  return seconds
}

interface Map3DProps {
  countries: CountriesGeoJSON
  /** What to draw: one value per country, plus the range and labels. */
  layer: LayerView
  /** Where the camera should be. A new camera makes it fly there. */
  camera: Camera
  /** True when the user may drag, zoom and tilt the map. */
  interactive: boolean
  /** Darken the whole map. */
  dim: boolean
  /** Keep this country bright and darken the others. */
  highlightGeo: string | null
  /** The countries in a bubble episode right now; they pulse. */
  bubbleGeos: Set<string>
  /** Sway the camera gently (used on the hero section). */
  sway: boolean
  /** True when the system asks for less motion: no pulse, no sway, short transitions. */
  reducedMotion: boolean
  /** Empty space (pixels) on the left, so the map centres beside the cards. */
  paddingLeft: number
  /** Called with a country code when a country is clicked (only while interactive). */
  onSelect: (geo: string) => void
}

interface Hover {
  x: number
  y: number
  /** Draw the tooltip to the left of the mouse (near the right edge). */
  flip: boolean
  geo: string
  name: string
  value: number | null
}

export function Map3D({
  countries,
  layer,
  camera,
  interactive,
  dim,
  highlightGeo,
  bubbleGeos,
  sway,
  reducedMotion,
  paddingLeft,
  onSelect,
}: Map3DProps) {
  const [hover, setHover] = useState<Hover | null>(null)
  const { values, min, max } = layer
  const motionIndex = reducedMotion ? 1 : 0

  // --- Camera -------------------------------------------------------------
  // The sway is a slow left-right turn of the camera, in degrees.
  const swaySeconds = useClock(sway && !reducedMotion) - SWAY_DELAY_S
  const swayAngle =
    swaySeconds > 0 ? SWAY_DEGREES * Math.sin((swaySeconds * 2 * Math.PI) / SWAY_PERIOD_S) : 0

  // Each time "camera" changes, deck.gl flies from where it is to the new place.
  // It also flies back to the section's camera when the map is locked again.
  const viewState = useMemo(
    () =>
      swayAngle !== 0
        ? // Swaying: move straight to the new angle, with no flight.
          { ...camera, ...ZOOM_LIMITS, bearing: camera.bearing + swayAngle }
        : {
            ...camera,
            ...ZOOM_LIMITS,
            transitionDuration: FLIGHT_MS[motionIndex],
            transitionInterpolator: new FlyToInterpolator(),
            transitionEasing: easeInOut,
          },
    // "interactive" is listed on purpose, so leaving explore mode resets the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [camera, interactive, swayAngle, motionIndex],
  )

  const view = useMemo(
    () => new MapView({ padding: { left: paddingLeft } }),
    [paddingLeft],
  )

  // --- Countries ----------------------------------------------------------
  // A layer is one thing drawn on the map; here, the 27 country shapes.
  // useMemo rebuilds it only when its inputs change, not on every mouse move.
  const heightOf = useMemo(
    () => (feature: CountryFeature) => {
      const value = values.get(feature.properties.geo) ?? null
      if (value === null) return NO_DATA_HEIGHT_M
      const share = Math.min(1, Math.max(0, (value - min) / (max - min)))
      return NO_DATA_HEIGHT_M + share * MAX_HEIGHT_M
    },
    [values, min, max],
  )

  const countriesLayer = useMemo(
    () =>
      new GeoJsonLayer<CountryFeature['properties']>({
        id: 'countries',
        data: countries as never,
        extruded: true, // raise the flat shapes into 3D blocks
        wireframe: true, // draw thin edges so neighbours are easy to tell apart
        getElevation: (feature) => heightOf(feature as CountryFeature),
        getFillColor: (feature) => {
          const country = feature as CountryFeature
          const color = rampColor(values.get(country.properties.geo) ?? null, min, max)
          if (dim) return darken(color, 0.7)
          if (highlightGeo && country.properties.geo !== highlightGeo) return darken(color, 0.75)
          return color
        },
        getLineColor: [...BACKGROUND, 160],
        material: { ambient: 0.55, diffuse: 0.6, shininess: 20 },
        pickable: true, // lets the mouse "feel" the countries
        autoHighlight: true,
        highlightColor: [255, 255, 255, 70],
        // Animate height and colour whenever the values change.
        transitions: { getElevation: GROW_MS[motionIndex], getFillColor: GROW_MS[motionIndex] },
        // Tell deck.gl to recalculate when these inputs change.
        updateTriggers: {
          getElevation: [heightOf],
          getFillColor: [values, min, max, dim, highlightGeo],
        },
      }),
    [countries, heightOf, values, min, max, dim, highlightGeo, motionIndex],
  )

  // --- Bubble glow --------------------------------------------------------
  // A second copy of the countries that are in a bubble episode, drawn on top
  // in a light colour. Changing only its opacity makes them pulse cheaply.
  const glowFeatures = useMemo(
    () => countries.features.filter((f) => bubbleGeos.has(f.properties.geo)),
    [countries, bubbleGeos],
  )
  const glowSeconds = useClock(glowFeatures.length > 0 && !reducedMotion)
  const glowOpacity = reducedMotion
    ? 0.2
    : 0.08 + 0.3 * (0.5 - 0.5 * Math.cos((glowSeconds * 2 * Math.PI) / GLOW_PERIOD_S))

  const glowLayer = new GeoJsonLayer<CountryFeature['properties']>({
    id: 'bubble-glow',
    data: glowFeatures as never,
    extruded: true,
    // Slightly taller than the country itself, so it sits on top like a lid.
    getElevation: (feature) => heightOf(feature as CountryFeature) + 2_000,
    getFillColor: GLOW_COLOR,
    opacity: glowOpacity,
    material: false,
    pickable: false,
    transitions: { getElevation: GROW_MS[motionIndex] },
    updateTriggers: { getElevation: [heightOf] },
  })

  // --- Mouse --------------------------------------------------------------
  const onHover = (info: PickingInfo) => {
    const feature = info.object as CountryFeature | undefined
    if (!feature) {
      setHover(null)
      return
    }
    const mapWidth = info.viewport?.width ?? window.innerWidth
    setHover({
      x: info.x,
      y: info.y,
      flip: info.x > mapWidth - TOOLTIP_FLIP_PX,
      geo: feature.properties.geo,
      name: feature.properties.name,
      value: values.get(feature.properties.geo) ?? null,
    })
  }

  return (
    <div className="absolute inset-0">
      <DeckGL
        views={view}
        initialViewState={viewState}
        controller={interactive ? true : LOCKED_CONTROLLER}
        layers={[countriesLayer, glowLayer]}
        onHover={onHover}
        onClick={(info) => {
          const feature = info.object as CountryFeature | undefined
          if (interactive && feature) onSelect(feature.properties.geo)
        }}
        getCursor={({ isDragging, isHovering }) => {
          if (isHovering) return 'pointer'
          if (!interactive) return 'default'
          return isDragging ? 'grabbing' : 'grab'
        }}
      />

      {hover && (
        <div
          className={`pointer-events-none absolute z-10 rounded-xl border border-border bg-card px-3 py-2 whitespace-nowrap shadow-lg ${
            hover.flip ? '-translate-x-full' : ''
          }`}
          style={{ left: hover.x + (hover.flip ? -14 : 14), top: hover.y + 14 }}
        >
          <div className="font-bold">{hover.name}</div>
          <div className="text-sm text-muted">
            {layer.title}:{' '}
            <span className="text-text">
              {hover.value === null ? 'no data' : hover.value.toFixed(layer.digits)}
            </span>
          </div>
          {bubbleGeos.has(hover.geo) && (
            <div className="text-xs text-accent-soft">In a bubble episode</div>
          )}
          <div className="text-xs text-muted">{layer.quarter}</div>
        </div>
      )}
    </div>
  )
}
