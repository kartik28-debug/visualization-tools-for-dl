// ============================================================
// Optimizer Types — shared interface for all optimizer engines
// ============================================================

export interface Vec2 { w: number; b: number }

export type OptimizerName =
  | 'sgd'
  | 'momentum'
  | 'nesterov'
  | 'adagrad'
  | 'rmsprop'
  | 'adam'
  | 'adamw'

export interface OptimizerConfig {
  learningRate: number
  momentum: number      // β for momentum / Nesterov
  beta1: number         // Adam β1
  beta2: number         // Adam β2
  epsilon: number       // numerical stability
  weightDecay: number   // AdamW decoupled weight decay
}

export const DEFAULT_CONFIG: OptimizerConfig = {
  learningRate: 0.05,
  momentum: 0.9,
  beta1: 0.9,
  beta2: 0.999,
  epsilon: 1e-8,
  weightDecay: 0.01,
}

export interface StepRecord {
  epoch: number
  w: number
  b: number
  loss: number
  gradNorm: number
  gradW: number
  gradB: number
  distToOptimum: number | null
}

export interface OptimizerState {
  params: Vec2
  config: OptimizerConfig
  // internal state (different per optimizer)
  internalState: Record<string, unknown>
  epoch: number
  history: StepRecord[]
  converged: boolean
  diverged: boolean
  bestLoss: number
  initialLoss: number
}

export interface OptimizerResult {
  newParams: Vec2
  newInternalState: Record<string, unknown>
}

export interface OptimizerDefinition {
  name: OptimizerName
  label: string
  color: string
  step(
    params: Vec2,
    grad: Vec2,
    config: OptimizerConfig,
    internalState: Record<string, unknown>,
    epoch: number
  ): OptimizerResult
  initialState(): Record<string, unknown>
}

// Convergence threshold: gradient norm below this = converged
export const CONVERGENCE_THRESHOLD = 1e-4
// Divergence threshold: loss above this = diverged
export const DIVERGENCE_THRESHOLD = 1e7
