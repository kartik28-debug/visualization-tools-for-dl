import React from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'
import { OPTIMIZER_REGISTRY, OPTIMIZER_ORDER } from '../../optimizers'
import { formatNum, formatShort } from '../../utils/math'
import type { OptimizerName } from '../../optimizers/types'

function StatusBadge({ converged, diverged }: { converged: boolean; diverged: boolean }) {
  if (diverged) return (
    <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
      <AlertTriangle size={9} className="mr-1" />Diverged
    </span>
  )
  if (converged) return (
    <span className="badge" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
      <CheckCircle size={9} className="mr-1" />Converged
    </span>
  )
  return null
}

export function OptimizerMetricCard({ name }: { name: OptimizerName }) {
  const { optimizerStates, lossFunction } = useSimulationStore()
  const state = optimizerStates[name]
  const def = OPTIMIZER_REGISTRY[name]

  if (!state) {
    return (
      <div className="panel p-3 rounded-xl" style={{ borderColor: `${def.color}20` }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ background: def.color }} />
          <span className="text-xs font-semibold" style={{ color: def.color }}>{def.label}</span>
        </div>
        <div className="text-xs" style={{ color: '#363e52' }}>Not started</div>
      </div>
    )
  }

  const last = state.history[state.history.length - 1]
  const hasOptimum = !!lossFunction.globalMinimum

  return (
    <div className="panel p-3 rounded-xl animate-fade-in"
      style={{ borderColor: `${def.color}25`, background: `${def.color}08` }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: def.color }} />
          <span className="text-xs font-semibold" style={{ color: def.color }}>{def.label}</span>
        </div>
        <StatusBadge converged={state.converged} diverged={state.diverged} />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {([
          { label: 'Epoch', value: state.epoch },
          { label: 'Loss', value: formatNum(last.loss, 5) },
          { label: 'Best Loss', value: formatNum(state.bestLoss, 5) },
          { label: '‖∇L‖', value: formatNum(last.gradNorm, 5) },
          { label: 'w', value: formatShort(last.w) },
          { label: 'b', value: formatShort(last.b) },
          ...(hasOptimum && last.distToOptimum !== null
            ? [{ label: 'Dist★', value: formatShort(last.distToOptimum) }]
            : []),
          { label: 'Updates', value: state.epoch },
        ] as { label: string; value: string | number }[]).map(({ label, value }) => (
          <div key={label} className="rounded p-1.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <div className="text-[9px] uppercase tracking-wide mb-0.5" style={{ color: '#5a6478' }}>{label}</div>
            <div className="mono text-[11px] font-medium" style={{ color: '#e8eaf0' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MetricsPanel() {
  const { selectedOptimizers } = useSimulationStore()

  if (selectedOptimizers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs" style={{ color: '#363e52' }}>
        Select optimizers to see metrics
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto">
      {OPTIMIZER_ORDER
        .filter((n) => selectedOptimizers.includes(n))
        .map((name) => (
          <OptimizerMetricCard key={name} name={name} />
        ))
      }
    </div>
  )
}
