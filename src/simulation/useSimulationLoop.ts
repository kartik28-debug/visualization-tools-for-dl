// Controlled animation loop using requestAnimationFrame
import { useEffect, useRef } from 'react'
import { useSimulationStore } from '../store/simulationStore'

const SPEED_TO_STEPS: Record<number, number> = {
  0.25: 1,
  0.5:  1,
  1:    2,
  2:    4,
  4:    8,
}

// ms between rAF ticks at each speed
const SPEED_TO_INTERVAL: Record<number, number> = {
  0.25: 200,
  0.5:  100,
  1:    50,
  2:    30,
  4:    16,
}

export function useSimulationLoop() {
  const status = useSimulationStore((s) => s.status)
  const playbackSpeed = useSimulationStore((s) => s.playbackSpeed)
  const stepAll = useSimulationStore((s) => s.stepAll)

  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  useEffect(() => {
    if (status !== 'running') {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }

    const interval = SPEED_TO_INTERVAL[playbackSpeed] ?? 50
    const stepsPerTick = SPEED_TO_STEPS[playbackSpeed] ?? 2

    const tick = (timestamp: number) => {
      if (status !== 'running') return
      const elapsed = timestamp - lastTickRef.current
      if (elapsed >= interval) {
        lastTickRef.current = timestamp
        for (let i = 0; i < stepsPerTick; i++) {
          stepAll()
          // re-check status after each step (stepAll may set done)
          const currentStatus = useSimulationStore.getState().status
          if (currentStatus !== 'running') return
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [status, playbackSpeed, stepAll])
}
