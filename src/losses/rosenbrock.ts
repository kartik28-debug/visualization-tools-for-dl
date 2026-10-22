import type { LossFunction } from './types'

// Rosenbrock function (banana function):
// f(x, y) = (a - x)² + b(y - x²)²
// Standard: a=1, b=100 → minimum at (1, 1)
// ∂f/∂x = -2(a - x) - 4bx(y - x²)
// ∂f/∂y = 2b(y - x²)
const A = 1, B = 100

export const rosenbrock: LossFunction = {
  name: 'rosenbrock',
  label: 'Rosenbrock',
  description: 'f(x,y) = (1−x)² + 100(y−x²)² — narrow curved valley, challenging for most optimizers',
  loss: (w, b) => (A - w) ** 2 + B * (b - w * w) ** 2,
  gradient: (w, b) => ({
    w: -2 * (A - w) - 4 * B * w * (b - w * w),
    b: 2 * B * (b - w * w),
  }),
  globalMinimum: { w: 1, b: 1 },
  globalMinLoss: 0,
  plotRange: { wMin: -2, wMax: 2, bMin: -1, bMax: 3 },
  suggestedInit: { w: -1.5, b: 1.5 },
}
