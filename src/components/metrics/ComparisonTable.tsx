import React, { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'
import { OPTIMIZER_REGISTRY, OPTIMIZER_ORDER } from '../../optimizers'
import { formatNum, formatShort } from '../../utils/math'
import type { OptimizerName } from '../../optimizers/types'

type SortKey = 'name' | 'loss' | 'bestLoss' | 'gradNorm' | 'epoch' | 'dist'
type SortDir = 'asc' | 'desc'

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ArrowUpDown size={10} style={{ opacity: 0.3 }} />
  return sortDir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />
}

interface THProps {
  col: SortKey
  label: string
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}

function TableHeader({ col, label, sortKey, sortDir, onSort }: THProps) {
  return (
    <th>
      <button
        onClick={() => onSort(col)}
        className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-semibold w-full"
        style={{ color: sortKey === col ? '#22d3ee' : '#5a6478' }}
      >
        {label} <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </button>
    </th>
  )
}

interface TableRow {
  name: OptimizerName
  label: string
  color: string
  loss: number
  bestLoss: number
  gradNorm: number
  epoch: number
  dist: number | null
  converged: boolean
  diverged: boolean
  runtime: number | null
}

export function ComparisonTable() {
  const { selectedOptimizers, optimizerStates, lossFunction, status, startTime, endTime } = useSimulationStore()
  const [sortKey, setSortKey] = useState<SortKey>('loss')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const rows: TableRow[] = useMemo(() => {
    return OPTIMIZER_ORDER
      .filter((n) => selectedOptimizers.includes(n))
      .map((name) => {
        const state = optimizerStates[name]
        const def = OPTIMIZER_REGISTRY[name]
        if (!state) return null
        const last = state.history[state.history.length - 1]
        return {
          name,
          label: def.label,
          color: def.color,
          loss: last.loss,
          bestLoss: state.bestLoss,
          gradNorm: last.gradNorm,
          epoch: state.epoch,
          dist: last.distToOptimum,
          converged: state.converged,
          diverged: state.diverged,
          runtime: endTime && startTime ? endTime - startTime : null,
        } satisfies TableRow
      })
      .filter(Boolean) as TableRow[]
  }, [selectedOptimizers, optimizerStates, endTime, startTime])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let av: number, bv: number
      switch (sortKey) {
        case 'name':     return sortDir === 'asc' ? a.label.localeCompare(b.label) : b.label.localeCompare(a.label)
        case 'loss':     av = a.diverged ? Infinity : a.loss; bv = b.diverged ? Infinity : b.loss; break
        case 'bestLoss': av = a.bestLoss; bv = b.bestLoss; break
        case 'gradNorm': av = a.gradNorm; bv = b.gradNorm; break
        case 'epoch':    av = a.epoch; bv = b.epoch; break
        case 'dist':     av = a.dist ?? Infinity; bv = b.dist ?? Infinity; break
        default:         return 0
      }
      return sortDir === 'asc' ? av - bv : bv - av
    })
  }, [rows, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const hasOptimum = !!lossFunction.globalMinimum

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs" style={{ color: '#363e52' }}>
        Run the simulation to see comparison data
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #252B38' }}>
            <TableHeader col="name" label="Optimizer" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <TableHeader col="loss" label="Loss" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <TableHeader col="bestLoss" label="Best" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <TableHeader col="gradNorm" label="‖∇L‖" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <TableHeader col="epoch" label="Epochs" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            {hasOptimum && <TableHeader col="dist" label="Dist★" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />}
            <th className="text-[9px] uppercase tracking-wider text-left" style={{ color: '#5a6478' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.name}
              style={{ borderBottom: '1px solid #1a2030' }}
              className="transition-colors hover:bg-white/[0.02]">
              {/* Optimizer */}
              <td className="py-2 pr-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                  <span style={{ color: row.color }} className="font-medium">{row.label}</span>
                </div>
              </td>
              {/* Loss */}
              <td className="py-2 pr-3 mono" style={{ color: row.diverged ? '#f87171' : '#e8eaf0' }}>
                {row.diverged ? '±∞' : formatNum(row.loss, 4)}
              </td>
              {/* Best loss */}
              <td className="py-2 pr-3 mono" style={{ color: '#e8eaf0' }}>
                {formatNum(row.bestLoss, 4)}
              </td>
              {/* Grad norm */}
              <td className="py-2 pr-3 mono" style={{ color: '#8892a4' }}>
                {formatNum(row.gradNorm, 4)}
              </td>
              {/* Epochs */}
              <td className="py-2 pr-3 mono" style={{ color: '#8892a4' }}>
                {row.epoch}
              </td>
              {/* Distance */}
              {hasOptimum && (
                <td className="py-2 pr-3 mono" style={{ color: '#8892a4' }}>
                  {row.dist !== null ? formatShort(row.dist) : '—'}
                </td>
              )}
              {/* Status */}
              <td className="py-2">
                {row.diverged ? (
                  <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                    Diverged
                  </span>
                ) : row.converged ? (
                  <span className="badge" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' }}>
                    Converged
                  </span>
                ) : (
                  <span className="mono text-[10px]" style={{ color: '#5a6478' }}>
                    {status === 'done' ? 'Max epochs' : 'Running'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 0 && rows[0].runtime && (
        <div className="mt-2 text-[10px]" style={{ color: '#363e52' }}>
          ⚠ Runtime is approximate — browser scheduling and visualization overhead affect measurements.
        </div>
      )}
    </div>
  )
}
