import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { memo, useEffect, useRef, useState } from 'react'
import { AnatomyModel } from './AnatomyModel'
import type { BodyView, RegionId } from '../../types/stretch'
function Camera({ view }: { view: BodyView }) {
  const { camera } = useThree()
  const angle = useRef(view === 'front' ? 0 : Math.PI)
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReducedMotion(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useFrame((_, delta) => {
    const targetAngle = view === 'front' ? 0 : Math.PI
    angle.current += (targetAngle - angle.current) * (reducedMotion ? 1 : 1 - Math.exp(-7 * delta))
    camera.position.set(Math.sin(angle.current) * 7.8, .1, Math.cos(angle.current) * 7.8)
    camera.lookAt(0, -.05, 0)
  })
  return null
}
function AnatomyScene({ view, selected, completed, coverageTones, onSelect, interactive = true }: {
  view: BodyView; selected: RegionId | null; completed: ReadonlySet<RegionId>; coverageTones?: ReadonlyMap<RegionId, 'well' | 'less' | 'building'>; onSelect: (region: RegionId) => void; interactive?: boolean
}) {
  return <Canvas camera={{ position: [0, .1, 7.8], fov: 38, near: .1, far: 100 }} dpr={[1, 1.7]} gl={{ antialias: true, alpha: true }} fallback={<p>Use the text controls to continue.</p>} aria-label={interactive ? "3D stretch body map. Equivalent region buttons are available below." : "3D completion body map. Completed regions are also listed as text."} tabIndex={-1}>
    <ambientLight intensity={1} />
    <hemisphereLight args={['#fff8ee', '#596e6a', 1.4]} />
    <directionalLight position={[3, 5, 5]} intensity={2.25} color="#fff7e9" />
    <directionalLight position={[-3, 2, -4]} intensity={1.15} color="#83a9a5" />
    <Camera view={view} />
    <AnatomyModel selectedMuscle={selected} completedMuscles={completed} coverageTones={coverageTones} onSelect={onSelect} interactive={interactive} />
  </Canvas>
}

export default memo(AnatomyScene)
