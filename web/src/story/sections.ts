import type { LayerKey } from './layers'

/** Where the camera is and how it looks at the map. */
export interface Camera {
  longitude: number
  latitude: number
  zoom: number
  /** Tilt in degrees: 0 looks straight down, 60 is almost from the side. */
  pitch: number
  /** Rotation in degrees: 0 means north is up. */
  bearing: number
}

/** One step of the scroll story (CLAUDE.md section 6). */
export interface StorySection {
  title: string
  /** Placeholder text until M4. */
  text: string
  layer: LayerKey
  camera: Camera
  /** Darken the whole map (the text is the focus). */
  dim?: boolean
  /** Keep this country bright and darken the rest. */
  highlightGeo?: string
}

// Camera positions that are used by more than one section.
const EUROPE_HIGH: Camera = { longitude: 12, latitude: 54, zoom: 3.1, pitch: 45, bearing: 0 }
const EUROPE_MEDIUM: Camera = { longitude: 12, latitude: 53, zoom: 3.15, pitch: 35, bearing: 0 }
const SPAIN_IRELAND: Camera = { longitude: -5, latitude: 46, zoom: 4.2, pitch: 50, bearing: 15 }
const ROMANIA: Camera = { longitude: 25, latitude: 45.9, zoom: 5.6, pitch: 50, bearing: -10 }

export const SECTIONS: StorySection[] = [
  {
    title: 'Housing Bubble Screener',
    text: 'An early-warning screener for housing bubbles in EU countries and their exposure to interest-rate risk.',
    layer: 'risk',
    camera: EUROPE_HIGH,
  },
  {
    title: 'The question',
    text: 'Placeholder — why interest rates and house prices are linked, with a mortgage payment calculator.',
    layer: 'risk',
    camera: EUROPE_HIGH,
    dim: true,
  },
  {
    title: 'House prices',
    text: 'Placeholder — what the house price index is, and nominal versus real prices.',
    layer: 'hpi',
    camera: EUROPE_MEDIUM,
  },
  {
    title: 'Prices vs fundamentals',
    text: 'Placeholder — price-to-rent and price-to-income, the "P/E ratio of houses".',
    layer: 'overvaluation',
    camera: EUROPE_MEDIUM,
  },
  {
    title: 'Bubble detection',
    text: 'Placeholder — what the GSADF test does and how bubble episodes are dated.',
    layer: 'overvaluation',
    camera: SPAIN_IRELAND,
  },
  {
    title: 'Interest rates',
    text: 'Placeholder — real versus nominal rates, and the 2022–23 rate shock.',
    layer: 'rate',
    camera: EUROPE_MEDIUM,
  },
  {
    title: 'Early warning',
    text: 'Placeholder — what the model predicts and how well, including misses and false alarms.',
    layer: 'risk',
    camera: EUROPE_MEDIUM,
  },
  {
    title: 'Stress test',
    text: 'Placeholder — which markets are most exposed to a rise in interest rates.',
    layer: 'stress',
    camera: EUROPE_MEDIUM,
  },
  {
    title: 'Romania',
    text: 'Placeholder — the case study: Romania compared with the EU, and the limits of its data.',
    layer: 'risk',
    camera: ROMANIA,
    highlightGeo: 'RO',
  },
  {
    title: 'Explore',
    text: 'Now explore the map yourself: move it, zoom in, and hover any country.',
    layer: 'risk',
    camera: EUROPE_HIGH,
  },
]
