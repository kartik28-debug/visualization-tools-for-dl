import type { OptimizerDefinition, Vec2, OptimizerConfig } from './types'

interface AdamState { mw: number; mb: number; vw: number; vb: number }

// Adam:
//   m(t) = β1·m(t-1) + (1-β1)·g(t)          (first moment)
//   v(t) = β2·v(t-1) + (1-β2)·g(t)²          (second moment)
//   m̂(t) = m(t) / (1 - β1^t)                 (bias-corrected)
//   v̂(t) = v(t) / (1 - β2^t)                 (bias-corrected)
//   θ(t+1) = θ(t) - η · m̂(t) / (√v̂(t) + ε)
export const adam: OptimizerDefinition = {
  name: 'adam',
  label: 'Adam',
  color: '#34d399',
  initialState: () => ({ mw: 0, mb: 0, vw: 0, vb: 0 } as AdamState),
  step(params: Vec2, grad: Vec2, config: OptimizerConfig, internalState: Record<string, unknown>, epoch: number) {
    const state = internalState as AdamState
    const { beta1, beta2, epsilon, learningRate } = config
    const t = epoch + 1  // 1-indexed timestep

    // Update moments
    const mw = beta1 * state.mw + (1 - beta1) * grad.w
    const mb = beta1 * state.mb + (1 - beta1) * grad.b
    const vw = beta2 * state.vw + (1 - beta2) * grad.w * grad.w
    const vb = beta2 * state.vb + (1 - beta2) * grad.b * grad.b

    // Bias correction
    const mwHat = mw / (1 - Math.pow(beta1, t))
    const mbHat = mb / (1 - Math.pow(beta1, t))
    const vwHat = vw / (1 - Math.pow(beta2, t))
    const vbHat = vb / (1 - Math.pow(beta2, t))

    return {
      newParams: {
        w: params.w - learningRate * mwHat / (Math.sqrt(vwHat) + epsilon),
        b: params.b - learningRate * mbHat / (Math.sqrt(vbHat) + epsilon),
      },
      newInternalState: { mw, mb, vw, vb },
    }
  },
}
