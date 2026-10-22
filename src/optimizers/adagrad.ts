import type { OptimizerDefinition, Vec2, OptimizerConfig } from './types'

interface AdaGradState { Gw: number; Gb: number }

// AdaGrad:
//   G(t) = G(t-1) + g(t)²
//   θ(t+1) = θ(t) - (η / √(G(t) + ε)) · g(t)
export const adagrad: OptimizerDefinition = {
  name: 'adagrad',
  label: 'AdaGrad',
  color: '#facc15',
  initialState: () => ({ Gw: 0, Gb: 0 } as AdaGradState),
  step(params: Vec2, grad: Vec2, config: OptimizerConfig, internalState: Record<string, unknown>) {
    const state = internalState as AdaGradState
    const Gw = state.Gw + grad.w * grad.w
    const Gb = state.Gb + grad.b * grad.b
    return {
      newParams: {
        w: params.w - (config.learningRate / Math.sqrt(Gw + config.epsilon)) * grad.w,
        b: params.b - (config.learningRate / Math.sqrt(Gb + config.epsilon)) * grad.b,
      },
      newInternalState: { Gw, Gb },
    }
  },
}
