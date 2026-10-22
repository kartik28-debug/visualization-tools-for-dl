// Optimizer registry — export all implementations from one place
export { sgd } from './sgd'
export { momentumOptimizer as momentum } from './momentum'
export { nesterov } from './nesterov'
export { adagrad } from './adagrad'
export { rmsprop } from './rmsprop'
export { adam } from './adam'
export { adamw } from './adamw'

export * from './types'

import { sgd } from './sgd'
import { momentumOptimizer as momentum } from './momentum'
import { nesterov } from './nesterov'
import { adagrad } from './adagrad'
import { rmsprop } from './rmsprop'
import { adam } from './adam'
import { adamw } from './adamw'
import type { OptimizerDefinition, OptimizerName } from './types'

export const OPTIMIZER_REGISTRY: Record<OptimizerName, OptimizerDefinition> = {
  sgd,
  momentum,
  nesterov,
  adagrad,
  rmsprop,
  adam,
  adamw,
}

export const OPTIMIZER_ORDER: OptimizerName[] = [
  'sgd', 'momentum', 'nesterov', 'adagrad', 'rmsprop', 'adam', 'adamw'
]
