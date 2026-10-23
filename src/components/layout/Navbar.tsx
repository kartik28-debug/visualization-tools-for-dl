import React from 'react'
import { Activity, RotateCcw, Sun, Moon, FlaskConical, SlidersHorizontal } from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'
import type { ActiveTab } from '../../store/simulationStore'

const NAV_TABS: { id: ActiveTab; label: string }[] = [
  { id: 'playground', label: 'Playground' },
  { id: 'theory', label: 'Theory' },
  { id: 'benchmarks', label: 'Benchmarks' },
]

interface NavbarProps {
  darkMode: boolean
  onToggleDark: () => void
}

export function Navbar({ darkMode, onToggleDark }: NavbarProps) {
  const {
    activeTab, setActiveTab, reset, lossName, selectedOptimizers, status,
    sidebarOpen, setSidebarOpen
  } = useSimulationStore()

  return (
    <header className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 h-12 shrink-0 border-b"
      style={{ background: '#131722', borderColor: '#252B38' }}>
      {/* Mobile sidebar button */}
      {activeTab === 'playground' && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="btn btn-ghost btn-icon lg:hidden"
          title="Toggle Configuration"
          id="navbar-mobile-sidebar-btn"
        >
          <SlidersHorizontal size={14} />
        </button>
      )}
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)' }}>
          <Activity size={14} color="#22d3ee" />
        </div>
        <span className="font-semibold text-sm tracking-tight" style={{ color: '#e8eaf0' }}>
          Optimizer <span style={{ color: '#22d3ee' }}>Lab</span>
        </span>
      </div>

      {/* Nav tabs */}
      <nav className="flex items-center gap-1">
        {NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            style={{
              background: activeTab === tab.id ? 'rgba(34,211,238,0.1)' : 'transparent',
              color: activeTab === tab.id ? '#22d3ee' : '#5a6478',
              border: activeTab === tab.id ? '1px solid rgba(34,211,238,0.25)' : '1px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Experiment info */}
      <div className="hidden md:flex items-center gap-2 ml-auto text-xs" style={{ color: '#5a6478' }}>
        <FlaskConical size={12} />
        <span className="mono">{lossName}</span>
        <span>·</span>
        <span>{selectedOptimizers.length} optimizer{selectedOptimizers.length !== 1 ? 's' : ''}</span>
        {status !== 'idle' && (
          <>
            <span>·</span>
            <span style={{
              color: status === 'running' ? '#34d399' : status === 'done' ? '#22d3ee' : '#fb923c'
            }}>{status}</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-auto md:ml-0">
        <button
          onClick={reset}
          className="btn btn-ghost btn-icon tooltip"
          title="Reset experiment"
          id="navbar-reset-btn"
        >
          <RotateCcw size={14} />
          <span className="tooltip-content" style={{ right: 0, top: '110%' }}>Reset</span>
        </button>
        <button
          onClick={onToggleDark}
          className="btn btn-ghost btn-icon"
          title="Toggle theme"
          id="navbar-theme-btn"
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </header>
  )
}
