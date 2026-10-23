import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { useSimulationStore } from '../../store/simulationStore'
import { OPTIMIZER_REGISTRY } from '../../optimizers'
import { computeLossGrid } from '../../utils/math'

const RESOLUTION = 120
const CONTOUR_LEVELS = 20

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function lossToRGB(norm: number): [number, number, number] {
  // Deep blue → cyan → green → yellow → red
  const t = Math.max(0, Math.min(1, norm))
  if (t < 0.25) {
    const s = t / 0.25
    return [Math.round(lerp(15, 20, s)), Math.round(lerp(20, 120, s)), Math.round(lerp(60, 200, s))]
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25
    return [Math.round(lerp(20, 40, s)), Math.round(lerp(120, 200, s)), Math.round(lerp(200, 60, s))]
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25
    return [Math.round(lerp(40, 220, s)), Math.round(lerp(200, 180, s)), Math.round(lerp(60, 20, s))]
  } else {
    const s = (t - 0.75) / 0.25
    return [Math.round(lerp(220, 200, s)), Math.round(lerp(180, 40, s)), Math.round(lerp(20, 20, s))]
  }
}

export function ContourPlot() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { lossFunction, selectedOptimizers, optimizerStates, setInitialParams, status } = useSimulationStore()
  const { plotRange } = lossFunction

  // Precompute loss grid whenever loss function changes
  const { grid, zMin, zMax } = useMemo(() => {
    return computeLossGrid(
      lossFunction.loss,
      plotRange.wMin, plotRange.wMax,
      plotRange.bMin, plotRange.bMax,
      RESOLUTION
    )
  }, [lossFunction, plotRange])

  // Draw background contour once
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { width, height } = canvas
    const imgData = ctx.createImageData(width, height)
    const data = imgData.data

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        // Bilinear interpolation from grid
        const gx = (j / (width - 1)) * (RESOLUTION - 1)
        const gy = (i / (height - 1)) * (RESOLUTION - 1)
        const gxi = Math.floor(gx), gyi = Math.floor(gy)
        const fx = gx - gxi, fy = gy - gyi
        const gx1 = Math.min(gxi + 1, RESOLUTION - 1)
        const gy1 = Math.min(gyi + 1, RESOLUTION - 1)

        const z00 = grid[gyi * RESOLUTION + gxi]
        const z10 = grid[gyi * RESOLUTION + gx1]
        const z01 = grid[gy1 * RESOLUTION + gxi]
        const z11 = grid[gy1 * RESOLUTION + gx1]
        const z = lerp(lerp(z00, z10, fx), lerp(z01, z11, fx), fy)

        const zRange = zMax - zMin || 1
        const norm = Math.pow((z - zMin) / zRange, 0.4) // gamma for visual clarity

        const [r, g, b] = lossToRGB(norm)
        const idx = (i * width + j) * 4
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 220
      }
    }
    ctx.putImageData(imgData, 0, 0)

    // Draw contour lines
    ctx.save()
    for (let level = 0; level < CONTOUR_LEVELS; level++) {
      const z = zMin + (zMax - zMin) * (level / CONTOUR_LEVELS)
      const norm = (z - zMin) / (zMax - zMin || 1)
      ctx.strokeStyle = `rgba(255,255,255,${0.06 + norm * 0.06})`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      // Simple marching-squares-lite: just scan rows and mark crossings
      for (let i = 0; i < RESOLUTION - 1; i++) {
        for (let j = 0; j < RESOLUTION - 1; j++) {
          const z00 = grid[i * RESOLUTION + j]
          const z10 = grid[i * RESOLUTION + (j + 1)]
          const z01 = grid[(i + 1) * RESOLUTION + j]
          const z11 = grid[(i + 1) * RESOLUTION + (j + 1)]
          const above00 = z00 >= z, above10 = z10 >= z
          const above01 = z01 >= z, above11 = z11 >= z
          const px0 = (j / (RESOLUTION - 1)) * width
          const py0 = (i / (RESOLUTION - 1)) * height
          const px1 = ((j + 1) / (RESOLUTION - 1)) * width
          const py1 = ((i + 1) / (RESOLUTION - 1)) * height
          // Top edge crossing
          if (above00 !== above10) {
            const t = (z - z00) / (z10 - z00)
            ctx.moveTo(lerp(px0, px1, t), py0)
            ctx.lineTo(lerp(px0, px1, t), py0)
          }
          // Bottom edge crossing
          if (above01 !== above11) {
            const t = (z - z01) / (z11 - z01)
            ctx.moveTo(lerp(px0, px1, t), py1)
            ctx.lineTo(lerp(px0, px1, t), py1)
          }
          // Left edge crossing
          if (above00 !== above01) {
            const t = (z - z00) / (z01 - z00)
            ctx.moveTo(px0, lerp(py0, py1, t))
            ctx.lineTo(px0, lerp(py0, py1, t))
          }
          // Right edge crossing
          if (above10 !== above11) {
            const t = (z - z10) / (z11 - z10)
            ctx.moveTo(px1, lerp(py0, py1, t))
            ctx.lineTo(px1, lerp(py0, py1, t))
          }
        }
      }
      ctx.stroke()
    }
    ctx.restore()
  }, [grid, zMin, zMax])

  // Coordinate conversion helpers
  const toCanvas = useCallback((w: number, b: number, cw: number, ch: number) => {
    const px = ((w - plotRange.wMin) / (plotRange.wMax - plotRange.wMin)) * cw
    const py = ((1 - (b - plotRange.bMin) / (plotRange.bMax - plotRange.bMin))) * ch
    return { px, py }
  }, [plotRange])

  // Draw overlay (trajectories + markers) on every state change
  useEffect(() => {
    const canvas = overlayRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { width: cw, height: ch } = canvas
    ctx.clearRect(0, 0, cw, ch)

    // Draw global minimum marker
    if (lossFunction.globalMinimum) {
      const { px, py } = toCanvas(lossFunction.globalMinimum.w, lossFunction.globalMinimum.b, cw, ch)
      ctx.save()
      ctx.strokeStyle = '#fff'
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.lineWidth = 1.5
      // Diamond
      ctx.beginPath()
      ctx.moveTo(px, py - 7)
      ctx.lineTo(px + 6, py)
      ctx.lineTo(px, py + 7)
      ctx.lineTo(px - 6, py)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }

    // Draw each optimizer trajectory
    for (const name of selectedOptimizers) {
      const state = optimizerStates[name]
      if (!state || state.history.length < 2) continue
      const def = OPTIMIZER_REGISTRY[name]
      const color = def.color

      // Trajectory line
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.globalAlpha = 0.7
      ctx.beginPath()
      for (let i = 0; i < state.history.length; i++) {
        const { w, b } = state.history[i]
        const { px, py } = toCanvas(w, b, cw, ch)
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.restore()

      // History dots (every few steps)
      ctx.save()
      ctx.fillStyle = color
      ctx.globalAlpha = 0.4
      state.history.forEach((r, i) => {
        if (i % Math.max(1, Math.floor(state.history.length / 30)) !== 0) return
        const { px, py } = toCanvas(r.w, r.b, cw, ch)
        ctx.beginPath()
        ctx.arc(px, py, 2, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.restore()

      // Current position (glowing dot)
      const last = state.history[state.history.length - 1]
      const { px, py } = toCanvas(last.w, last.b, cw, ch)
      ctx.save()
      // Glow
      const grad = ctx.createRadialGradient(px, py, 0, px, py, 12)
      grad.addColorStop(0, color + 'cc')
      grad.addColorStop(1, color + '00')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(px, py, 12, 0, Math.PI * 2)
      ctx.fill()
      // Dot
      ctx.fillStyle = color
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(px, py, 4.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      // Label
      ctx.save()
      ctx.font = '9px JetBrains Mono, monospace'
      ctx.fillStyle = color
      ctx.fillText(def.label.slice(0, 8), px + 7, py - 4)
      ctx.restore()
    }
  }, [optimizerStates, selectedOptimizers, lossFunction, toCanvas])

  // Click / touch to set initial position accurately mapped to bounding box
  const handlePointerDown = useCallback((clientX: number, clientY: number) => {
    if (status === 'running') return
    const canvas = overlayRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top))
    const w = plotRange.wMin + (x / rect.width) * (plotRange.wMax - plotRange.wMin)
    const b = plotRange.bMin + (1 - y / rect.height) * (plotRange.bMax - plotRange.bMin)
    setInitialParams({ w: parseFloat(w.toFixed(3)), b: parseFloat(b.toFixed(3)) })
  }, [status, plotRange, setInitialParams])

  return (
    <div ref={containerRef} className="relative w-full h-full select-none" style={{ minHeight: 260 }}>
      {/* Background contour canvas */}
      <canvas
        ref={canvasRef}
        width={500}
        height={400}
        className="absolute inset-0 w-full h-full"
        style={{ borderRadius: 8 }}
      />
      {/* Overlay canvas for trajectories */}
      <canvas
        ref={overlayRef}
        width={500}
        height={400}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        style={{ borderRadius: 8 }}
        onClick={(e) => handlePointerDown(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          if (e.touches.length > 0) {
            handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)
          }
        }}
        title="Click to set starting position"
      />

      {/* Axis labels */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-between px-3 pointer-events-none">
        <span className="mono text-[9px]" style={{ color: '#5a6478' }}>w={plotRange.wMin}</span>
        <span className="mono text-[10px]" style={{ color: '#5a6478' }}>w →</span>
        <span className="mono text-[9px]" style={{ color: '#5a6478' }}>w={plotRange.wMax}</span>
      </div>
      <div className="absolute top-1 right-1 pointer-events-none" style={{ writingMode: 'vertical-rl' }}>
        <span className="mono text-[10px]" style={{ color: '#5a6478' }}>b ↑</span>
      </div>

      {/* Click hint */}
      {status === 'idle' && (
        <div className="absolute top-2 left-2 pointer-events-none px-2 py-1 rounded text-[10px]"
          style={{ background: 'rgba(11,13,18,0.7)', color: '#5a6478' }}>
          Click to set start position
        </div>
      )}

      {/* Loss scale legend */}
      <div className="absolute top-2 right-6 pointer-events-none flex flex-col items-center gap-0.5">
        <div className="w-3 h-24 rounded" style={{
          background: 'linear-gradient(to bottom, rgb(200,40,20), rgb(220,180,20), rgb(40,200,60), rgb(20,120,200), rgb(15,20,60))'
        }} />
        <span className="mono text-[8px]" style={{ color: '#5a6478' }}>hi</span>
        <span className="mono text-[8px] mt-1" style={{ color: '#5a6478' }}>lo</span>
      </div>
    </div>
  )
}
