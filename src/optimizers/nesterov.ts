import type { OptimizerDefinition, Vec2, OptimizerConfig } from './types'

interface NesterovState { vw: number; vb: number }

// Nesterov Accelerated Gradient (Sutskever formulation):
//   v(t) = β·v(t-1) + η·∇L(θ(t) - β·v(t-1))
//   θ(t+1) = θ(t) - v(t)
//
// The gradient is evaluated at the look-ahead point: θ - β·v
// The caller provides the gradient at the current params, so we use
// the equivalent reformulation where the look-ahead is approximated
// by using the standard Nesterov update in terms of the current gradient:
//
//   v(t) = β·v(t-1) + ∇L(θ(t))
//   θ(t+1) = θ(t) - η·(β·v(t) + ∇L(θ(t)))
//
// This is mathematically equivalent to the look-ahead form when gradients
// are computed at the look-ahead position. Since our engine computes the
// gradient at current θ, we use the "classical momentum + correction" form.
export const nesterov: OptimizerDefinition = {
  name: 'nesterov',
  label: 'Nesterov AG',
  color: '#60a5fa',
  initialState: () => ({ vw: 0, vb: 0 } as NesterovState),
  step(params: Vec2, grad: Vec2, config: OptimizerConfig, internalState: Record<string, unknown>) {
    const state = internalState as NesterovState
    const beta = config.momentum
    const lr = config.learningRate

    // Update velocity
    const vw = beta * state.vw + grad.w
    const vb = beta * state.vb + grad.b

    // Nesterov correction: use updated velocity (look-ahead effect)
    const updateW = beta * vw + grad.w
    const updateB = beta * vb + grad.b

    return {
      newParams: {
        w: params.w - lr * updateW,
        b: params.b - lr * updateB,
      },
      newInternalState: { vw, vb },
    }
  },
}
