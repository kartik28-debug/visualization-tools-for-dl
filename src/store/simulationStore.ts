import { create } from 'zustand'
import {
  type OptimizerName,
  type OptimizerConfig,
  type OptimizerState,
  DEFAULT_CONFIG,
} from '../optimizers'
import { type LossFunctionName, type LossFunction } from '../losses/types'
import { LOSS_REGISTRY, createRegressionLoss, generateDataset } from '../losses'
import { createOptimizerState, stepOptimizer } from '../simulation/engine'
import { type ExperimentPreset } from '../simulation/presets'

export type SimStatus = 'idle' | 'running' | 'paused' | 'done'
export type ActiveTab = 'playground' | 'theory' | 'benchmarks'

export interface RegressionConfig {
  trueW: number
  trueB: number
  noise: number
  nSamples: number
  seed: number
}

interface SimulationStore {
  // --- UI State ---
  activeTab: ActiveTab
  sidebarOpen: boolean
  activeVizTab: 'contour' | '3d' | 'charts'
  showOnboarding: boolean

  // --- Experiment Config ---
  lossName: LossFunctionName
  lossFunction: LossFunction
  selectedOptimizers: OptimizerName[]
  config: OptimizerConfig
  perOptimizerConfig: Partial<Record<OptimizerName, Partial<OptimizerConfig>>>
  initialParams: { w: number; b: number }
  maxEpochs: number
  regressionConfig: RegressionConfig

  // --- Simulation State ---
  status: SimStatus
  optimizerStates: Partial<Record<OptimizerName, OptimizerState>>
  currentEpoch: number
  playbackSpeed: number // multiplier
  startTime: number | null
  endTime: number | null

  // --- Actions ---
  setActiveTab(tab: ActiveTab): void
  setSidebarOpen(open: boolean): void
  setActiveVizTab(tab: 'contour' | '3d' | 'charts'): void
  dismissOnboarding(): void

  setLossFunction(name: LossFunctionName): void
  toggleOptimizer(name: OptimizerName): void
  selectAllOptimizers(): void
  clearOptimizers(): void
  setConfig(patch: Partial<OptimizerConfig>): void
  setPerOptimizerConfig(name: OptimizerName, patch: Partial<OptimizerConfig>): void
  setInitialParams(params: { w: number; b: number }): void
  setMaxEpochs(n: number): void
  setPlaybackSpeed(speed: number): void
  setRegressionConfig(patch: Partial<RegressionConfig>): void

  initialize(): void   // build fresh optimizer states
  stepAll(): void      // advance all optimizers by one epoch
  play(): void
  pause(): void
  reset(): void
  applyPreset(preset: ExperimentPreset): void

  getEffectiveConfig(name: OptimizerName): OptimizerConfig
}

function buildLossFunction(
  name: LossFunctionName,
  regConfig: RegressionConfig
): LossFunction {
  if (name === 'regression') {
    const dataset = generateDataset(
      regConfig.trueW,
      regConfig.trueB,
      regConfig.noise,
      regConfig.nSamples,
      regConfig.seed
    )
    return createRegressionLoss(dataset)
  }
  const lf = LOSS_REGISTRY[name]
  if (!lf) throw new Error(`Unknown loss: ${name}`)
  return lf
}

