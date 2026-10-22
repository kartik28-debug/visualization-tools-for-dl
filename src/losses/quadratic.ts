import type { LossFunction } from './types'

// L(w, b) = (w - 2)² + 2(b + 1)²
// Global minimum: (w*, b*) = (2, -1), L* = 0
// ∂L/∂w = 2(w - 2)
// ∂L/∂b = 4(b + 1)
export const quadratic: LossFunction = {
  name: 'quadratic',
  label: 'Quadratic Bowl',
  description: 'L(w,b) = (w−2)² + 2(b+1)² — simple convex bowl with known minimum at (2, −1)',
  loss: (w, b) => (w - 2) ** 2 + 2 * (b + 1) ** 2,
  gradient: (w, b) => ({ w: 2 * (w - 2), b: 4 * (b + 1) }),
  globalMinimum: { w: 2, b: -1 },
  globalMinLoss: 0,
  plotRange: { wMin: -4, wMax: 8, bMin: -6, bMax: 4 },
  suggestedInit: { w: -2, b: 2 },
}
