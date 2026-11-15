import { NO_DATA_HEX, RAMP_HEX } from '../theme'

/** A colour as [red, green, blue], each from 0 to 255 (the format deck.gl uses). */
export type RGB = [number, number, number]

/** Turn "#1034A6" into [16, 52, 166]. */
export function hexToRgb(hex: string): RGB {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const RAMP_RGB = RAMP_HEX.map(hexToRgb)
export const NO_DATA_RGB = hexToRgb(NO_DATA_HEX)

/** Turn a value between min and max into a colour on the ramp.
 *  Missing values (null) become grey. */
export function rampColor(value: number | null, min: number, max: number): RGB {
  if (value === null) return NO_DATA_RGB
  // Where the value sits between min and max, as a number from 0 to 1.
  const share = Math.min(1, Math.max(0, (value - min) / (max - min)))
  // The ramp has 5 colours, so 4 steps between them. Find the two neighbours...
  const position = share * (RAMP_RGB.length - 1)
  const index = Math.min(Math.floor(position), RAMP_RGB.length - 2)
  const mix = position - index
  const from = RAMP_RGB[index]
  const to = RAMP_RGB[index + 1]
  // ...and blend them.
  return [
    Math.round(from[0] + (to[0] - from[0]) * mix),
    Math.round(from[1] + (to[1] - from[1]) * mix),
    Math.round(from[2] + (to[2] - from[2]) * mix),
  ]
}