const DEFAULT_REG_CONFIG: RegressionConfig = {
  trueW: 2, trueB: 1, noise: 0.5, nSamples: 50, seed: 42
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // --- Initial UI State ---
  activeTab: 'playground',
  sidebarOpen: true,
  activeVizTab: '3d',
  showOnboarding: true,

  // --- Initial Experiment Config ---
  lossName: 'quadratic',
  lossFunction: LOSS_REGISTRY.quadratic!,
  selectedOptimizers: ['sgd', 'momentum', 'adam'],
  config: { ...DEFAULT_CONFIG },
  perOptimizerConfig: {},
  initialParams: { w: -2, b: 2 },
  maxEpochs: 200,
  regressionConfig: { ...DEFAULT_REG_CONFIG },

  // --- Initial Simulation State ---
  status: 'idle',
  optimizerStates: {},
  currentEpoch: 0,
  playbackSpeed: 1,
  startTime: null,
  endTime: null,

  // --- UI Actions ---
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveVizTab: (tab) => set({ activeVizTab: tab }),
  dismissOnboarding: () => set({ showOnboarding: false }),

  // --- Config Actions ---
  setLossFunction: (name) => {
    const regConfig = get().regressionConfig
    const lossFunction = buildLossFunction(name, regConfig)
    set({
      lossName: name,
      lossFunction,
      status: 'idle',
      optimizerStates: {},
      currentEpoch: 0,
      initialParams: lossFunction.suggestedInit,
    })
  },

  toggleOptimizer: (name) => {
    const { selectedOptimizers, status } = get()
    if (status === 'running') return
    const next = selectedOptimizers.includes(name)
      ? selectedOptimizers.filter((n) => n !== name)
      : [...selectedOptimizers, name]
    set({ selectedOptimizers: next, status: 'idle', optimizerStates: {}, currentEpoch: 0 })
  },

  selectAllOptimizers: () => {
    set({
      selectedOptimizers: ['sgd','momentum','nesterov','adagrad','rmsprop','adam','adamw'],
      status: 'idle', optimizerStates: {}, currentEpoch: 0,
    })
  },

  clearOptimizers: () => {
    set({ selectedOptimizers: [], status: 'idle', optimizerStates: {}, currentEpoch: 0 })
  },

  setConfig: (patch) => {
    set((s) => ({ config: { ...s.config, ...patch } }))
  },

  setPerOptimizerConfig: (name, patch) => {
    set((s) => ({
      perOptimizerConfig: {
        ...s.perOptimizerConfig,
        [name]: { ...(s.perOptimizerConfig[name] ?? {}), ...patch },
      },
    }))
  },

  setInitialParams: (params) => {
    set({ initialParams: params, status: 'idle', optimizerStates: {}, currentEpoch: 0 })
  },

  setMaxEpochs: (n) => set({ maxEpochs: n }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  setRegressionConfig: (patch) => {
    const newRegConfig = { ...get().regressionConfig, ...patch }
    set({ regressionConfig: newRegConfig })
    if (get().lossName === 'regression') {
      const lossFunction = buildLossFunction('regression', newRegConfig)
      set({ lossFunction, status: 'idle', optimizerStates: {}, currentEpoch: 0 })
    }
  },

  getEffectiveConfig: (name) => {
    const { config, perOptimizerConfig } = get()
    return { ...config, ...(perOptimizerConfig[name] ?? {}) }
  },

  // --- Simulation Actions ---
  initialize: () => {
    const { selectedOptimizers, initialParams, lossFunction, getEffectiveConfig } = get()
    const optimizerStates: Partial<Record<OptimizerName, OptimizerState>> = {}
    for (const name of selectedOptimizers) {
      optimizerStates[name] = createOptimizerState(
        name,
        initialParams,
        getEffectiveConfig(name),
        lossFunction
      )
    }
    set({ optimizerStates, currentEpoch: 0, status: 'idle', startTime: null, endTime: null })
  },

  stepAll: () => {
    const { optimizerStates, selectedOptimizers, lossFunction, maxEpochs } = get()
    const newStates: Partial<Record<OptimizerName, OptimizerState>> = {}
    let allDone = true

    for (const name of selectedOptimizers) {
      const state = optimizerStates[name]
      if (!state) continue
      if (state.converged || state.diverged || state.epoch >= maxEpochs) {
        newStates[name] = state
        continue
      }
      allDone = false
      newStates[name] = stepOptimizer(state, name, lossFunction)
    }

    const maxEpoch = Math.max(
      ...selectedOptimizers.map((n) => newStates[n]?.epoch ?? 0)
    )

    const done = allDone || selectedOptimizers.every((n) => {
      const s = newStates[n]
      return !s || s.converged || s.diverged || s.epoch >= maxEpochs
    })

    set({
      optimizerStates: newStates,
      currentEpoch: maxEpoch,
      ...(done ? { status: 'done', endTime: Date.now() } : {}),
    })
  },

  play: () => {
    const { status, optimizerStates, selectedOptimizers } = get()
    if (status === 'running') return

    // Initialize if not yet
    const needsInit = selectedOptimizers.length > 0 &&
      !optimizerStates[selectedOptimizers[0]]

    if (needsInit) {
      get().initialize()
    }

    set({ status: 'running', startTime: Date.now() })
  },

  pause: () => set({ status: 'paused' }),

  reset: () => {
    set({
      status: 'idle',
      optimizerStates: {},
      currentEpoch: 0,
      startTime: null,
      endTime: null,
    })
  },

  applyPreset: (preset) => {
    const lossFunction = buildLossFunction(preset.lossFunction, get().regressionConfig)
    set({
      lossName: preset.lossFunction,
      lossFunction,
      selectedOptimizers: preset.selectedOptimizers,
      config: { ...DEFAULT_CONFIG, ...preset.config },
      perOptimizerConfig: {},
      initialParams: preset.initialParams,
      maxEpochs: preset.maxEpochs,
      status: 'idle',
      optimizerStates: {},
      currentEpoch: 0,
      startTime: null,
      endTime: null,
    })
  },
}))
