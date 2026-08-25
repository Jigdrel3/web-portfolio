import type { GestureState } from '../types';

/**
 * Per-frame gesture state lives outside React/zustand so 3D animation code can read it every
 * frame (in useFrame) without triggering component re-renders 60x/sec. UI components that only
 * need discrete/display state subscribe via `subscribe()`, which is throttled by the caller.
 */
export const emptyGestureState: GestureState = {
  hands: [],
  singlePinch: false,
  twoHandPinch: false,
  doublePinch: false,
  pointing: false,
  pointDirection: null,
  pointTip: null,
  circularMotion: null,
  flick: null,
  beckon: false,
  holdNearFlower: false,
};

let current: GestureState = emptyGestureState;
const listeners = new Set<(g: GestureState) => void>();

export function getGesture(): GestureState {
  return current;
}

export function setGesture(g: GestureState): void {
  current = g;
  listeners.forEach((l) => l(g));
}

export function subscribeGesture(listener: (g: GestureState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
