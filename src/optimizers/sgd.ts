import type { OptimizerDefinition, Vec2, OptimizerConfig } from './types'

// SGD: θ(t+1) = θ(t) - η ∇L(θ(t))
export const sgd: OptimizerDefinition = {
  name: 'sgd',
  label: 'Vanilla SGD',
  color: '#22d3ee',
  initialState: () => ({}),
  step(params: Vec2, grad: Vec2, config: OptimizerConfig) {
    return {
      newParams: {
        w: params.w - config.learningRate * grad.w,
        b: params.b - config.learningRate * grad.b,
      },
      newInternalState: {},
    }
  },
}
