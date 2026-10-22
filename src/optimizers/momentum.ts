import type { OptimizerDefinition, Vec2, OptimizerConfig } from './types'

interface MomentumState { vw: number; vb: number }

// Momentum:
//   v(t) = β·v(t-1) + ∇L(θ(t))
//   θ(t+1) = θ(t) - η·v(t)
export const momentumOptimizer: OptimizerDefinition = {
  name: 'momentum',
  label: 'Momentum',
  color: '#a78bfa',
  initialState: () => ({ vw: 0, vb: 0 } as MomentumState),
  step(params: Vec2, grad: Vec2, config: OptimizerConfig, internalState: Record<string, unknown>) {
    const state = internalState as MomentumState
    const vw = config.momentum * state.vw + grad.w
    const vb = config.momentum * state.vb + grad.b
    return {
      newParams: {
        w: params.w - config.learningRate * vw,
        b: params.b - config.learningRate * vb,
      },
      newInternalState: { vw, vb },
    }
  },
}
