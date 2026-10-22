import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { OptimizerName } from '../../optimizers/types'

interface TheoryData {
  name: OptimizerName
  label: string
  color: string
  intuition: string
  updateRule: string[]  // LaTeX strings
  stateVars: string[]
  advantage: string
  limitation: string
  hyperparams: string[]
  usefulFor: string
}

const THEORY_DATA: TheoryData[] = [
  {
    name: 'sgd',
    label: 'Vanilla SGD',
    color: '#22d3ee',
    intuition: 'Follow the negative gradient — the direction of steepest descent — to reduce the loss each step.',
    updateRule: [
      '\\theta_{t+1} = \\theta_t - \\eta \\nabla L(\\theta_t)',
    ],
    stateVars: ['None (stateless)'],
    advantage: 'Simple, memory-efficient, and well-understood theoretically.',
    limitation: 'Sensitive to learning rate choice; slow in ravines and noisy gradients.',
    hyperparams: ['η (learning rate)'],
    usefulFor: 'Convex problems, large-scale models where memory is critical.',
  },
  {
    name: 'momentum',
    label: 'Momentum',
    color: '#a78bfa',
    intuition: 'Accumulate a velocity vector in the gradient direction. Like a ball rolling downhill, gaining speed along consistent gradients.',
    updateRule: [
      'v_t = \\beta v_{t-1} + \\nabla L(\\theta_t)',
      '\\theta_{t+1} = \\theta_t - \\eta v_t',
    ],
    stateVars: ['v (velocity)'],
    advantage: 'Reduces oscillation across steep dimensions, accelerates along flat ones.',
    limitation: 'May overshoot in sharp curvatures; requires tuning β.',
    hyperparams: ['η (learning rate)', 'β (momentum coefficient, typically 0.9)'],
    usefulFor: 'Deep networks with flat regions and noisy gradients.',
  },
  {
    name: 'nesterov',
    label: 'Nesterov AG',
    color: '#60a5fa',
    intuition: 'Evaluate the gradient at a "look-ahead" position — where momentum will take us — rather than the current position. This gives the optimizer information about where it is going.',
    updateRule: [
      'v_t = \\beta v_{t-1} + \\nabla L(\\theta_t - \\beta v_{t-1})',
      '\\theta_{t+1} = \\theta_t - \\eta v_t',
    ],
    stateVars: ['v (velocity)'],
    advantage: 'More responsive correction compared to standard momentum; better convergence bounds.',
    limitation: 'Requires look-ahead gradient computation; negligible extra cost in practice.',
    hyperparams: ['η (learning rate)', 'β (momentum coefficient)'],
    usefulFor: 'Training with well-conditioned loss surfaces where momentum helps but precision matters.',
  },
  {
    name: 'adagrad',
    label: 'AdaGrad',
    color: '#facc15',
    intuition: 'Adapt the learning rate for each parameter individually by dividing by the square root of the accumulated squared gradients. Parameters that receive large gradients get smaller updates.',
    updateRule: [
      'G_t = G_{t-1} + g_t^2',
      '\\theta_{t+1} = \\theta_t - \\frac{\\eta}{\\sqrt{G_t + \\epsilon}} g_t',
    ],
    stateVars: ['G (accumulated squared gradient)'],
    advantage: 'Works well for sparse gradients; no manual learning rate schedule needed.',
    limitation: 'G grows monotonically — learning rate shrinks to zero; stops learning in long runs.',
    hyperparams: ['η (learning rate)', 'ε (numerical stability)'],
    usefulFor: 'NLP with sparse features, embeddings.',
  },
  {
    name: 'rmsprop',
    label: 'RMSProp',
    color: '#fb923c',
    intuition: 'Fix AdaGrad\'s vanishing LR by using an exponential moving average of squared gradients instead of accumulating all history.',
    updateRule: [
      's_t = \\beta s_{t-1} + (1-\\beta) g_t^2',
      '\\theta_{t+1} = \\theta_t - \\frac{\\eta}{\\sqrt{s_t + \\epsilon}} g_t',
    ],
    stateVars: ['s (EMA of squared gradients)'],
    advantage: 'Effective for non-stationary objectives; works well in online and recurrent settings.',
    limitation: 'No bias correction; can be sensitive to initial β and η choices.',
    hyperparams: ['η (learning rate)', 'β (decay factor, typically 0.9)', 'ε'],
    usefulFor: 'RNNs, non-stationary objectives, RL training.',
  },
  {
    name: 'adam',
    label: 'Adam',
    color: '#34d399',
    intuition: 'Combine momentum (first moment) and RMSProp (second moment) with bias correction to compensate for the zero initialisation of both moments.',
    updateRule: [
      'm_t = \\beta_1 m_{t-1} + (1-\\beta_1) g_t',
      'v_t = \\beta_2 v_{t-1} + (1-\\beta_2) g_t^2',
      '\\hat{m}_t = m_t / (1 - \\beta_1^t), \\quad \\hat{v}_t = v_t / (1 - \\beta_2^t)',
      '\\theta_{t+1} = \\theta_t - \\eta \\hat{m}_t / (\\sqrt{\\hat{v}_t} + \\epsilon)',
    ],
    stateVars: ['m (first moment)', 'v (second moment)'],
    advantage: 'Robust default for most architectures; handles sparse gradients and non-stationary objectives.',
    limitation: 'Can converge to sub-optimal solutions; weight decay is entangled with adaptive updates.',
    hyperparams: ['η', 'β₁ (0.9)', 'β₂ (0.999)', 'ε (1e-8)'],
    usefulFor: 'Default choice for deep learning; transformers, CNNs, GANs.',
  },
  {
    name: 'adamw',
    label: 'AdamW',
    color: '#f472b6',
    intuition: 'Decouple weight decay from the adaptive learning rate. Standard Adam applies L2 regularization through the gradient, which gets scaled by the adaptive rate. AdamW applies weight decay directly to the parameters — as originally intended.',
    updateRule: [
      '\\text{(same moments as Adam)}',
      '\\theta_{t+1} = \\theta_t - \\eta \\left[\\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\epsilon} + \\lambda\\theta_t\\right]',
    ],
    stateVars: ['m (first moment)', 'v (second moment)'],
    advantage: 'Proper L2 regularisation; better generalisation than Adam in many fine-tuning tasks.',
    limitation: 'Weight decay effect may be negligible on centred quadratics; requires λ tuning.',
    hyperparams: ['η', 'β₁', 'β₂', 'ε', 'λ (weight decay)'],
    usefulFor: 'Large language models, transformer fine-tuning, any setting where regularization matters.',
  },
]

