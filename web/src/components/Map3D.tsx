import { FlyToInterpolator, MapView } from '@deck.gl/core'
import type { PickingInfo } from '@deck.gl/core'
import { GeoJsonLayer } from '@deck.gl/layers'
import { DeckGL } from '@deck.gl/react'
import { useMemo, useState } from 'react'
import type { CountriesGeoJSON, CountryFeature } from '../data/types'
import type { LayerView } from '../story/layers'
import type { Camera } from '../story/sections'
import { rampColor } from './colorRamp'
import type { RGB } from './colorRamp'

// How far the user may zoom out and in.
const ZOOM_LIMITS = { minZoom: 2.5, maxZoom: 7 }
// How long a camera flight takes, in milliseconds.
const FLIGHT_MS = 1800
// How tall (in metres on the map) a country with the highest value becomes.
const MAX_HEIGHT_M = 350_000
// A thin slab for countries with no data, so they stay visible and hoverable.
const NO_DATA_HEIGHT_M = 4_000
// The page background, used to darken countries.
const BACKGROUND: RGB = [11, 16, 32]
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
  /** Empty space (pixels) on the left, so the map centres beside the cards. */
  paddingLeft: number
}

interface Hover {
  x: number
  y: number
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
  paddingLeft,
}: Map3DProps) {
  const [hover, setHover] = useState<Hover | null>(null)
  const { values, min, max } = layer

  // Each time "camera" changes, deck.gl flies from where it is to the new place.
  // It also flies back to the section's camera when the map is locked again.
  const viewState = useMemo(
    () => ({
      ...camera,
      ...ZOOM_LIMITS,
      transitionDuration: FLIGHT_MS,
      transitionInterpolator: new FlyToInterpolator(),
      transitionEasing: easeInOut,
    }),
    // "interactive" is listed on purpose, so leaving explore mode resets the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [camera, interactive],
  )

  const view = useMemo(
    () => new MapView({ padding: { left: paddingLeft } }),
    [paddingLeft],
  )

  // A layer is one thing drawn on the map; here, the 27 country shapes.
  // useMemo rebuilds it only when its inputs change, not on every mouse move.
  const countriesLayer = useMemo(() => {
    const valueOf = (feature: CountryFeature) =>
      values.get(feature.properties.geo) ?? null

    return new GeoJsonLayer<CountryFeature['properties']>({
      id: 'countries',
      data: countries as never,
      extruded: true, // raise the flat shapes into 3D blocks
      wireframe: true, // draw thin edges so neighbours are easy to tell apart
      getElevation: (feature) => {
        const value = valueOf(feature as CountryFeature)
        if (value === null) return NO_DATA_HEIGHT_M
        const share = Math.min(1, Math.max(0, (value - min) / (max - min)))
        return NO_DATA_HEIGHT_M + share * MAX_HEIGHT_M
      },
      getFillColor: (feature) => {
        const country = feature as CountryFeature
        const color = rampColor(valueOf(country), min, max)
        if (dim) return darken(color, 0.7)
        if (highlightGeo && country.properties.geo !== highlightGeo) return darken(color, 0.75)
        return color
      },
      getLineColor: [11, 16, 32, 160],
      material: { ambient: 0.55, diffuse: 0.6, shininess: 20 },
      pickable: true, // lets the mouse "feel" the countries
      autoHighlight: true,
      highlightColor: [255, 255, 255, 70],
      // Animate height and colour over 800 ms whenever the values change.
      transitions: { getElevation: 800, getFillColor: 800 },
      // Tell deck.gl to recalculate when these inputs change.
      updateTriggers: {
        getElevation: [values, min, max],
        getFillColor: [values, min, max, dim, highlightGeo],
      },
    })
  }, [countries, values, min, max, dim, highlightGeo])

  const onHover = (info: PickingInfo) => {
    const feature = info.object as CountryFeature | undefined
    if (!feature) {
      setHover(null)
      return
    }
    setHover({
      x: info.x,
      y: info.y,
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
        layers={[countriesLayer]}
        onHover={onHover}
        getCursor={({ isDragging, isHovering }) => {
          if (isHovering) return 'pointer'
          if (!interactive) return 'default'
          return isDragging ? 'grabbing' : 'grab'
        }}
      />

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-border bg-card px-3 py-2 shadow-lg"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <div className="font-bold">{hover.name}</div>
          <div className="text-sm text-muted">
            {layer.title}:{' '}
            <span className="text-text">
              {hover.value === null ? 'no data' : hover.value.toFixed(layer.digits)}
            </span>
          </div>
          <div className="text-xs text-muted">{layer.quarter}</div>
        </div>
      )}
    </div>
  )
}
