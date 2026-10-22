// Experiment presets — each fully configures the simulation state
import type { OptimizerName, OptimizerConfig } from '../optimizers/types'
import type { LossFunctionName } from '../losses/types'

export interface ExperimentPreset {
  id: string
  label: string
  description: string
  lossFunction: LossFunctionName
  selectedOptimizers: OptimizerName[]
  config: Partial<OptimizerConfig>
  initialParams: { w: number; b: number }
  maxEpochs: number
}

export const PRESETS: ExperimentPreset[] = [
  {
    id: 'momentum-vs-sgd',
    label: 'Momentum vs SGD',
    description: 'See how momentum smooths oscillations and accelerates along shallow directions.',
    lossFunction: 'quadratic',
    selectedOptimizers: ['sgd', 'momentum'],
    config: { learningRate: 0.05, momentum: 0.9 },
    initialParams: { w: -2, b: 2 },
    maxEpochs: 100,
  },
  {
    id: 'lr-too-high',
    label: 'Learning Rate Too High',
    description: 'Observe overshooting, oscillation, and potential divergence with LR = 0.5.',
    lossFunction: 'quadratic',
    selectedOptimizers: ['sgd', 'momentum'],
    config: { learningRate: 0.5, momentum: 0.9 },
    initialParams: { w: -2, b: 2 },
    maxEpochs: 60,
  },
  {
    id: 'lr-too-low',
    label: 'Learning Rate Too Low',
    description: 'See how a small LR leads to slow but stable convergence.',
    lossFunction: 'quadratic',
    selectedOptimizers: ['sgd', 'adam'],
    config: { learningRate: 0.001, momentum: 0.9 },
    initialParams: { w: -2, b: 2 },
    maxEpochs: 300,
  },
  {
    id: 'adam-vs-rmsprop',
    label: 'Adam vs RMSProp',
    description: 'Compare two adaptive methods starting from the same point.',
    lossFunction: 'quadratic',
    selectedOptimizers: ['adam', 'rmsprop'],
    config: { learningRate: 0.05, beta1: 0.9, beta2: 0.999 },
    initialParams: { w: -2, b: 2 },
    maxEpochs: 100,
  },
  {
    id: 'narrow-valley',
    label: 'Narrow Valley (Rosenbrock)',
    description: 'The Rosenbrock function reveals why adaptive optimizers shine in ill-conditioned landscapes.',
    lossFunction: 'rosenbrock',
    selectedOptimizers: ['sgd', 'momentum', 'adam'],
    config: { learningRate: 0.002, momentum: 0.9 },
    initialParams: { w: -1.5, b: 1.5 },
    maxEpochs: 500,
  },
  {
    id: 'adam-vs-adamw',
    label: 'Adam vs AdamW',
    description: 'Demonstrates decoupled weight decay. Effect is visible when params are far from origin.',
    lossFunction: 'quadratic',
    selectedOptimizers: ['adam', 'adamw'],
    config: { learningRate: 0.05, weightDecay: 0.1 },
    initialParams: { w: -4, b: 3 },
    maxEpochs: 150,
  },
]
