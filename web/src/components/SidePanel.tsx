import { useEffect } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { countryName, sourceText } from '../data/helpers'
import type { AppData } from '../data/types'
import { RAMP_HEX } from './colorRamp'
import { StressTiles } from './StressTiles'

interface SidePanelProps {
  data: AppData
  /** The country to show, or null to slide the panel away. */
  geo: string | null
  onClose: () => void
}

// Shared look of the charts.
const AXIS_TICK = { fill: '#8B95AD', fontSize: 11 }
const TOOLTIP_STYLE = {
  background: '#121A2E',
  border: '1px solid #24304D',
  borderRadius: 12,
  fontSize: 12,
}
/** Show only the year on the time axis: "2015-Q1" → "2015". */
const yearOf = (quarter: string) => quarter.slice(0, 4)

const show = (value: number | null | undefined, digits: number) =>
  value === null || value === undefined ? 'no data' : value.toFixed(digits)

/** One "label: value" cell in the latest-values grid. */
function Value({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  )
}

/** A small "Source: ..." line under a chart. */
function Source({ data, period }: { data: AppData; period: string }) {
  return (
    <p className="mt-1 text-xs text-muted">
      Source: {sourceText(data)}. {period}
    </p>
  )
}

/** The panel that slides in from the right when a country is clicked. */
export function SidePanel({ data, geo, onClose }: SidePanelProps) {
  // Close the panel with the Escape key.
  useEffect(() => {
    if (!geo) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [geo, onClose])

  const { meta } = data
  const period = `${meta.first_quarter} to ${meta.last_quarter}.`
  // This country's rows, oldest first (panel.json is already in time order).
  const history = geo ? data.panel.filter((row) => row.geo === geo) : []
  const latest = history.find((row) => row.quarter === meta.last_quarter)
  const episodes = geo ? data.episodes.filter((e) => e.geo === geo) : []
  const risk = latest?.risk_score ?? null

  return (
    <aside
      aria-label="Country details"
      aria-hidden={!geo}
      inert={!geo}
      className={`fixed top-10 right-0 bottom-0 z-20 w-full max-w-sm overflow-y-auto border-l border-border bg-card p-6 shadow-2xl transition-transform duration-300 motion-reduce:transition-none ${
        geo ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {geo && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{countryName(data, geo)}</h2>
              <div className="text-sm text-muted">
                {geo} · latest values, {meta.last_quarter}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close country details"
              className="cursor-pointer rounded-lg border border-border px-3 py-1 text-muted transition duration-150 hover:text-text"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Value label="Real house price index" value={show(latest?.hpi_real, 1)} />
            <Value label="Overvaluation (z-score)" value={show(latest?.overvaluation_z, 2)} />
            <Value label="Price-to-rent" value={show(latest?.price_to_rent, 2)} />
            <Value label="Price-to-income" value={show(latest?.price_to_income, 2)} />
            <Value label="Nominal rate (%)" value={show(latest?.rate_nominal, 2)} />
            <Value label="Real rate (%)" value={show(latest?.rate_real, 2)} />
          </div>

          <h3 className="mt-6 font-bold">Price-to-rent</h3>
          <div className="text-xs text-muted">
            1.0 = long-run average ·{' '}
            <span className="text-[#F2784B]">shaded = bubble episode</span>
          </div>
          <div className="mt-2 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#24304D" vertical={false} />
                <XAxis dataKey="quarter" tick={AXIS_TICK} tickFormatter={yearOf} interval={15} />
                <YAxis tick={AXIS_TICK} domain={['auto', 'auto']} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                {episodes.map((e) => (
                  <ReferenceArea
                    key={e.start}
                    x1={e.start}
                    x2={e.end}
                    fill="#F2784B"
                    fillOpacity={0.3}
                    stroke="none"
                  />
                ))}
                <Line
                  dataKey="price_to_rent"
                  name="Price-to-rent"
                  stroke="#4F8CFF"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Source data={data} period={period} />

          <h3 className="mt-6 font-bold">Interest rates (%)</h3>
          <div className="text-xs">
            <span className="text-[#F2C14E]">— nominal</span>{' '}
            <span className="ml-2 text-[#3FB8AF]">— real</span>
          </div>
          <div className="mt-2 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#24304D" vertical={false} />
                <XAxis dataKey="quarter" tick={AXIS_TICK} tickFormatter={yearOf} interval={15} />
                <YAxis tick={AXIS_TICK} domain={['auto', 'auto']} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line
                  dataKey="rate_nominal"
                  name="Nominal rate"
                  stroke="#F2C14E"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="rate_real"
                  name="Real rate"
                  stroke="#3FB8AF"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Source data={data} period={period} />

          <h3 className="mt-6 font-bold">Risk score</h3>
          <div className="mt-2 flex items-center gap-3">
            <div
              className="relative h-3 flex-1 rounded-full"
              style={{ background: `linear-gradient(to right, ${RAMP_HEX.join(', ')})` }}
            >
              {risk !== null && (
                <div
                  className="absolute -top-1 h-5 w-1.5 -translate-x-1/2 rounded-full bg-white shadow"
                  style={{ left: `${risk * 100}%` }}
                />
              )}
            </div>
            <div className="w-16 text-right text-2xl font-bold">{show(risk, 2)}</div>
          </div>
          <div className="mt-1 flex justify-between pr-[76px] text-xs text-muted">
            <span>0 (low)</span>
            <span>1 (high)</span>
          </div>
          <Source data={data} period={`${meta.last_quarter}.`} />

          <h3 className="mt-6 mb-2 font-bold">Risk score under rate shocks</h3>
          <StressTiles data={data} geo={geo} />
          <Source data={data} period={`${meta.last_quarter}.`} />
        </>
      )}
    </aside>
  )
}
