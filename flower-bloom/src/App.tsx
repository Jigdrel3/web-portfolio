import { useCallback, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './scene/Scene';
import { useHandTracking } from './tracking/useHandTracking';
import { useFallbackControls } from './tracking/useFallbackControls';
import { useBloomStore } from './state/store';
import { CameraGate } from './ui/CameraGate';
import { SpeciesPanel } from './ui/SpeciesPanel';
import { GestureLegend } from './ui/GestureLegend';
import { GestureIndicator } from './ui/GestureIndicator';
import { BouquetJar } from './ui/BouquetJar';
import { PickedFlowerFx } from './ui/PickedFlowerFx';
import type { Vec2 } from './types';

export default function App() {
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const cameraStatus = useBloomStore((s) => s.cameraStatus);
  const fallbackMode = useBloomStore((s) => s.fallbackMode);
  const setFallbackMode = useBloomStore((s) => s.setFallbackMode);

  const getNearPoint = useCallback((): Vec2 | null => {
    const { flower } = useBloomStore.getState();
    return flower ? flower.spawnRawPoint : null;
  }, []);

  useHandTracking(videoRef, getNearPoint, started && !fallbackMode);
  useFallbackControls(containerRef);

  return (
    <div className="app-root" ref={containerRef}>
      <video ref={videoRef} className="camera-feed" playsInline muted aria-hidden />

      <Canvas
        className="scene-canvas"
        style={{ pointerEvents: 'none' }}
        camera={{ position: [0, 1.3, 4.4], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene />
      </Canvas>

      <CameraGate
        started={started}
        cameraStatus={cameraStatus}
        fallbackMode={fallbackMode}
        onEnableCamera={() => setStarted(true)}
        onUseFallback={() => {
          setFallbackMode(true);
          setStarted(true);
        }}
      />

      <div className="hud-top-left">
        <GestureIndicator />
        <GestureLegend />
      </div>

      <SpeciesPanel />
      <BouquetJar />
      <PickedFlowerFx />
    </div>
  );
}
