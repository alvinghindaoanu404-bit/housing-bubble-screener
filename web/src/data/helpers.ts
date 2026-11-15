import type { AppData, Quarter } from './types'

/** Turn "2025-Q3" into a plain count of quarters, so quarters can be compared
 *  and subtracted (2025-Q3 minus 2025-Q1 = 2). */
export function quarterNumber(quarter: Quarter) {
  const [year, q] = quarter.split('-Q').map(Number)
  return year * 4 + (q - 1)
}

/** Look up a country's name from its code, e.g. "RO" → "Romania". */
export function countryName(data: AppData, geo: string) {
  const feature = data.countries.features.find((f) => f.properties.geo === geo)
  return feature ? feature.properties.name : geo
}

/** Write a rate shock with its sign and unit: 200 → "+200 bp", -100 → "-100 bp". */
export function formatShock(shockBp: number) {
  return `${shockBp > 0 ? '+' : ''}${shockBp} bp`
}

/** The text for a "Source: ..." line, built from meta.json. */
export function sourceText(data: AppData) {
  return data.meta.sources.map((s) => `${s.name} (${s.code})`).join(' · ')
}
