import type { OptimizerDefinition, Vec2, OptimizerConfig } from './types'

interface RMSPropState { sw: number; sb: number }

// RMSProp:
//   s(t) = β·s(t-1) + (1-β)·g(t)²
//   θ(t+1) = θ(t) - (η / √(s(t) + ε)) · g(t)
export const rmsprop: OptimizerDefinition = {
  name: 'rmsprop',
  label: 'RMSProp',
  color: '#fb923c',
  initialState: () => ({ sw: 0, sb: 0 } as RMSPropState),
  step(params: Vec2, grad: Vec2, config: OptimizerConfig, internalState: Record<string, unknown>) {
    const state = internalState as RMSPropState
    const beta = config.beta2  // reuse beta2 as RMSProp decay factor
    const sw = beta * state.sw + (1 - beta) * grad.w * grad.w
    const sb = beta * state.sb + (1 - beta) * grad.b * grad.b
    return {
      newParams: {
        w: params.w - (config.learningRate / Math.sqrt(sw + config.epsilon)) * grad.w,
        b: params.b - (config.learningRate / Math.sqrt(sb + config.epsilon)) * grad.b,
      },
      newInternalState: { sw, sb },
    }
  },
}
