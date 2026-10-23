import React from 'react'
import {
  Play, Pause, SkipForward, RotateCcw, RefreshCw,
  Download
} from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'
import { exportCSV } from '../../utils/exportCsv'

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4]

export function SimulationControls() {
  const {
    status, play, pause, reset, stepAll,
    currentEpoch, maxEpochs,
    playbackSpeed, setPlaybackSpeed,
    selectedOptimizers, optimizerStates, lossName,
  } = useSimulationStore()

  const isRunning = status === 'running'
  const isPaused = status === 'paused'
  const isIdle = status === 'idle'
  const isDone = status === 'done'

  const hasData = selectedOptimizers.some((n) => (optimizerStates[n]?.epoch ?? 0) > 0)

  const handlePlay = () => {
    if (isIdle) {
      const store = useSimulationStore.getState()
      const needsInit = selectedOptimizers.length > 0 &&
        !store.optimizerStates[selectedOptimizers[0]]
      if (needsInit) store.initialize()
    }
    play()
  }

  const handleStep = () => {
    if (isIdle || isPaused) {
      const store = useSimulationStore.getState()
      const needsInit = selectedOptimizers.length > 0 &&
        !store.optimizerStates[selectedOptimizers[0]]
      if (needsInit) store.initialize()
      stepAll()
    }
  }

  const handleExport = () => {
    exportCSV(optimizerStates, lossName)
  }

  const progressPct = maxEpochs > 0 ? Math.min(100, (currentEpoch / maxEpochs) * 100) : 0

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 h-12 shrink-0 border-t overflow-x-auto no-scrollbar"
      style={{ background: '#131722', borderColor: '#252B38' }}>
      {/* Primary controls */}
      <div className="flex items-center gap-1">
        {/* Reset */}
        <button
          onClick={() => reset()}
          className="btn btn-ghost btn-icon"
          title="Reset to initial conditions"
          id="ctrl-reset"
        >
          <RotateCcw size={14} />
        </button>

        {/* Play / Pause */}
        {isRunning ? (
          <button
            onClick={pause}
            className="btn btn-primary"
            id="ctrl-pause"
          >
            <Pause size={13} />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={handlePlay}
            disabled={selectedOptimizers.length === 0 || isDone}
            className="btn btn-primary"
            id="ctrl-play"
          >
            <Play size={13} />
            <span>{isPaused ? 'Resume' : 'Play'}</span>
          </button>
        )}

        {/* Single step */}
        <button
          onClick={handleStep}
          disabled={isRunning || selectedOptimizers.length === 0 || isDone}
          className="btn btn-ghost btn-icon"
          title="Single step"
          id="ctrl-step"
        >
          <SkipForward size={14} />
        </button>

        {/* Re-initialize */}
        <button
          onClick={() => { reset(); }}
          disabled={isRunning}
          className="btn btn-ghost btn-icon"
          title="Restart"
          id="ctrl-restart"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6" style={{ background: '#252B38' }} />

      {/* Speed selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#5a6478' }}>Speed</span>
        <div className="flex gap-0.5">
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className="px-2 py-0.5 rounded text-[10px] font-mono transition-all"
              id={`ctrl-speed-${speed}`}
              style={{
                background: playbackSpeed === speed ? 'rgba(34,211,238,0.15)' : 'transparent',
                color: playbackSpeed === speed ? '#22d3ee' : '#5a6478',
                border: `1px solid ${playbackSpeed === speed ? 'rgba(34,211,238,0.3)' : 'transparent'}`,
              }}
            >
              {speed}×
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6" style={{ background: '#252B38' }} />

      {/* Progress */}
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-2 text-xs">
          <span style={{ color: '#5a6478' }}>Epoch</span>
          <span className="mono font-medium" style={{ color: '#e8eaf0' }}>{currentEpoch}</span>
          <span style={{ color: '#363e52' }}>/</span>
          <span className="mono" style={{ color: '#5a6478' }}>{maxEpochs}</span>
        </div>

        {/* Progress bar */}
        <div className="hidden sm:block flex-1 max-w-48 h-1.5 rounded-full overflow-hidden" style={{ background: '#252B38' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progressPct}%`,
              background: isDone
                ? 'linear-gradient(90deg, #22d3ee, #34d399)'
                : 'linear-gradient(90deg, #22d3ee80, #22d3ee)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Status badge */}
        {isDone && (
          <span className="badge text-[10px]"
            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
            Done
          </span>
        )}
        {isRunning && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: '#34d399' }} />
            <span className="text-[10px]" style={{ color: '#34d399' }}>Running</span>
          </div>
        )}
      </div>

      {/* Export */}
      {hasData && (
        <button
          onClick={handleExport}
          className="btn btn-ghost"
          title="Export data as CSV"
          id="ctrl-export"
          style={{ fontSize: 11 }}
        >
          <Download size={12} />
          <span>CSV</span>
        </button>
      )}
    </div>
  )
}
