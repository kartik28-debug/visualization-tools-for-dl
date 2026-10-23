import React, { useMemo, useRef, Suspense, useEffect, useContext } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useSimulationStore } from '../../store/simulationStore'
import { OPTIMIZER_REGISTRY } from '../../optimizers'
import { computeLossGrid, lossToColor } from '../../utils/math'

const GRID_RES = 60 // surface resolution

interface LossGridContextValue {
  grid: Float32Array
  zMin: number
  zMax: number
  zScale: number
  getY: (w: number, b: number) => number
}

const LossGridContext = React.createContext<LossGridContextValue>({
  grid: new Float32Array(),
  zMin: 0,
  zMax: 1,
  zScale: 3,
  getY: () => 0,
})

function LossSurfaceMesh() {
  const { lossFunction } = useSimulationStore()
  const { plotRange } = lossFunction
  const { grid, zMin, zMax, zScale } = useContext(LossGridContext)

  const geometry = useMemo(() => {
    const n = GRID_RES
    const geo = new THREE.PlaneGeometry(
      plotRange.wMax - plotRange.wMin,
      plotRange.bMax - plotRange.bMin,
      n - 1,
      n - 1
    )

    const positions = geo.attributes.position.array as Float32Array
    const colorArr = new Float32Array(positions.length)
    const zRange = zMax - zMin || 1

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const idx = i * n + j
        const z = grid[idx]
        const norm = Math.pow((z - zMin) / zRange, 0.45)
        const posIdx = idx * 3
        positions[posIdx + 2] = ((z - zMin) / zRange) * zScale
        const [r, g, b] = lossToColor(norm)
        colorArr[posIdx] = r
        colorArr[posIdx + 1] = g
        colorArr[posIdx + 2] = b
      }
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3))
    geo.computeVertexNormals()

    return geo
  }, [grid, plotRange, zMax, zMin, zScale])

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  return (
    <group>
      {/* Surface */}
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          (plotRange.wMin + plotRange.wMax) / 2,
          0,
          (plotRange.bMin + plotRange.bMax) / 2,
        ]}
      >
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          (plotRange.wMin + plotRange.wMax) / 2,
          0,
          (plotRange.bMin + plotRange.bMax) / 2,
        ]}
      >
        <meshBasicMaterial
          wireframe
          color="#ffffff"
          transparent
          opacity={0.04}
        />
      </mesh>
    </group>
  )
}

interface TrajectoryMarkerProps {
  name: string
  color: string
}

function TrajectoryMarker({ name, color }: TrajectoryMarkerProps) {
  const { optimizerStates } = useSimulationStore()
  const { getY } = useContext(LossGridContext)
  const state = optimizerStates[name as keyof typeof optimizerStates]
  const meshRef = useRef<THREE.Mesh>(null)

  // Animate sphere bob, respecting reduced motion
  useFrame(({ clock }) => {
    if (meshRef.current && state) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const bob = prefersReducedMotion ? 0 : Math.sin(clock.elapsedTime * 3) * 0.03
      meshRef.current.position.y = getY(state.params.w, state.params.b) + bob
    }
  })

  const trajectoryPoints = useMemo(() => {
    if (!state || state.history.length === 0) return []
    return state.history.map((r) => new THREE.Vector3(r.w, getY(r.w, r.b), r.b))
  }, [state, getY])

  const lineObject = useMemo(() => {
    if (trajectoryPoints.length < 2) return null
    const geo = new THREE.BufferGeometry().setFromPoints(trajectoryPoints)
    const mat = new THREE.LineBasicMaterial({
      color,
      linewidth: 2,
      transparent: true,
      opacity: 0.8,
    })
    return new THREE.Line(geo, mat)
  }, [trajectoryPoints, color])

  useEffect(() => {
    return () => {
      if (lineObject) {
        lineObject.geometry.dispose()
        if (Array.isArray(lineObject.material)) {
          lineObject.material.forEach((m) => m.dispose())
        } else {
          lineObject.material.dispose()
        }
      }
    }
  }, [lineObject])

  if (!state || state.history.length === 0) return null

  return (
    <group>
      {/* Trajectory line */}
      {lineObject && <primitive object={lineObject} />}

      {/* Current position sphere */}
      <mesh
        ref={meshRef}
        position={[state.params.w, getY(state.params.w, state.params.b), state.params.b]}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* Glow halo */}
      <mesh position={[state.params.w, getY(state.params.w, state.params.b), state.params.b]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
    </group>
  )
}

