import React, { useState } from 'react'
import { Navbar } from './components/layout/Navbar'
import { Sidebar } from './components/layout/Sidebar'
import { SimulationControls } from './components/layout/SimulationControls'
import { OnboardingOverlay } from './components/layout/OnboardingOverlay'
import { LossSurface3D } from './components/visualizations/LossSurface3D'
import { ContourPlot } from './components/visualizations/ContourPlot'
import { ChartsPanel } from './components/visualizations/LossChart'
import { MetricsPanel } from './components/metrics/OptimizerMetricCard'
import { ComparisonTable } from './components/metrics/ComparisonTable'
import { TheoryPanel } from './components/theory/OptimizerTheoryCard'
import { useSimulationStore } from './store/simulationStore'
import { useSimulationLoop } from './simulation/useSimulationLoop'
import { OPTIMIZER_REGISTRY } from './optimizers'

function PlaygroundView() {
  const [rightTab, setRightTab] = useState<'metrics' | 'table' | 'charts'>('metrics')
  const [vizTab, setVizTab] = useState<'3d' | 'contour'>('3d')

  return (
    <div className="flex flex-1 overflow-hidden relative min-h-0">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Visualizations & Panels */}
        <div className="flex flex-col lg:flex-row flex-1 gap-0 overflow-y-auto lg:overflow-hidden min-h-0">
          {/* Primary visualization container */}
          <div
            className="flex flex-col flex-1 min-w-0 min-h-[320px] sm:min-h-[400px] lg:min-h-0 overflow-hidden shrink-0 lg:shrink"
            style={{ borderRight: '1px solid #252B38' }}
          >
            {/* Viz tabs & legend bar */}
            <div
              className="flex items-center gap-1.5 px-3 py-2 border-b shrink-0 overflow-x-auto no-scrollbar"
              style={{ borderColor: '#252B38', background: '#0f1420' }}
            >
              {(['3d', 'contour'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setVizTab(tab)}
                  id={`viz-tab-${tab}`}
                  className="px-2.5 sm:px-3 py-1 text-[11px] font-medium rounded shrink-0"
                  style={{
                    background: vizTab === tab ? 'rgba(34,211,238,0.1)' : 'transparent',
                    color: vizTab === tab ? '#22d3ee' : '#5a6478',
                    border: `1px solid ${vizTab === tab ? 'rgba(34,211,238,0.25)' : 'transparent'}`,
                  }}
                >
                  {tab === '3d' ? '3D Surface' : '2D Contour'}
                </button>
              ))}
              <div className="ml-auto overflow-x-auto no-scrollbar pl-2 shrink-0">
                <OptimizerLegend />
              </div>
            </div>

            {/* Canvas / Visualization Area */}
            <div className="flex-1 p-2 overflow-hidden relative min-h-[280px]">
              {vizTab === '3d' ? (
                <LossSurface3D />
              ) : (
                <ContourPlot />
              )}
            </div>
          </div>

          {/* Right: Metrics / Table / Charts */}
          <div
            className="flex flex-col overflow-hidden shrink-0 w-full lg:w-80 border-t lg:border-t-0"
            style={{ minHeight: 280 }}
          >
            {/* Right tabs */}
            <div
              className="flex items-center border-b shrink-0"
              style={{ borderColor: '#252B38', background: '#0f1420' }}
            >
              {([
                { id: 'metrics', label: 'Metrics' },
                { id: 'table', label: 'Compare' },
                { id: 'charts', label: 'Charts' },
              ] as { id: typeof rightTab; label: string }[]).map((tab) => (
                <button
                  key={tab.id}
                  id={`right-tab-${tab.id}`}
                  onClick={() => setRightTab(tab.id)}
                  className="flex-1 py-2 text-[11px] font-medium transition-colors"
                  style={{
                    color: rightTab === tab.id ? '#22d3ee' : '#5a6478',
                    borderBottom: `2px solid ${rightTab === tab.id ? '#22d3ee' : 'transparent'}`,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {rightTab === 'metrics' && <MetricsPanel />}
              {rightTab === 'table' && <ComparisonTable />}
              {rightTab === 'charts' && <ChartsPanel />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OptimizerLegend() {
  const { selectedOptimizers } = useSimulationStore()
  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-nowrap">
      {selectedOptimizers.map((name) => {
        const def = OPTIMIZER_REGISTRY[name]
        return (
          <div key={name} className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <div className="w-2 h-2 rounded-full" style={{ background: def.color }} />
            <span className="text-[10px]" style={{ color: def.color }}>{def.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function App() {
  const { activeTab } = useSimulationStore()
  const [darkMode] = useState(true)

  // Start the simulation loop
  useSimulationLoop()

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0B0D12' }}>
      <OnboardingOverlay />
      <Navbar darkMode={darkMode} onToggleDark={() => {}} />

      {activeTab === 'playground' && (
        <div className="flex flex-col flex-1 overflow-hidden min-h-0">
          <PlaygroundView />
          <SimulationControls />
        </div>
      )}

      {activeTab === 'theory' && (
        <div className="flex-1 overflow-y-auto" style={{ background: '#0B0D12' }}>
          <TheoryPanel />
        </div>
      )}

      {activeTab === 'benchmarks' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#e8eaf0' }}>Benchmarks</h2>
            <p className="text-xs mb-4" style={{ color: '#5a6478' }}>
              Run a full experiment in the Playground, then view the comparison table here.
            </p>
            <div className="panel p-4 rounded-xl">
              <ComparisonTable />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
