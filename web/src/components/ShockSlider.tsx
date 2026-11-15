import { formatShock } from '../data/helpers'

/** What the stress slider needs: the available shocks, the chosen one,
 *  and what to call when the user picks another. */
export interface ShockControl {
  /** The shocks found in stress.json, smallest first. */
  shocks: number[]
  value: number
  onChange: (shockBp: number) => void
}

/** A slider that steps through the interest-rate shocks in stress.json. */
export function ShockSlider({ shocks, value, onChange }: ShockControl) {
  return (
    <label className="block">
      <span className="flex justify-between text-sm">
        <span className="text-muted">Interest-rate shock</span>
        <span className="font-bold">{formatShock(value)}</span>
      </span>
      {/* The slider moves over positions 0, 1, 2...; each position is one shock. */}
      <input
        type="range"
        min={0}
        max={shocks.length - 1}
        step={1}
        value={Math.max(0, shocks.indexOf(value))}
        aria-valuetext={formatShock(value)}
        onChange={(event) => onChange(shocks[Number(event.target.value)])}
        className="mt-1 w-full accent-accent"
      />
      <span className="flex justify-between text-xs text-muted">
        {shocks.map((shock) => (
          <span key={shock}>{shock > 0 ? `+${shock}` : shock}</span>
        ))}
      </span>
    </label>
  )
}
