import { LAYER_OPTIONS } from '../story/layers'
import type { LayerKey } from '../story/layers'

interface LayerSwitcherProps {
  value: LayerKey
  onChange: (key: LayerKey) => void
}

/** A row of buttons that choose what the map shows. */
export function LayerSwitcher({ value, onChange }: LayerSwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Map layer"
      className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1"
    >
      {LAYER_OPTIONS.map((option) => {
        const selected = option.key === value
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.key)}
            className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition duration-150 focus-visible:outline-2 focus-visible:outline-white ${
              selected ? 'bg-accent font-bold text-white' : 'text-muted hover:text-text'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
