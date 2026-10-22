import React, { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import { useSimulationStore } from '../../store/simulationStore'
import { OPTIMIZER_REGISTRY } from '../../optimizers'
import type { OptimizerName } from '../../optimizers/types'

type ChartType = 'loss' | 'gradNorm' | 'w' | 'b' | 'dist'

const CHART_META: Record<ChartType, { label: string; yLabel: string; logScale?: boolean }> = {
  loss:     { label: 'Loss', yLabel: 'Loss' },
  gradNorm: { label: 'Gradient Norm', yLabel: '‖∇L‖' },
  w:        { label: 'Parameter w', yLabel: 'w' },
  b:        { label: 'Parameter b', yLabel: 'b' },
  dist:     { label: 'Distance to Optimum', yLabel: 'dist' },
}

function buildChartData(
  selectedOptimizers: OptimizerName[],
  optimizerStates: ReturnType<typeof useSimulationStore.getState>['optimizerStates'],
  key: ChartType
) {
  // Find max epoch across all optimizers
  let maxEpoch = 0
  for (const name of selectedOptimizers) {
    const s = optimizerStates[name]
    if (s) maxEpoch = Math.max(maxEpoch, s.history.length - 1)
  }
  if (maxEpoch === 0) return []

  const rows: Record<string, number | null>[] = []
  for (let epoch = 0; epoch <= maxEpoch; epoch++) {
    const row: Record<string, number | null> = { epoch }
    for (const name of selectedOptimizers) {
      const s = optimizerStates[name]
      if (!s || epoch >= s.history.length) {
        row[name] = null
        continue
      }
      const r = s.history[epoch]
      switch (key) {
        case 'loss':     row[name] = r.loss; break
        case 'gradNorm': row[name] = r.gradNorm; break
        case 'w':        row[name] = r.w; break
        case 'b':        row[name] = r.b; break
        case 'dist':     row[name] = r.distToOptimum; break
      }
    }
    rows.push(row)
  }
  return rows
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="panel p-2 text-xs" style={{ minWidth: 120, fontSize: 11 }}>
      <div className="mb-1" style={{ color: '#5a6478' }}>Epoch {label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: p.color }}>{OPTIMIZER_REGISTRY[p.dataKey as OptimizerName]?.label ?? p.dataKey}</span>
          <span className="mono ml-auto" style={{ color: '#e8eaf0' }}>
            {typeof p.value === 'number' ? p.value.toFixed(5) : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}

interface MetricChartProps {
  chartType: ChartType
  height?: number
}

export function MetricChart({ chartType, height = 200 }: MetricChartProps) {
  const { selectedOptimizers, optimizerStates, lossFunction } = useSimulationStore()
  const [logScale, setLogScale] = useState(false)

  const data = useMemo(
    () => buildChartData(selectedOptimizers, optimizerStates, chartType),
    [selectedOptimizers, optimizerStates, chartType]
  )

  const meta = CHART_META[chartType]
  const hasData = data.length > 0

  // Reference lines for convergence targets
  const refValue = chartType === 'w' && lossFunction.globalMinimum
    ? lossFunction.globalMinimum.w
    : chartType === 'b' && lossFunction.globalMinimum
    ? lossFunction.globalMinimum.b
    : null

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#5a6478' }}>
          {meta.label}
        </span>
        {(chartType === 'loss' || chartType === 'gradNorm') && (
          <button
            onClick={() => setLogScale((s) => !s)}
            className="text-[9px] px-1.5 py-0.5 rounded"
            style={{
              background: logScale ? 'rgba(34,211,238,0.1)' : 'transparent',
              color: logScale ? '#22d3ee' : '#5a6478',
              border: `1px solid ${logScale ? 'rgba(34,211,238,0.25)' : '#252B38'}`,
            }}
          >
            log
          </button>
        )}
      </div>
      {!hasData ? (
        <div className="flex items-center justify-center text-[11px]"
          style={{ height, color: '#363e52' }}>
          Press Play to start
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
            <XAxis
              dataKey="epoch"
              tick={{ fontSize: 9, fill: '#5a6478', fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#252B38' }}
            />
            <YAxis
              scale={logScale ? 'log' : 'auto'}
              domain={logScale ? ['auto', 'auto'] : ['auto', 'auto']}
              tick={{ fontSize: 9, fill: '#5a6478', fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: '#252B38' }}
              allowDataOverflow={false}
              label={{
                value: meta.yLabel,
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 9, fill: '#5a6478' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {refValue !== null && (
              <ReferenceLine
                y={refValue}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 4"
                label={{ value: 'optimal', fill: '#5a6478', fontSize: 9 }}
              />
            )}
            {selectedOptimizers.map((name) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={OPTIMIZER_REGISTRY[name].color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function ChartsPanel() {
  const [activeChart, setActiveChart] = useState<ChartType>('loss')
  const charts: ChartType[] = ['loss', 'gradNorm', 'w', 'b', 'dist']

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Chart tabs */}
      <div className="flex gap-1 flex-wrap">
        {charts.map((c) => (
          <button
            key={c}
            onClick={() => setActiveChart(c)}
            className="px-2 py-1 text-[10px] rounded"
            style={{
              background: activeChart === c ? 'rgba(34,211,238,0.1)' : 'transparent',
              color: activeChart === c ? '#22d3ee' : '#5a6478',
              border: `1px solid ${activeChart === c ? 'rgba(34,211,238,0.25)' : '#252B38'}`,
            }}
          >
            {CHART_META[c].label}
          </button>
        ))}
      </div>
      <MetricChart chartType={activeChart} height={200} />
    </div>
  )
}
