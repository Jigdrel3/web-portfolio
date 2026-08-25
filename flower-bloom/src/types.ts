export type SpeciesId =
  | 'spiderLily'
  | 'lily'
  | 'daisy'
  | 'freesia'
  | 'cherryBlossom'
  | 'tulip'
  | 'rose';

/** Lifecycle of a single flower instance. */
export type GrowthStage = 'seed' | 'sprouting' | 'budded' | 'blooming' | 'bloomed' | 'picked';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** A single tracked hand, normalized to [0,1] video space (MediaPipe convention). */
export interface HandFrame {
  handedness: 'Left' | 'Right';
  landmarks: Vec3[]; // 21 landmarks
  worldLandmarks: Vec3[];
}

export interface PinchState {
  active: boolean;
  distance: number;
  point: Vec2; // midpoint between thumb+index tip, normalized
}

export interface PointState {
  active: boolean;
  tip: Vec2;
  direction: Vec2; // normalized 2D direction of pointing finger
}

export interface HandGestureState {
  handedness: 'Left' | 'Right';
  pinch: PinchState;
  point: PointState;
  curl: number; // 0 = fully extended index, 1 = fully curled (for beckon)
  fingertipHistory: Vec2[]; // recent index-tip positions, for circular/flick detection
}

/** Fully resolved gesture state for the whole scene, after debounce. */
export interface GestureState {
  hands: HandGestureState[];
  singlePinch: boolean;
  twoHandPinch: boolean;
  doublePinch: boolean; // rapid pinch-release-pinch on a bloomed flower
  pointing: boolean;
  pointDirection: Vec2 | null;
  pointTip: Vec2 | null;
  circularMotion: 'cw' | 'ccw' | null;
  flick: Vec2 | null; // velocity vector when a flick is detected, else null
  beckon: boolean;
  holdNearFlower: boolean;
}

export interface SpeciesConfig {
  id: SpeciesId;
  name: string;
  color: string; // primary glow/bloom color (stem, veins, disc)
  secondaryColor: string;
  petalColor?: string; // defaults to `color`; overridden when petals differ from the glow hue (e.g. daisy's white rays)
  petalCount: number;
  petalShape: 'thread' | 'broadOval' | 'ray' | 'funnel' | 'round5' | 'ruffledCup' | 'spiral';
  clusterCount: number; // blooms per stem (1 for single-bloom species)
  growthDurationMs: number;
  bloomDurationMs: number;
  bloomEasing: 'overshoot' | 'linear' | 'snap' | 'sequential' | 'spiral';
  description: string;
  hasStamens?: boolean;
  hasCenterDisc?: boolean;
  maxOpenAngle?: number; // radians; caps how flat petals open (tulip stays cupped)
  ringCount?: number; // concentric petal rings (rose's spiral whorl)
  clusterLayout?: 'umbel' | 'raceme'; // umbel: blooms radiate from one point atop the stem;
  // raceme: blooms spaced up the stem at increasing height (freesia's one-sided spike)
}
