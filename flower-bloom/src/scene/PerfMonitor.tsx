import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBloomStore } from '../state/store';

const DOWNGRADE_FPS = 42;
const UPGRADE_FPS = 55;
const DOWNGRADE_SUSTAIN_MS = 2500;
const UPGRADE_SUSTAIN_MS = 5000;

/**
 * Watches render frame rate and steps postprocessing/quality down (and back up) so the render
 * loop stays smooth under real hand-tracking load, per PRD §9.
 */
export function PerfMonitor() {
  const lowSince = useRef<number | null>(null);
  const highSince = useRef<number | null>(null);
  const smoothedFps = useRef(60);

  useFrame((_state, dt) => {
    if (dt <= 0) return;
    const instantFps = 1 / dt;
    smoothedFps.current += (instantFps - smoothedFps.current) * 0.08;

    const store = useBloomStore.getState();
    if (Math.abs(store.fps - smoothedFps.current) > 1) {
      store.setFps(Math.round(smoothedFps.current));
    }

    const now = performance.now();
    if (smoothedFps.current < DOWNGRADE_FPS) {
      if (lowSince.current === null) lowSince.current = now;
      highSince.current = null;
      if (store.quality === 'high' && now - lowSince.current > DOWNGRADE_SUSTAIN_MS) {
        store.setQuality('low');
      }
    } else if (smoothedFps.current > UPGRADE_FPS) {
      if (highSince.current === null) highSince.current = now;
      lowSince.current = null;
      if (store.quality === 'low' && now - highSince.current > UPGRADE_SUSTAIN_MS) {
        store.setQuality('high');
      }
    } else {
      lowSince.current = null;
      highSince.current = null;
    }
  });

  return null;
}
