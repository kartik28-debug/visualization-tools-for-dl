import type { LossFunction } from './types'

// Linear regression MSE loss on synthetic data y = trueW·x + trueB + noise
// L(w, b) = (1/N) Σ (w·xᵢ + b - yᵢ)²
// ∂L/∂w = (2/N) Σ (w·xᵢ + b - yᵢ)·xᵢ
// ∂L/∂b = (2/N) Σ (w·xᵢ + b - yᵢ)

export interface RegressionDataset {
  xs: number[]
  ys: number[]
  trueW: number
  trueB: number
}

/** Simple seeded pseudo-random (LCG) to get deterministic datasets */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

export function generateDataset(
  trueW: number,
  trueB: number,
  noise: number,
  n: number,
  seed = 42
): RegressionDataset {
  const rand = seededRandom(seed)
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i < n; i++) {
    const x = (rand() - 0.5) * 4  // range [-2, 2]
    const y = trueW * x + trueB + (rand() - 0.5) * 2 * noise
    xs.push(x)
    ys.push(y)
  }
  return { xs, ys, trueW, trueB }
}

export function createRegressionLoss(dataset: RegressionDataset): LossFunction {
  const { xs, ys } = dataset
  const N = xs.length
  const loss = (w: number, b: number): number => {
    let sum = 0
    for (let i = 0; i < N; i++) {
      const e = w * xs[i] + b - ys[i]
      sum += e * e
    }
    return sum / N
  }
  const gradient = (w: number, b: number) => {
    let gw = 0, gb = 0
    for (let i = 0; i < N; i++) {
      const e = w * xs[i] + b - ys[i]
      gw += e * xs[i]
      gb += e
    }
    return { w: (2 / N) * gw, b: (2 / N) * gb }
  }
  return {
    name: 'regression',
    label: 'Linear Regression MSE',
    description: `MSE on ${N} samples: y = ${dataset.trueW}x + ${dataset.trueB} + noise`,
    loss,
    gradient,
    globalMinimum: { w: dataset.trueW, b: dataset.trueB },
    globalMinLoss: null,  // not exactly 0 due to noise
    plotRange: {
      wMin: dataset.trueW - 3,
      wMax: dataset.trueW + 3,
      bMin: dataset.trueB - 3,
      bMax: dataset.trueB + 3,
    },
    suggestedInit: { w: dataset.trueW - 2, b: dataset.trueB + 2 },
  }
}
