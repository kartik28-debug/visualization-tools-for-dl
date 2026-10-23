import type { OptimizerDefinition, Vec2, OptimizerConfig } from './types'

interface AdamWState extends Record<string, unknown> { mw: number; mb: number; vw: number; vb: number }

// AdamW — Adam with DECOUPLED weight decay (Loshchilov & Hutter, 2019)
//
// Key distinction: weight decay is applied DIRECTLY to the parameters,
// NOT through the gradient. This prevents weight decay from being
// scaled by the adaptive learning rate (which is what standard Adam + L2 does).
//
//   m(t) = β1·m(t-1) + (1-β1)·g(t)
//   v(t) = β2·v(t-1) + (1-β2)·g(t)²
//   m̂ = m / (1 - β1^t),  v̂ = v / (1 - β2^t)
//   θ(t+1) = θ(t) - η · [m̂ / (√v̂ + ε) + λ·θ(t)]
//
// Note: on a zero-centred quadratic, weight decay will not visibly
// change trajectory unless the initial params are large or λ is high,
// because the optimal parameters are not at origin.
export const adamw: OptimizerDefinition = {
  name: 'adamw',
  label: 'AdamW',
  color: '#f472b6',
  initialState: () => ({ mw: 0, mb: 0, vw: 0, vb: 0 } as AdamWState),
  step(params: Vec2, grad: Vec2, config: OptimizerConfig, internalState: Record<string, unknown>, epoch: number) {
    const state = internalState as AdamWState
    const { beta1, beta2, epsilon, learningRate, weightDecay } = config
    const t = epoch + 1

    const mw = beta1 * state.mw + (1 - beta1) * grad.w
    const mb = beta1 * state.mb + (1 - beta1) * grad.b
    const vw = beta2 * state.vw + (1 - beta2) * grad.w * grad.w
    const vb = beta2 * state.vb + (1 - beta2) * grad.b * grad.b

    const mwHat = mw / (1 - Math.pow(beta1, t))
    const mbHat = mb / (1 - Math.pow(beta1, t))
    const vwHat = vw / (1 - Math.pow(beta2, t))
    const vbHat = vb / (1 - Math.pow(beta2, t))

    return {
      newParams: {
        // Decoupled weight decay applied AFTER the Adam step
        w: params.w - learningRate * (mwHat / (Math.sqrt(vwHat) + epsilon) + weightDecay * params.w),
        b: params.b - learningRate * (mbHat / (Math.sqrt(vbHat) + epsilon) + weightDecay * params.b),
      },
      newInternalState: { mw, mb, vw, vb },
    }
  },
}
