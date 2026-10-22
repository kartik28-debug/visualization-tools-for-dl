// Simulation Engine — orchestrates all optimizer steps
import {
  OPTIMIZER_REGISTRY,
  type OptimizerName,
  type OptimizerConfig,
  type OptimizerState,
  type StepRecord,
  CONVERGENCE_THRESHOLD,
  DIVERGENCE_THRESHOLD,
  DEFAULT_CONFIG,
} from '../optimizers'
import type { LossFunction } from '../losses/types'

/** Create a fresh OptimizerState for a given optimizer and starting params */
export function createOptimizerState(
  name: OptimizerName,
  initialParams: { w: number; b: number },
  config: OptimizerConfig,
  lossFunction: LossFunction
): OptimizerState {
  const def = OPTIMIZER_REGISTRY[name]
  const initialLoss = lossFunction.loss(initialParams.w, initialParams.b)
  const initGrad = lossFunction.gradient(initialParams.w, initialParams.b)
  const initGradNorm = Math.sqrt(initGrad.w ** 2 + initGrad.b ** 2)
  const distToOptimum = lossFunction.globalMinimum
    ? Math.sqrt(
        (initialParams.w - lossFunction.globalMinimum.w) ** 2 +
          (initialParams.b - lossFunction.globalMinimum.b) ** 2
      )
    : null

  const initialRecord: StepRecord = {
    epoch: 0,
    w: initialParams.w,
    b: initialParams.b,
    loss: initialLoss,
    gradNorm: initGradNorm,
    gradW: initGrad.w,
    gradB: initGrad.b,
    distToOptimum,
  }

  return {
    params: { ...initialParams },
    config: { ...config },
    internalState: def.initialState(),
    epoch: 0,
    history: [initialRecord],
    converged: false,
    diverged: false,
    bestLoss: initialLoss,
    initialLoss,
  }
}

/** Run a single optimizer step. Returns the new state (immutable). */
export function stepOptimizer(
  state: OptimizerState,
  name: OptimizerName,
  lossFunction: LossFunction
): OptimizerState {
  if (state.converged || state.diverged) return state

  const def = OPTIMIZER_REGISTRY[name]
  const { params, config, internalState, epoch } = state

  const grad = lossFunction.gradient(params.w, params.b)
  const gradNorm = Math.sqrt(grad.w ** 2 + grad.b ** 2)

  // Safety: detect NaN / Inf in gradient
  if (!isFinite(grad.w) || !isFinite(grad.b)) {
    return { ...state, diverged: true }
  }

  const { newParams, newInternalState } = def.step(params, grad, config, internalState, epoch)

  // Safety: detect NaN / Inf in new params
  if (!isFinite(newParams.w) || !isFinite(newParams.b)) {
    return { ...state, diverged: true }
  }

  const newLoss = lossFunction.loss(newParams.w, newParams.b)
  const newEpoch = epoch + 1

  const distToOptimum = lossFunction.globalMinimum
    ? Math.sqrt(
        (newParams.w - lossFunction.globalMinimum.w) ** 2 +
          (newParams.b - lossFunction.globalMinimum.b) ** 2
      )
    : null

  const record: StepRecord = {
    epoch: newEpoch,
    w: newParams.w,
    b: newParams.b,
    loss: newLoss,
    gradNorm,
    gradW: grad.w,
    gradB: grad.b,
    distToOptimum,
  }

  const diverged = !isFinite(newLoss) || newLoss > DIVERGENCE_THRESHOLD
  const converged = !diverged && gradNorm < CONVERGENCE_THRESHOLD

  return {
    params: newParams,
    config,
    internalState: newInternalState,
    epoch: newEpoch,
    history: [...state.history, record],
    converged,
    diverged,
    bestLoss: Math.min(state.bestLoss, newLoss),
    initialLoss: state.initialLoss,
  }
}

export { DEFAULT_CONFIG }
