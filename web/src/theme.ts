// The colour palette for the parts that are not styled with Tailwind classes:
// the 3D map and the charts. Carbon black, green for low, race red for high.
// The same colours are listed in src/index.css: keep the two files in step.

export const COLORS = {
  /** Page background: carbon black. */
  bg: '#09090B',
  card: '#141417',
  border: '#2A2A30',
  /** Grey, for secondary text and chart axes. */
  muted: '#9A9AA3',
  /** Pale sand, for chart lines. */
  pale: '#E6E2D3',
  /** A light green that stays readable on the dark background. */
  green: '#6DBB7B',
  /** A lighter red for marks on the dark background. */
  accentSoft: '#FF6B5C',
}

/** The map's colour scale, low → high: shades of green → shades of race red.
 *  The pale middle keeps average values readable (green blended straight
 *  into red would turn muddy brown). */
export const RAMP_HEX = ['#1E7B3C', '#6DBB7B', '#E6E2D3', '#EE7B6B', '#D40000']

/** Colour for countries with missing data: a neutral grey, outside the scale. */
export const NO_DATA_HEX = '#4A4A52'

/** The race red glow around buttons when the mouse is over them. */
export const BUTTON_GLOW = '0 0 24px rgba(212, 0, 0, 0.6)'
