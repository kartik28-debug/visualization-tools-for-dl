import type { OptimizerName } from '../optimizers/types'
import type { OptimizerState } from '../optimizers/types'

export function exportCSV(
  optimizerStates: Partial<Record<OptimizerName, OptimizerState>>,
  lossName: string
): void {
  const rows: string[] = []
  rows.push('optimizer,lossFunction,epoch,w,b,loss,gradNorm,gradW,gradB,distToOptimum')

  for (const [name, state] of Object.entries(optimizerStates) as [OptimizerName, OptimizerState][]) {
    for (const r of state.history) {
      rows.push([
        name,
        lossName,
        r.epoch,
        r.w.toFixed(6),
        r.b.toFixed(6),
        r.loss.toFixed(6),
        r.gradNorm.toFixed(6),
        r.gradW.toFixed(6),
        r.gradB.toFixed(6),
        r.distToOptimum !== null ? r.distToOptimum.toFixed(6) : '',
      ].join(','))
    }
  }

  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `optimizer-lab-${lossName}-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
