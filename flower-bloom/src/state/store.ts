import { create } from 'zustand';
import type { GestureState, GrowthStage, SpeciesId, Vec2 } from '../types';

export type CameraStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

export interface FlowerInstance {
  id: string;
  species: SpeciesId;
  stage: GrowthStage;
  stageStartedAt: number; // performance.now() timestamp the current stage began
  rotationY: number;
  leanX: number; // beckon lean toward hand
  groundX: number; // world-space X where the stem sprouted (from the pinch location)
  spawnRawPoint: Vec2; // raw (unmirrored) camera-space pinch location, for gesture-proximity checks
}

export type FxEvent = { id: number; type: 'pop' | 'gust'; color: string };

interface BloomStore {
  selectedSpecies: SpeciesId;
  setSelectedSpecies: (s: SpeciesId) => void;

  flower: FlowerInstance | null;
  spawnFlower: (species: SpeciesId, groundX: number, spawnRawPoint: Vec2) => void;
  setStage: (stage: GrowthStage) => void;
  setRotationY: (r: number) => void;
  setLeanX: (l: number) => void;
  clearFlower: () => void;

  bouquet: SpeciesId[];
  addToBouquet: (s: SpeciesId) => void;
  jarOpen: boolean;
  setJarOpen: (open: boolean) => void;

  gesture: GestureState;
  setGesture: (g: GestureState) => void;

  cameraStatus: CameraStatus;
  setCameraStatus: (s: CameraStatus) => void;
  fallbackMode: boolean;
  setFallbackMode: (b: boolean) => void;

  reducedMotion: boolean;
  quality: 'high' | 'low';
  setQuality: (q: 'high' | 'low') => void;
  fps: number;
  setFps: (f: number) => void;

  inspectAmount: number; // 0..1 dolly-zoom progress
  setInspectAmount: (n: number) => void;

  fx: FxEvent[];
  pushFx: (e: Omit<FxEvent, 'id'>) => void;
  popFx: (id: number) => void;

  gustAt: number;
  triggerGust: () => void;

  /** startX/startY are normalized viewport coordinates (0..1) where the flower was picked. */
  pickedFlyer: { species: SpeciesId; color: string; startX: number; startY: number; startedAt: number } | null;
  launchPickedFlyer: (species: SpeciesId, color: string, startX: number, startY: number) => void;
  clearPickedFlyer: () => void;

  panelOpen: boolean;
  setPanelOpen: (b: boolean) => void;
}

let fxId = 0;

const emptyGesture: GestureState = {
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

export const useBloomStore = create<BloomStore>((set, get) => ({
  selectedSpecies: 'spiderLily',
  setSelectedSpecies: (s) => set({ selectedSpecies: s }),

  flower: null,
  spawnFlower: (species, groundX, spawnRawPoint) =>
    set({
      flower: {
        id: `${species}-${Date.now()}`,
        species,
        stage: 'sprouting',
        stageStartedAt: performance.now(),
        rotationY: 0,
        leanX: 0,
        groundX,
        spawnRawPoint,
      },
    }),
  setStage: (stage) => {
    const f = get().flower;
    if (!f) return;
    set({ flower: { ...f, stage, stageStartedAt: performance.now() } });
  },
  setRotationY: (r) => {
    const f = get().flower;
    if (!f) return;
    set({ flower: { ...f, rotationY: r } });
  },
  setLeanX: (l) => {
    const f = get().flower;
    if (!f) return;
    set({ flower: { ...f, leanX: l } });
  },
  clearFlower: () => set({ flower: null }),

  bouquet: [],
  addToBouquet: (s) => set((state) => ({ bouquet: [...state.bouquet, s] })),
  jarOpen: false,
  setJarOpen: (open) => set({ jarOpen: open }),

  gesture: emptyGesture,
  setGesture: (g) => set({ gesture: g }),

  cameraStatus: 'idle',
  setCameraStatus: (s) => set({ cameraStatus: s }),
  fallbackMode: false,
  setFallbackMode: (b) => set({ fallbackMode: b }),

  reducedMotion:
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  quality: 'high',
  setQuality: (q) => set({ quality: q }),
  fps: 60,
  setFps: (f) => set({ fps: f }),

  inspectAmount: 0,
  setInspectAmount: (n) => set({ inspectAmount: n }),

  fx: [],
  pushFx: (e) => set((state) => ({ fx: [...state.fx, { ...e, id: fxId++ }] })),
  popFx: (id) => set((state) => ({ fx: state.fx.filter((e) => e.id !== id) })),

  gustAt: 0,
  triggerGust: () => set({ gustAt: performance.now() }),

  pickedFlyer: null,
  launchPickedFlyer: (species, color, startX, startY) =>
    set({ pickedFlyer: { species, color, startX, startY, startedAt: performance.now() } }),
  clearPickedFlyer: () => set({ pickedFlyer: null }),

  panelOpen: true,
  setPanelOpen: (b) => set({ panelOpen: b }),
}));
