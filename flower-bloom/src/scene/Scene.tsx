import { useCallback } from 'react';
import { useBloomStore } from '../state/store';
import { Flower } from './Flower';
import { GameLoop } from './GameLoop';
import { CameraRig } from './CameraRig';
import { Particles } from './Particles';
import { PerfMonitor } from './PerfMonitor';
import { Effects } from '../postprocessing/Effects';
import { flowerHeadWorldPos } from './species';

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
      <circleGeometry args={[3.2, 48]} />
      <meshStandardMaterial color="#0b1410" roughness={0.95} metalness={0} />
    </mesh>
  );
}

export function Scene() {
  const flower = useBloomStore((s) => s.flower);
  const quality = useBloomStore((s) => s.quality);
  const reducedMotion = useBloomStore((s) => s.reducedMotion);

  const getFlowerWorldPos = useCallback((): [number, number, number] | null => {
    const f = useBloomStore.getState().flower;
    if (!f) return null;
    return flowerHeadWorldPos(f.species, f.groundX);
  }, []);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 4, 3]} intensity={1.1} castShadow={quality === 'high'} />
      <pointLight position={[-2, 1.5, -1]} intensity={0.4} color="#7fffb0" />

      <Ground />
      {flower && <Flower instance={flower} reducedMotion={reducedMotion} />}
      <Particles getFlowerWorldPos={getFlowerWorldPos} />

      <GameLoop />
      <CameraRig />
      <PerfMonitor />
      {quality === 'high' && <Effects />}
    </>
  );
}