function GlobalMinimumMarker() {
  const { lossFunction } = useSimulationStore()
  const { globalMinimum } = lossFunction
  const { zMin, zMax, zScale } = useContext(LossGridContext)

  if (!globalMinimum) return null

  const minLoss = lossFunction.loss(globalMinimum.w, globalMinimum.b)
  const y = ((minLoss - zMin) / (zMax - zMin || 1)) * zScale + 0.1

  return (
    <group position={[globalMinimum.w, y, globalMinimum.b]}>
      {/* Diamond-shaped marker using octahedron */}
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.12]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} />
      </mesh>
      {/* Vertical pole */}
      <mesh position={[0, -y / 2, 0]}>
        <cylinderGeometry args={[0.01, 0.01, y, 4]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

function AxisLabels() {
  const { lossFunction } = useSimulationStore()
  const { plotRange } = lossFunction
  const midW = (plotRange.wMin + plotRange.wMax) / 2
  const midB = (plotRange.bMin + plotRange.bMax) / 2

  return (
    <group>
      <Text position={[plotRange.wMax + 0.3, 0.1, midB]} fontSize={0.2} color="#5a6478" anchorX="left">
        w →
      </Text>
      <Text position={[midW, 0.1, plotRange.bMax + 0.3]} fontSize={0.2} color="#5a6478" anchorX="center">
        b →
      </Text>
      <Text position={[plotRange.wMin - 0.2, 3.2, midB]} fontSize={0.18} color="#5a6478" anchorX="right">
        Loss ↑
      </Text>
    </group>
  )
}

export function LossSurface3D() {
  const { selectedOptimizers, lossFunction } = useSimulationStore()
  const { plotRange } = lossFunction
  const zScale = 3

  const lossGridData = useMemo(() => {
    const { grid, zMin, zMax } = computeLossGrid(
      lossFunction.loss,
      plotRange.wMin,
      plotRange.wMax,
      plotRange.bMin,
      plotRange.bMax,
      GRID_RES
    )
    const zRange = zMax - zMin || 1
    const getY = (w: number, b: number) => {
      const loss = lossFunction.loss(w, b)
      return ((loss - zMin) / zRange) * zScale + 0.08
    }
    return { grid, zMin, zMax, zScale, getY }
  }, [lossFunction, plotRange, zScale])

  return (
    <div className="w-full h-full relative" style={{ minHeight: 280 }}>
      <Canvas
        camera={{ position: [5, 5, 8], fov: 45, near: 0.1, far: 200 }}
        style={{ background: '#0B0D12', borderRadius: 8 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1.0} castShadow={false} />
        <directionalLight position={[-5, 4, -5]} intensity={0.3} />
        <pointLight position={[0, 6, 0]} intensity={0.5} color="#22d3ee" />

        <Suspense fallback={null}>
          <LossGridContext.Provider value={lossGridData}>
            <LossSurfaceMesh />
            <GlobalMinimumMarker />
            {selectedOptimizers.map((name) => (
              <TrajectoryMarker
                key={name}
                name={name}
                color={OPTIMIZER_REGISTRY[name].color}
              />
            ))}
            <AxisLabels />
          </LossGridContext.Provider>
        </Suspense>

        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.3}
          cellColor="#252B38"
          sectionSize={2}
          sectionThickness={0.5}
          sectionColor="#363e52"
          fadeDistance={20}
          fadeStrength={1}
          position={[0, -0.01, 0]}
        />

        <OrbitControls
          makeDefault
          enablePan
          enableZoom
          enableRotate
          minDistance={1}
          maxDistance={30}
          target={[1, 0.5, 0]}
          zoomSpeed={0.8}
        />
      </Canvas>
    </div>
  )
}
