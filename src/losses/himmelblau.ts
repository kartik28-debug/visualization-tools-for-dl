import type { LossFunction } from './types'

// Himmelblau function:
// f(x,y) = (x² + y - 11)² + (x + y² - 7)²
// Has 4 equal global minima:
//   (3, 2), (-2.805..., 3.131...), (-3.779..., -3.283...), (3.584..., -1.848...)
// ∂f/∂x = 4x(x² + y - 11) + 2(x + y² - 7)
// ∂f/∂y = 2(x² + y - 11) + 4y(x + y² - 7)
export const himmelblau: LossFunction = {
  name: 'himmelblau',
  label: 'Himmelblau',
  description: 'f(x,y) = (x²+y−11)² + (x+y²−7)² — four global minima, illustrates local optima effects',
  loss: (w, b) => (w * w + b - 11) ** 2 + (w + b * b - 7) ** 2,
  gradient: (w, b) => ({
    w: 4 * w * (w * w + b - 11) + 2 * (w + b * b - 7),
    b: 2 * (w * w + b - 11) + 4 * b * (w + b * b - 7),
  }),
  globalMinimum: { w: 3, b: 2 },   // one of four; shown as reference
  globalMinLoss: 0,
  plotRange: { wMin: -5, wMax: 5, bMin: -5, bMax: 5 },
  suggestedInit: { w: -3, b: -3 },
}
