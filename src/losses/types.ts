import type { Vec2 } from '../optimizers/types'

export type LossFunctionName = 'quadratic' | 'rosenbrock' | 'himmelblau' | 'regression'

export interface LossFunction {
  name: LossFunctionName
  label: string
  description: string
  /** Evaluate loss at (w, b) */
  loss(w: number, b: number): number
  /** Compute gradient [∂L/∂w, ∂L/∂b] */
  gradient(w: number, b: number): Vec2
  /** Known global minimum, if any */
  globalMinimum: Vec2 | null
  /** Minimum loss value */
  globalMinLoss: number | null
  /** Suggested parameter range for plotting */
  plotRange: { wMin: number; wMax: number; bMin: number; bMax: number }
  /** Suggested initial position for demonstrations */
  suggestedInit: Vec2
}
