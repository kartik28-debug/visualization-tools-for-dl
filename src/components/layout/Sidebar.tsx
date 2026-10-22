import React, { useState } from 'react'
import {
  ChevronLeft, ChevronRight, CheckSquare, Square,
  Settings, BarChart2, Info, Zap
} from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'
import { OPTIMIZER_REGISTRY, OPTIMIZER_ORDER } from '../../optimizers'
import { LOSS_REGISTRY } from '../../losses'
import { PRESETS } from '../../simulation/presets'
import type { LossFunctionName } from '../../losses/types'
import type { OptimizerName } from '../../optimizers/types'

const LOSS_OPTIONS: { id: LossFunctionName; label: string }[] = [
  { id: 'quadratic', label: 'Quadratic Bowl' },
  { id: 'rosenbrock', label: 'Rosenbrock' },
  { id: 'himmelblau', label: 'Himmelblau' },
  { id: 'regression', label: 'Linear Regression MSE' },
]

export function Sidebar() {
  const {
    sidebarOpen, setSidebarOpen,
    lossName, setLossFunction,
    selectedOptimizers, toggleOptimizer, selectAllOptimizers, clearOptimizers,
    config, setConfig,
    initialParams, setInitialParams,
    maxEpochs, setMaxEpochs,
    status, applyPreset, reset,
  } = useSimulationStore()

  const [expandedSection, setExpandedSection] = useState<string | null>('loss')
  const isRunning = status === 'running'

  const toggle = (section: string) =>
    setExpandedSection(expandedSection === section ? null : section)

  const SectionHeader = ({ id, icon, label }: { id: string; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => toggle(id)}
      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
      style={{ color: expandedSection === id ? '#22d3ee' : '#5a6478' }}
    >
      {icon}
      <span>{label}</span>
      <ChevronRight size={12} className="ml-auto transition-transform"
        style={{ transform: expandedSection === id ? 'rotate(90deg)' : 'none' }} />
    </button>
  )

  if (!sidebarOpen) {
    return (
      <aside className="flex flex-col items-center py-3 gap-3 border-r"
        style={{ width: 40, background: '#131722', borderColor: '#252B38' }}>
        <button onClick={() => setSidebarOpen(true)} className="btn btn-ghost btn-icon" id="sidebar-open-btn">
          <ChevronRight size={14} />
        </button>
        <div style={{ color: '#5a6478', writingMode: 'vertical-rl', fontSize: 10, marginTop: 8 }}>
          CONFIG
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex flex-col border-r overflow-hidden shrink-0"
      style={{ width: 260, background: '#131722', borderColor: '#252B38' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#252B38' }}>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a6478' }}>
          Configuration
        </span>
        <button onClick={() => setSidebarOpen(false)} className="btn btn-ghost btn-icon" id="sidebar-close-btn">
          <ChevronLeft size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* PRESETS */}
        <div className="border-b" style={{ borderColor: '#252B38' }}>
          <SectionHeader id="presets" icon={<Zap size={12} />} label="Presets" />
          {expandedSection === 'presets' && (
            <div className="px-3 pb-3 space-y-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  id={`preset-${preset.id}`}
                  onClick={() => { applyPreset(preset); reset() }}
                  disabled={isRunning}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all"
                  style={{
                    background: '#0B0D12',
                    border: '1px solid #252B38',
                    color: '#8892a4',
                  }}
                  title={preset.description}
                >
                  <div className="font-medium" style={{ color: '#e8eaf0' }}>{preset.label}</div>
                  <div className="mt-0.5 text-[10px]" style={{ color: '#5a6478' }}>
                    {preset.description.slice(0, 60)}…
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LOSS FUNCTION */}
        <div className="border-b" style={{ borderColor: '#252B38' }}>
          <SectionHeader id="loss" icon={<BarChart2 size={12} />} label="Loss Function" />
          {expandedSection === 'loss' && (
            <div className="px-3 pb-3 space-y-1.5">
              {LOSS_OPTIONS.map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-all"
                  style={{
                    background: lossName === opt.id ? 'rgba(34,211,238,0.08)' : 'transparent',
                    border: `1px solid ${lossName === opt.id ? 'rgba(34,211,238,0.2)' : 'transparent'}`,
                  }}>
                  <input
                    type="radio"
                    name="lossFunction"
                    value={opt.id}
                    checked={lossName === opt.id}
                    disabled={isRunning}
                    onChange={() => setLossFunction(opt.id)}
                    className="hidden"
                    id={`loss-${opt.id}`}
                  />
                  <div className="w-3 h-3 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: lossName === opt.id ? '#22d3ee' : '#363e52' }}>
                    {lossName === opt.id && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22d3ee' }} />
                    )}
                  </div>
                  <span className="text-xs" style={{ color: lossName === opt.id ? '#e8eaf0' : '#8892a4' }}>
                    {opt.label}
                  </span>
                </label>
              ))}

              {lossName === 'regression' && <RegressionConfigPanel />}
            </div>
          )}
        </div>

        {/* OPTIMIZERS */}
        <div className="border-b" style={{ borderColor: '#252B38' }}>
          <SectionHeader id="optimizers" icon={<CheckSquare size={12} />} label="Optimizers" />
          {expandedSection === 'optimizers' && (
            <div className="px-3 pb-3">
              <div className="flex gap-2 mb-2">
                <button onClick={selectAllOptimizers} disabled={isRunning}
                  className="text-[10px] px-2 py-1 rounded" id="select-all-optimizers"
                  style={{ background: 'rgba(34,211,238,0.08)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)' }}>
                  All
                </button>
                <button onClick={clearOptimizers} disabled={isRunning}
                  className="text-[10px] px-2 py-1 rounded" id="clear-all-optimizers"
                  style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {OPTIMIZER_ORDER.map((name) => {
                  const def = OPTIMIZER_REGISTRY[name]
                  const checked = selectedOptimizers.includes(name)
                  return (
                    <label key={name} className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all"
                      style={{
                        background: checked ? `${def.color}10` : 'transparent',
                        border: `1px solid ${checked ? `${def.color}30` : 'transparent'}`,
                      }}>
                      <input
                        type="checkbox"
                        id={`optimizer-${name}`}
                        checked={checked}
                        disabled={isRunning}
                        onChange={() => toggleOptimizer(name)}
                        className="hidden"
                      />
                      <div className="w-3.5 h-3.5 rounded flex items-center justify-center"
                        style={{
                          background: checked ? `${def.color}20` : 'transparent',
                          border: `1.5px solid ${checked ? def.color : '#363e52'}`,
                        }}>
                        {checked && <div className="w-1.5 h-1.5 rounded-sm" style={{ background: def.color }} />}
                      </div>
                      <div className="w-2 h-2 rounded-full" style={{ background: def.color }} />
                      <span className="text-xs" style={{ color: checked ? '#e8eaf0' : '#8892a4' }}>
                        {def.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* HYPERPARAMETERS */}
        <div className="border-b" style={{ borderColor: '#252B38' }}>
          <SectionHeader id="hyperparams" icon={<Settings size={12} />} label="Hyperparameters" />
          {expandedSection === 'hyperparams' && (
            <div className="px-3 pb-3 space-y-3">
              <HyperParam
                label="Learning Rate"
                id="hp-lr"
                value={config.learningRate}
                min={0.0001}
                max={1}
                step={0.001}
                onChange={(v) => setConfig({ learningRate: v })}
                disabled={isRunning}
              />
              <HyperParam
                label="Momentum β"
                id="hp-momentum"
                value={config.momentum}
                min={0}
                max={0.999}
                step={0.01}
                onChange={(v) => setConfig({ momentum: v })}
                disabled={isRunning}
              />
              <HyperParam
                label="Adam β₁"
                id="hp-beta1"
                value={config.beta1}
                min={0}
                max={0.9999}
                step={0.001}
                onChange={(v) => setConfig({ beta1: v })}
                disabled={isRunning}
              />
              <HyperParam
                label="Adam β₂"
                id="hp-beta2"
                value={config.beta2}
                min={0}
                max={0.9999}
                step={0.0001}
                onChange={(v) => setConfig({ beta2: v })}
                disabled={isRunning}
              />
              <HyperParam
                label="Weight Decay λ"
                id="hp-wd"
                value={config.weightDecay}
                min={0}
                max={1}
                step={0.001}
                onChange={(v) => setConfig({ weightDecay: v })}
                disabled={isRunning}
              />

              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1.5 block" style={{ color: '#5a6478' }}>
                  Max Epochs
                </label>
                <input
                  type="number"
                  className="input-field"
                  id="hp-max-epochs"
                  value={maxEpochs}
                  min={10}
                  max={5000}
                  disabled={isRunning}
                  onChange={(e) => setMaxEpochs(parseInt(e.target.value) || 200)}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#5a6478' }}>
                  Init W
                </label>
                <input
                  type="number"
                  className="input-field"
                  id="hp-init-w"
                  step={0.1}
                  value={initialParams.w.toFixed(2)}
                  disabled={isRunning}
                  onChange={(e) => setInitialParams({ ...initialParams, w: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider mb-1 block" style={{ color: '#5a6478' }}>
                  Init B
                </label>
                <input
                  type="number"
                  className="input-field"
                  id="hp-init-b"
                  step={0.1}
                  value={initialParams.b.toFixed(2)}
                  disabled={isRunning}
                  onChange={(e) => setInitialParams({ ...initialParams, b: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function HyperParam({
  label, id, value, min, max, step, onChange, disabled
}: {
  label: string; id: string; value: number; min: number; max: number;
  step: number; onChange: (v: number) => void; disabled: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] uppercase tracking-wider" style={{ color: '#5a6478' }} htmlFor={id}>
          {label}
        </label>
        <span className="mono text-[11px]" style={{ color: '#22d3ee' }}>{value.toFixed(4)}</span>
      </div>
      <input
        type="range"
        id={id}
        className="slider w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}

function RegressionConfigPanel() {
  const { regressionConfig, setRegressionConfig, status } = useSimulationStore()
  const disabled = status === 'running'
  return (
    <div className="mt-3 p-2 rounded-lg space-y-2" style={{ background: '#0B0D12', border: '1px solid #252B38' }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#5a6478' }}>
        Dataset Config
      </div>
      {([
        { key: 'trueW', label: 'True W', min: -5, max: 5, step: 0.1 },
        { key: 'trueB', label: 'True B', min: -5, max: 5, step: 0.1 },
        { key: 'noise', label: 'Noise σ', min: 0, max: 3, step: 0.05 },
        { key: 'nSamples', label: 'Samples', min: 10, max: 500, step: 10 },
      ] as const).map(({ key, label, min, max, step }) => (
        <div key={key}>
          <div className="flex justify-between mb-0.5">
            <label className="text-[10px]" style={{ color: '#5a6478' }}>{label}</label>
            <span className="mono text-[10px]" style={{ color: '#8892a4' }}>
              {regressionConfig[key]}
            </span>
          </div>
          <input type="range" className="slider w-full" min={min} max={max} step={step}
            value={regressionConfig[key]} disabled={disabled}
            onChange={(e) => setRegressionConfig({ [key]: parseFloat(e.target.value) })}
          />
        </div>
      ))}
    </div>
  )
}
