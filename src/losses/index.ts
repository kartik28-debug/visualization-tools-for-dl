export * from './types'
export { quadratic } from './quadratic'
export { rosenbrock } from './rosenbrock'
export { himmelblau } from './himmelblau'
export { createRegressionLoss, generateDataset } from './regression'

import { quadratic } from './quadratic'
import { rosenbrock } from './rosenbrock'
import { himmelblau } from './himmelblau'
import type { LossFunction, LossFunctionName } from './types'

export const LOSS_REGISTRY: Partial<Record<LossFunctionName, LossFunction>> = {
  quadratic,
  rosenbrock,
  himmelblau,
  // regression is created dynamically from dataset config
}
