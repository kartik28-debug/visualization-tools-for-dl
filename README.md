# Optimizer Lab — Interactive Deep Learning Optimizer Comparison

An interactive, high-performance visualization dashboard for exploring and comparing deep learning optimization algorithms on diverse 2D and 3D loss landscapes.

Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, **Three.js**, **React Three Fiber**, **Zustand**, and **Recharts**.

---

## Features

- **Interactive 3D Loss Surface**: Real-time rendering of mathematical loss surfaces with dynamic height colormapping, contour lines, orbit controls, wireframe overlays, and animated trajectory markers.
- **2D Contour Map**: High-resolution top-down contour plot with custom marching contour lines. Click or tap anywhere to place initial parameters $(w, b)$.
- **Simultaneous Optimizer Comparison**: Run and compare up to 7 optimizers side-by-side from identical starting coordinates:
  - **SGD** (Stochastic / Standard Gradient Descent)
  - **Momentum** (Classical Polyak Momentum)
  - **Nesterov AG** (Accelerated Gradient)
  - **AdaGrad** (Adaptive Gradient Algorithm)
  - **RMSProp** (Root Mean Square Propagation)
  - **Adam** (Adaptive Moment Estimation)
  - **AdamW** (Decoupled Weight Decay)
- **Diverse Loss Landscapes**:
  - *Quadratic Bowl*: Elliptic paraboloid benchmark for conditioning and oscillation analysis.
  - *Rosenbrock*: Ill-conditioned curved banana valley.
  - *Himmelblau*: Multimodal surface with 4 distinct local and global minima.
  - *Linear Regression MSE*: Real MSE loss calculated over synthetic data samples with configurable noise.
- **Simulation Engine & Controls**:
  - Full playback controls: Play, Pause, Resume, Single-step, and Reset.
  - Variable speed selector ($0.25\times$, $0.5\times$, $1\times$, $2\times$, $4\times$).
  - Guardrails against divergence, $\text{NaN}$, and $\pm\infty$.
  - Export run trajectories as CSV.
- **Rich Analytics & Metrics**:
  - Live metric cards tracking current loss, best loss, gradient norm $\|\nabla L\|$, and parameter distance to global optimum.
  - Sortable comparison table with convergence/divergence indicators.
  - Dynamic time-series charts with linear and logarithmic scaling.
- **Mathematical Theory Hub**:
  - Formulations, update rules, moment equations rendered with KaTeX.
  - Practical intuition, advantages, limitations, and standard hyperparameters.
- **Responsive & Accessible**:
  - Scientific dark dashboard optimized for mobile ($360\text{px}+$), tablet, and desktop ($1440\text{px}+$).
  - Respects `prefers-reduced-motion` settings.

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **3D Graphics**: [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) + [@react-three/drei](https://github.com/pmndrs/drei)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Charts**: [Recharts](https://recharts.org/)
- **Math & LaTeX**: [KaTeX](https://katex.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linting**: [Oxlint](https://oxc.rs/)

---

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later

### Local Installation

```bash
# Clone repository
git clone https://github.com/kartik28-debug/visualization-tools-for-dl.git
cd visualization-tools-for-dl

# Install dependencies
npm install

# Start local development server
npm run dev
```

### Production Build & Linting

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Deployment to Vercel

The project is structured as a zero-configuration Vite client-side SPA.

### Recommended Vercel Settings:

- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `./`

---

## Known Assumptions & Numerical Notes

1. **2D Parameter Space**: All surfaces model optimization over 2 parameters $(w, b)$ to facilitate direct 3D visual comparison of trajectory behavior.
2. **Nesterov Reformulation**: Implemented using the Sutskever velocity formulation evaluated at the current gradient.
3. **Approximation of Divergence**: Parameter updates with values exceeding $10^7$ or encountering non-finite calculations are flagged as `Diverged` to preserve browser stability.
