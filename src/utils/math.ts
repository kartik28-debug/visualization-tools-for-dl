// Math utilities

/** Clamp a value between min and max */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Format a number to a fixed number of significant figures */
export function formatSig(val: number, sig = 4): string {
  if (!isFinite(val)) return val > 0 ? '+∞' : '−∞'
  if (isNaN(val)) return 'NaN'
  if (val === 0) return '0'
  return val.toPrecision(sig).replace(/\.?0+$/, '')
}

/** Format number for display in tables/cards */
export function formatNum(val: number, decimals = 4): string {
  if (!isFinite(val)) return isNaN(val) ? 'NaN' : '±∞'
  if (Math.abs(val) < 1e-4 && val !== 0) return val.toExponential(3)
  return val.toFixed(decimals)
}

/** Format short (2 decimals) */
export function formatShort(val: number): string {
  return formatNum(val, 2)
}

/** Format a duration in ms to human-readable */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

/** Generate a 2D grid of z values for a loss function */
export function computeLossGrid(
  fn: (w: number, b: number) => number,
  wMin: number,
  wMax: number,
  bMin: number,
  bMax: number,
  resolution: number
): { grid: Float32Array; zMin: number; zMax: number } {
  const n = resolution
  const grid = new Float32Array(n * n)
  let zMin = Infinity
  let zMax = -Infinity

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const w = wMin + (wMax - wMin) * (j / (n - 1))
      const b = bMin + (bMax - bMin) * (i / (n - 1))
      const z = fn(w, b)
      const zClamped = isFinite(z) ? z : 0
      grid[i * n + j] = zClamped
      if (zClamped < zMin) zMin = zClamped
      if (zClamped > zMax) zMax = zClamped
    }
  }

  return { grid, zMin, zMax }
}

/** Map a loss value to a height-based color (blue → cyan → green → yellow → red) */
export function lossToColor(normalizedZ: number): [number, number, number] {
  // normalizedZ in [0, 1]
  const t = clamp(normalizedZ, 0, 1)
  // Simple gradient: dark blue → cyan → green → yellow → red
  if (t < 0.25) {
    const s = t / 0.25
    return [lerp(0.02, 0.1, s), lerp(0.05, 0.8, s), lerp(0.3, 0.9, s)]
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25
    return [lerp(0.1, 0.2, s), lerp(0.8, 0.9, s), lerp(0.9, 0.2, s)]
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25
    return [lerp(0.2, 0.9, s), lerp(0.9, 0.8, s), lerp(0.2, 0.05, s)]
  } else {
    const s = (t - 0.75) / 0.25
    return [lerp(0.9, 0.8, s), lerp(0.8, 0.1, s), lerp(0.05, 0.05, s)]
  }
}