function EquationLine({ latex }: { latex: string }) {
  // Render LaTeX using KaTeX if available, fallback to code block
  const [rendered, setRendered] = React.useState<string | null>(null)
  React.useEffect(() => {
    try {
      const katex = (window as any).katex
      if (katex) {
        setRendered(katex.renderToString(latex, { throwOnError: false, displayMode: false }))
      }
    } catch { /* ignore */ }
  }, [latex])

  if (rendered) {
    return (
      <div className="py-1 px-2 rounded my-1 overflow-x-auto"
        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1e2535' }}
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    )
  }
  return (
    <code className="block py-1 px-2 rounded text-xs my-1"
      style={{ background: 'rgba(0,0,0,0.3)', color: '#22d3ee', fontFamily: 'JetBrains Mono, monospace' }}>
      {latex}
    </code>
  )
}

function TheoryCard({ data }: { data: TheoryData }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="panel rounded-xl overflow-hidden animate-fade-in"
      style={{ borderColor: `${data.color}25` }}>
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setExpanded((e) => !e)}
        id={`theory-${data.name}`}
        style={{ background: `${data.color}08` }}
      >
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: data.color }} />
          <span className="font-semibold text-sm" style={{ color: data.color }}>{data.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs max-w-sm text-left hidden sm:block" style={{ color: '#5a6478' }}>
            {data.intuition.slice(0, 80)}…
          </p>
          {expanded ? <ChevronUp size={14} style={{ color: '#5a6478' }} /> : <ChevronDown size={14} style={{ color: '#5a6478' }} />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 space-y-4 border-t" style={{ borderColor: `${data.color}15` }}>
          {/* Intuition */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: '#5a6478' }}>Intuition</div>
            <p className="text-xs leading-relaxed" style={{ color: '#8892a4' }}>{data.intuition}</p>
          </div>

          {/* Update rule */}
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: '#5a6478' }}>Update Rule</div>
            {data.updateRule.map((eq, i) => <EquationLine key={i} latex={eq} />)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* State variables */}
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: '#5a6478' }}>State Variables</div>
              <ul className="space-y-0.5">
                {data.stateVars.map((v) => (
                  <li key={v} className="text-xs flex gap-1.5" style={{ color: '#8892a4' }}>
                    <span style={{ color: data.color }}>·</span> {v}
                  </li>
                ))}
              </ul>
            </div>

            {/* Hyperparameters */}
            <div>
              <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: '#5a6478' }}>Hyperparameters</div>
              <ul className="space-y-0.5">
                {data.hyperparams.map((h) => (
                  <li key={h} className="text-xs" style={{ color: '#8892a4' }}>
                    <span style={{ color: data.color }}>·</span> {h}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Advantage */}
            <div className="rounded-lg p-3" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#34d399' }}>Advantage</div>
              <p className="text-xs" style={{ color: '#8892a4' }}>{data.advantage}</p>
            </div>

            {/* Limitation */}
            <div className="rounded-lg p-3" style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.15)' }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#fb923c' }}>Limitation</div>
              <p className="text-xs" style={{ color: '#8892a4' }}>{data.limitation}</p>
            </div>
          </div>

          {/* Use when */}
          <div className="rounded-lg p-3" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.12)' }}>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#22d3ee' }}>Useful For</div>
            <p className="text-xs" style={{ color: '#8892a4' }}>{data.usefulFor}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function TheoryPanel() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-3">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-1" style={{ color: '#e8eaf0' }}>Optimizer Theory</h2>
        <p className="text-xs leading-relaxed" style={{ color: '#5a6478' }}>
          Each optimizer implements a specific update rule. The choice of optimizer affects convergence speed,
          stability, and final accuracy. Note that full-batch gradient descent (used in this simulation) differs
          from mini-batch SGD used in practice — the simulation computes exact gradients, eliminating gradient noise.
        </p>
      </div>
      {THEORY_DATA.map((data) => <TheoryCard key={data.name} data={data} />)}
    </div>
  )
}
