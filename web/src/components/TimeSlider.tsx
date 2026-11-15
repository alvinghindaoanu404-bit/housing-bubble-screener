interface TimeSliderProps {
  /** All quarters, oldest first. */
  quarters: string[]
  /** The position of the quarter shown now (0 = the oldest). */
  index: number
  onChange: (index: number) => void
  playing: boolean
  onTogglePlay: () => void
}

/** A play/pause button and a slider that moves the map through the quarters. */
export function TimeSlider({ quarters, index, onChange, playing, onTogglePlay }: TimeSliderProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={playing ? 'Pause' : 'Play through the quarters'}
        className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full bg-accent text-white transition duration-150 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.97]"
      >
        {playing ? '❚❚' : '▶'}
      </button>

      <label className="flex flex-1 flex-col">
        <span className="flex justify-between text-xs text-muted">
          <span>{quarters[0]}</span>
          <span className="text-sm font-bold text-text">{quarters[index]}</span>
          <span>{quarters[quarters.length - 1]}</span>
        </span>
        <input
          type="range"
          aria-label="Quarter"
          min={0}
          max={quarters.length - 1}
          step={1}
          value={index}
          onChange={(event) => onChange(Number(event.target.value))}
          className="mt-1 w-full accent-accent"
        />
      </label>
    </div>
  )
}
