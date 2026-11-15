import type { PickingInfo } from '@deck.gl/core'
import { GeoJsonLayer } from '@deck.gl/layers'
import { DeckGL } from '@deck.gl/react'
import { useMemo, useState } from 'react'
import type { CountriesGeoJSON, CountryFeature } from '../data/types'
import { rampColor } from './colorRamp'

// Where the camera starts: above central Europe, tilted 45 degrees.
const INITIAL_VIEW = {
  longitude: 12,
  latitude: 53,
  zoom: 3.3,
  pitch: 45,
  bearing: 0,
  minZoom: 2.5,
  maxZoom: 7,
}

// How tall (in metres on the map) a country with the highest value becomes.
const MAX_HEIGHT_M = 350_000
// A thin slab for countries with no data, so they stay visible and hoverable.
const NO_DATA_HEIGHT_M = 4_000

interface Map3DProps {
  countries: CountriesGeoJSON
  /** The value to draw for each country code; null or absent means "no data". */
  values: Map<string, number | null>
  /** The values that map to the bottom and the top of the colour ramp. */
  min: number
  max: number
  /** Text used in the tooltip. */
  label: string
  quarter: string
  digits: number
}

interface Hover {
  x: number
  y: number
  name: string
  value: number | null
}

export function Map3D({ countries, values, min, max, label, quarter, digits }: Map3DProps) {
  const [hover, setHover] = useState<Hover | null>(null)

  // A layer is one thing drawn on the map; here, the 27 country shapes.
  // useMemo rebuilds it only when its inputs change, not on every mouse move.
  const layer = useMemo(() => {
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
      getFillColor: (feature) => rampColor(valueOf(feature as CountryFeature), min, max),
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
        getFillColor: [values, min, max],
      },
    })
  }, [countries, values, min, max])

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
        initialViewState={INITIAL_VIEW}
        controller // drag to move, scroll to zoom, right-drag to rotate and tilt
        layers={[layer]}
        onHover={onHover}
        getCursor={({ isDragging, isHovering }) =>
          isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
        }
      />

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-border bg-card px-3 py-2 shadow-lg"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <div className="font-bold">{hover.name}</div>
          <div className="text-sm text-muted">
            {label}:{' '}
            <span className="text-text">
              {hover.value === null ? 'no data' : hover.value.toFixed(digits)}
            </span>
          </div>
          <div className="text-xs text-muted">{quarter}</div>
        </div>
      )}
    </div>
  )
}
