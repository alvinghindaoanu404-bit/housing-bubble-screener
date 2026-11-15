// The colour palette for the parts that are not styled with Tailwind classes:
// the 3D map and the charts. Egyptian blue, stone blue and a little scarlet.
// The same colours are listed in src/index.css: keep the two files in step.

export const COLORS = {
  /** Page background: a very deep Egyptian blue. */
  bg: '#060C24',
  card: '#0D1840',
  border: '#253878',
  /** Stone blue, for secondary text and chart axes. */
  muted: '#93A7BE',
  /** Light stone blue, for chart lines. */
  stone: '#A9BCD0',
  /** A bright Egyptian blue that stays readable on the dark background. */
  egyptianBright: '#5B82E8',
  /** A lighter scarlet for marks on the dark background. */
  accentSoft: '#FF6A4D',
}

/** The map's colour scale, low → high:
 *  Egyptian blue → stone blue → scarlet. */
export const RAMP_HEX = ['#1034A6', '#4F74C4', '#A9BCD0', '#F07A5E', '#FF2400']

/** Colour for countries with missing data: a neutral grey, outside the scale. */
export const NO_DATA_HEX = '#454C5E'

/** The scarlet glow around buttons when the mouse is over them. */
export const BUTTON_GLOW = '0 0 24px rgba(255, 36, 0, 0.55)'
