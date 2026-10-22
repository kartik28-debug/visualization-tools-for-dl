import React from 'react'
import { X, Activity, Map, BarChart2, Play } from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'

const STEPS = [
  {
    icon: <Activity size={20} color="#22d3ee" />,
    title: '3D Loss Surface',
    desc: 'The 3D landscape shows the loss value (height) for every (w, b) parameter combination. Optimizers navigate this surface to find the lowest point.',
  },
  {
    icon: <Map size={20} color="#a78bfa" />,
    title: '2D Contour Map',
    desc: 'The contour plot is a top-down view of the same landscape. Click anywhere to set the optimizers\' starting position before running the simulation.',
  },
  {
    icon: <BarChart2 size={20} color="#34d399" />,
    title: 'Live Charts',
    desc: 'Loss, gradient norm, and parameter values update in real-time as each optimizer takes steps. Every value comes from actual update calculations.',
  },
  {
    icon: <Play size={20} color="#fb923c" />,
    title: 'Simulation Controls',
    desc: 'Use Play/Pause/Step at the bottom. Select optimizers and hyperparameters in the sidebar. Try the presets for ready-made experiments.',
  },
]

export function OnboardingOverlay() {
  const { showOnboarding, dismissOnboarding } = useSimulationStore()
  if (!showOnboarding) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(11,13,18,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={dismissOnboarding}>
      <div
        className="panel rounded-2xl p-6 max-w-lg w-full mx-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid rgba(34,211,238,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)' }}>
              <Activity size={18} color="#22d3ee" />
            </div>
            <div>
              <h1 className="text-base font-semibold" style={{ color: '#e8eaf0' }}>
                Welcome to <span style={{ color: '#22d3ee' }}>Optimizer Lab</span>
              </h1>
              <p className="text-xs" style={{ color: '#5a6478' }}>Interactive deep learning optimizer comparison</p>
            </div>
          </div>
          <button
            onClick={dismissOnboarding}
            className="btn btn-ghost btn-icon"
            id="onboarding-close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {STEPS.map((step, i) => (
            <div key={i} className="rounded-xl p-3"
              style={{ background: '#0B0D12', border: '1px solid #252B38' }}>
              <div className="flex items-center gap-2 mb-1.5">
                {step.icon}
                <span className="text-xs font-semibold" style={{ color: '#e8eaf0' }}>{step.title}</span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: '#5a6478' }}>{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick start */}
        <div className="rounded-xl p-3 mb-4"
          style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)' }}>
          <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: '#22d3ee' }}>Quick Start</div>
          <ol className="space-y-1">
            {[
              'Select 2–3 optimizers in the sidebar',
              'Click Play in the control bar at the bottom',
              'Pause to inspect trajectories, then resume',
              'Try a preset experiment from the sidebar',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#8892a4' }}>
                <span className="mono shrink-0" style={{ color: '#22d3ee' }}>{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <button
          onClick={dismissOnboarding}
          className="btn btn-primary w-full justify-center"
          id="onboarding-start"
        >
          <Play size={13} />
          Start Exploring
        </button>
      </div>
    </div>
  )
}
