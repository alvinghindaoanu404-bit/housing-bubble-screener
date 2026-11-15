import { useEffect, useRef } from 'react'
import type { AppData } from '../data/types'
import { EpisodesTimeline } from '../story/EpisodesTimeline'
import { ModelMetricsCard } from '../story/ModelMetricsCard'
import { MortgageCalculator } from '../story/MortgageCalculator'
import { RomaniaPanel } from '../story/RomaniaPanel'
import { SECTIONS } from '../story/sections'
import type { PanelKey } from '../story/sections'
import { StressPanel } from '../story/StressPanel'
import { Button } from './Button'
import type { ShockControl } from './ShockSlider'

interface StoryProps {
  data: AppData
  /** The stress slider's state, shared with the map. */
  shock: ShockControl
  /** Called with the number of the section that is now in the middle of the screen. */
  onActiveChange: (index: number) => void
  /** Called when the user presses "Explore the map". */
  onExplore: () => void
  /** Hide the cards (used while the map is unlocked). */
  hidden: boolean
}

/** Draw the interactive piece that belongs to a card. */
function Panel({
  panel,
  data,
  shock,
}: {
  panel: PanelKey
  data: AppData
  shock: ShockControl
}) {
  switch (panel) {
    case 'stress':
      return <StressPanel data={data} control={shock} />
    case 'calculator':
      return <MortgageCalculator />
    case 'episodes':
      return <EpisodesTimeline data={data} />
    case 'metrics':
      return <ModelMetricsCard data={data} />
    case 'romania':
      return <RomaniaPanel data={data} />
  }
}

/** The story: one full-screen section per step, each holding a text card. */
export function Story({ data, shock, onActiveChange, onExplore, hidden }: StoryProps) {
  const sectionRefs = useRef<(HTMLElement | null)[]>([])

  // An IntersectionObserver tells us when an element enters part of the screen.
  // The margins shrink that part to a thin line across the middle, so exactly
  // one section is "active" at a time: the one crossing the middle.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onActiveChange(Number((entry.target as HTMLElement).dataset.index))
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    for (const section of sectionRefs.current) {
      if (section) observer.observe(section)
    }
    return () => observer.disconnect()
  }, [onActiveChange])

  const scrollTo = (index: number) =>
    sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth' })

  const last = SECTIONS.length - 1

  return (
    // pointer-events-none lets the mouse reach the map between the cards.
    <div className={`pointer-events-none relative z-10 ${hidden ? 'invisible' : ''}`}>
      {SECTIONS.map((section, index) => (
        <section
          key={section.title}
          ref={(element) => {
            sectionRefs.current[index] = element
          }}
          data-index={index}
          className="flex min-h-screen items-center px-4 py-24 lg:px-12"
        >
          <article className="pointer-events-auto w-full max-w-md rounded-xl border border-border bg-card/95 p-6 shadow-xl">
            <div className="text-sm text-muted">
              {index} / {last}
            </div>
            {index === 0 ? (
              <h1 className="mt-2 text-4xl font-bold">{section.title}</h1>
            ) : (
              <h2 className="mt-2 text-3xl font-bold">{section.title}</h2>
            )}

            {section.text.map((paragraph) => (
              <p key={paragraph} className="mt-4">
                {paragraph.replace('{base_year}', String(data.meta.base_year))}
              </p>
            ))}

            {section.panel && <Panel panel={section.panel} data={data} shock={shock} />}

            {index === 0 && (
              <Button className="mt-6" onClick={() => scrollTo(1)}>
                Start the story ↓
              </Button>
            )}
            {index === last && (
              <Button className="mt-6" onClick={onExplore}>
                Explore the map
              </Button>
            )}
          </article>
        </section>
      ))}
    </div>
  )
}
