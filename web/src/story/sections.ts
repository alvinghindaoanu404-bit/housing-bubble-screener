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

/** The interactive pieces a card can contain, below its text. */
export type PanelKey = 'calculator' | 'episodes' | 'metrics' | 'romania'

/** One step of the scroll story (CLAUDE.md section 6). */
export interface StorySection {
  title: string
  /** One entry per paragraph. "{base_year}" is replaced with the value from meta.json. */
  text: string[]
  layer: LayerKey
  camera: Camera
  /** The interactive piece shown under the text, if any. */
  panel?: PanelKey
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
    text: [
      'An early-warning screener for housing bubbles in the 27 EU countries, and for how exposed each market is to rising interest rates. Case study: Romania.',
      'Scroll to follow the thesis step by step. Each card explains one step and what is calculated in it.',
    ],
    layer: 'risk',
    camera: EUROPE_HIGH,
  },
  {
    title: 'The question',
    text: [
      'Most homes are bought with a loan. When interest rates are low, the same monthly payment supports a bigger loan, so buyers can bid more and prices rise. When rates go up, the reverse happens: payments jump and demand weakens.',
      'The thesis asks two things. Which EU housing markets show signs of a bubble? And which would be hurt most if interest rates rose?',
      'Try it: move the sliders and watch the monthly payment.',
    ],
    layer: 'risk',
    camera: EUROPE_HIGH,
    panel: 'calculator',
    dim: true,
  },
  {
    title: 'House prices',
    text: [
      'The house price index (HPI) tracks how home prices change over time. It is an index, not a price in euros: the base year {base_year} is set to 100, so a value of 120 means prices are 20% above that year.',
      'Nominal prices are the prices people actually pay. Real prices remove general inflation, so a rise in real prices means homes became more expensive compared with everything else. The thesis works with real prices.',
      'On the map, taller and redder countries have a higher real price index.',
    ],
    layer: 'hpi',
    camera: EUROPE_MEDIUM,
  },
  {
    title: 'Prices vs fundamentals',
    text: [
      'A high price is not automatically a bubble. What matters is the price compared with what supports it: the rent a home could earn and the income of the people buying it.',
      'Price-to-rent is the "P/E ratio of houses": the price of the asset divided by the income it brings. Price-to-income measures affordability. Both are expressed relative to each country\'s own long-run average, where 1.0 means "average".',
      'The map shows overvaluation: how many standard deviations a country\'s valuation sits above its own average (red) or below it (blue).',
    ],
    layer: 'overvaluation',
    camera: EUROPE_MEDIUM,
  },
  {
    title: 'Bubble detection',
    text: [
      'A bubble is more than a high price. It is a price that grows explosively, feeding on itself, like a snowball rolling downhill: the bigger it gets, the faster it grows.',
      'The GSADF test looks for exactly this pattern. It slides windows of many different lengths over the price-to-rent series and checks whether growth inside each one has turned explosive instead of steady.',
      'A second step dates the episodes: it marks the quarter where explosive growth starts and the quarter where it ends. The strip below shows every episode found.',
    ],
    layer: 'overvaluation',
    camera: SPAIN_IRELAND,
    panel: 'episodes',
  },
  {
    title: 'Interest rates',
    text: [
      'The nominal rate is the rate written in the loan contract. The real rate subtracts inflation, and it is the better measure of how expensive borrowing truly is.',
      'For years, interest rates in Europe were very low, which made large loans cheap. In 2022–23, central banks raised rates quickly to fight high inflation, and markets that had grown used to cheap credit were suddenly tested.',
      'The map shows each country\'s real interest rate.',
    ],
    layer: 'rate',
    camera: EUROPE_MEDIUM,
  },
  {
    title: 'Early warning',
    text: [
      'The screener combines the signals into one number per country: the risk score, the model\'s estimated probability (from 0 to 1) that the market is heading into a bubble episode.',
      'A warning system is only useful if it is tested honestly. The model learns from the earlier part of the data and is then judged on later quarters it has never seen.',
      'The results below include what went wrong: the episodes the model missed and the alarms that turned out to be false.',
    ],
    layer: 'risk',
    camera: EUROPE_MEDIUM,
    panel: 'metrics',
  },
  {
    title: 'Stress test',
    text: [
      'What if interest rates rose further? The stress test recalculates the risk score under a rate shock. Shocks are measured in basis points (bp): 100 bp is one percentage point.',
      'Markets where the score climbs the most are the ones most exposed to a rate rise.',
      'The map shows the risk score after a +200 bp shock.',
    ],
    layer: 'stress',
    camera: EUROPE_MEDIUM,
  },
  {
    title: 'Romania',
    text: [
      'Romania is the case study of the thesis. The table compares its latest values with the middle of the EU, and shows how its risk score reacts to rate shocks.',
      'Data limits to keep in mind: Romania\'s series are shorter than those of older member states, and its rental market is small, which makes price-to-rent harder to interpret.',
    ],
    layer: 'risk',
    camera: ROMANIA,
    panel: 'romania',
    highlightGeo: 'RO',
  },
  {
    title: 'Explore',
    text: ['Now explore the map yourself: move it, zoom in, and hover any country.'],
    layer: 'risk',
    camera: EUROPE_HIGH,
  },
]
