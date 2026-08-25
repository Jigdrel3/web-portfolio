import type { GestureState, HandFrame, HandGestureState, Vec2 } from '../types';
import { indexCurl, isPointing, pinchDistance, pinchMidpoint, pointDirection } from './landmarks';
import { dist2 } from '../utils/math';

// Normalized-distance pinch thresholds (hysteresis avoids on/off flicker at the boundary).
const PINCH_ON = 0.55;
const PINCH_OFF = 0.75;

// Debounce: a raw detection must be sustained this long before the exposed state flips on;
// it flips off after a short release grace so momentary tracking dropout doesn't flicker it.
const HOLD_MS = 180;
const RELEASE_GRACE_MS = 120;

const DOUBLE_PINCH_WINDOW_MS = 500;
const DOUBLE_PINCH_MAX_HOLD_MS = 350;

const BECKON_LOW = 0.3;
const BECKON_HIGH = 0.62;
const BECKON_WINDOW_MS = 1700;
const BECKON_CYCLES_REQUIRED = 2;
const BECKON_HOLD_MS = 400;

const CIRCLE_WINDOW_MS = 750;
const CIRCLE_MIN_REVOLUTION = 4.4; // radians of accumulated signed angle (~250deg)
const CIRCLE_MIN_RADIUS = 0.02;

const FLICK_VELOCITY_THRESHOLD = 1.8; // normalized units/sec
const FLICK_COOLDOWN_MS = 700;
const FLICK_NEAR_RADIUS = 0.35;

const HOLD_NEAR_MS = 900;
const NEAR_RADIUS = 0.22;

interface HistoryPoint {
  t: number;
  p: Vec2;
}

interface PerHandState {
  pinchOnSince: number | null;
  pinchOffSince: number | null;
  pinchDebounced: boolean;
  lastPinchStart: number | null;
  lastPinchEnd: number | null;
  lastPinchDuration: number;

  pointOnSince: number | null;
  pointOffSince: number | null;
  pointDebounced: boolean;
  pointNearSince: number | null;

  fingertipHistory: HistoryPoint[];
  lastCurlPhase: 'low' | 'high' | 'mid';
  beckonCycleTimestamps: number[];
  lastFlickAt: number;
}

function freshHandState(): PerHandState {
  return {
    pinchOnSince: null,
    pinchOffSince: null,
    pinchDebounced: false,
    lastPinchStart: null,
    lastPinchEnd: null,
    lastPinchDuration: 0,
    pointOnSince: null,
    pointOffSince: null,
    pointDebounced: false,
    pointNearSince: null,
    fingertipHistory: [],
    lastCurlPhase: 'low',
    beckonCycleTimestamps: [],
    lastFlickAt: 0,
  };
}

/** Signed smallest-difference between two angles, in (-PI, PI]. */
function angleDelta(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class GestureClassifier {
  private hands = new Map<'Left' | 'Right', PerHandState>();

  private forHand(h: 'Left' | 'Right'): PerHandState {
    let s = this.hands.get(h);
    if (!s) {
      s = freshHandState();
      this.hands.set(h, s);
    }
    return s;
  }

  /**
   * @param nearPoint normalized (mirrored, 0..1) screen-space position of the active flower,
   *   used for proximity-gated gestures (hold-to-inspect, flick gust). Null if no flower.
   */
  update(frames: HandFrame[], now: number, nearPoint: Vec2 | null): GestureState {
    const seen = new Set<'Left' | 'Right'>();
    const handStates: HandGestureState[] = [];
    let doublePinch = false;
    let flick: Vec2 | null = null;
    let beckon = false;
    let circularMotion: 'cw' | 'ccw' | null = null;
    let holdNearFlower = false;

    for (const frame of frames) {
      const lm = frame.landmarks;
      if (!lm || lm.length < 21) continue;
      seen.add(frame.handedness);
      const s = this.forHand(frame.handedness);

      // --- pinch (hysteresis + debounce) ---
      const pDist = pinchDistance(lm);
      const rawPinch = pDist < (s.pinchDebounced ? PINCH_OFF : PINCH_ON);
      if (rawPinch) {
        if (s.pinchOnSince === null) s.pinchOnSince = now;
        s.pinchOffSince = null;
      } else {
        if (s.pinchOffSince === null) s.pinchOffSince = now;
        s.pinchOnSince = null;
      }
      const wasPinching = s.pinchDebounced;
      if (!s.pinchDebounced && s.pinchOnSince !== null && now - s.pinchOnSince >= HOLD_MS) {
        s.pinchDebounced = true;
      } else if (s.pinchDebounced && s.pinchOffSince !== null && now - s.pinchOffSince >= RELEASE_GRACE_MS) {
        s.pinchDebounced = false;
      }
      if (!wasPinching && s.pinchDebounced) {
        // pinch just started (debounced) — check for double-pinch pattern first
        if (s.lastPinchEnd !== null && now - s.lastPinchEnd < DOUBLE_PINCH_WINDOW_MS && s.lastPinchDuration < DOUBLE_PINCH_MAX_HOLD_MS) {
          doublePinch = true;
        }
        s.lastPinchStart = now;
      }
      if (wasPinching && !s.pinchDebounced) {
        s.lastPinchEnd = now;
        s.lastPinchDuration = s.lastPinchStart !== null ? now - s.lastPinchStart : 0;
      }

      // --- point (debounced) ---
      const rawPoint = isPointing(lm);
      if (rawPoint) {
        if (s.pointOnSince === null) s.pointOnSince = now;
        s.pointOffSince = null;
      } else {
        if (s.pointOffSince === null) s.pointOffSince = now;
        s.pointOnSince = null;
      }
      if (!s.pointDebounced && s.pointOnSince !== null && now - s.pointOnSince >= HOLD_MS) {
        s.pointDebounced = true;
      } else if (s.pointDebounced && s.pointOffSince !== null && now - s.pointOffSince >= RELEASE_GRACE_MS) {
        s.pointDebounced = false;
      }

      const tip: Vec2 = { x: lm[8].x, y: lm[8].y };
      const dir = pointDirection(lm);

      // --- fingertip history (for circular + flick) ---
      s.fingertipHistory.push({ t: now, p: tip });
      while (s.fingertipHistory.length > 0 && now - s.fingertipHistory[0].t > CIRCLE_WINDOW_MS) {
        s.fingertipHistory.shift();
      }

      // --- flick: velocity between the last two samples ---
      if (s.fingertipHistory.length >= 2) {
        const a = s.fingertipHistory[s.fingertipHistory.length - 2];
        const b = s.fingertipHistory[s.fingertipHistory.length - 1];
        const dt = (b.t - a.t) / 1000;
        if (dt > 0.001) {
          const vx = (b.p.x - a.p.x) / dt;
          const vy = (b.p.y - a.p.y) / dt;
          const speed = Math.hypot(vx, vy);
          const near = !nearPoint || dist2(tip, nearPoint) < FLICK_NEAR_RADIUS;
          if (speed > FLICK_VELOCITY_THRESHOLD && near && now - s.lastFlickAt > FLICK_COOLDOWN_MS) {
            flick = { x: vx, y: vy };
            s.lastFlickAt = now;
          }
        }
      }

      // --- circular motion detection (only while pointing) ---
      if (s.pointDebounced && s.fingertipHistory.length >= 6) {
        const pts = s.fingertipHistory.map((h) => h.p);
        const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
        const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
        const radius = pts.reduce((sum, p) => sum + Math.hypot(p.x - cx, p.y - cy), 0) / pts.length;
        if (radius > CIRCLE_MIN_RADIUS) {
          let accum = 0;
          let prevAngle = Math.atan2(pts[0].y - cy, pts[0].x - cx);
          for (let i = 1; i < pts.length; i++) {
            const angle = Math.atan2(pts[i].y - cy, pts[i].x - cx);
            accum += angleDelta(prevAngle, angle);
            prevAngle = angle;
          }
          if (Math.abs(accum) > CIRCLE_MIN_REVOLUTION) {
            circularMotion = accum > 0 ? 'cw' : 'ccw';
          }
        }
      }

      // --- hold-near-flower (sustained point near the flower) ---
      const near = nearPoint && dist2(tip, nearPoint) < NEAR_RADIUS;
      if (s.pointDebounced && near) {
        if (s.pointNearSince === null) s.pointNearSince = now;
        if (now - s.pointNearSince >= HOLD_NEAR_MS) holdNearFlower = true;
      } else {
        s.pointNearSince = null;
      }

      // --- beckon: index finger curling toward palm, repeated ---
      const curl = indexCurl(lm);
      const phase: 'low' | 'high' | 'mid' = curl < BECKON_LOW ? 'low' : curl > BECKON_HIGH ? 'high' : 'mid';
      if (s.lastCurlPhase === 'high' && phase === 'low') {
        s.beckonCycleTimestamps.push(now);
      }
      if (phase !== 'mid') s.lastCurlPhase = phase;
      s.beckonCycleTimestamps = s.beckonCycleTimestamps.filter((t) => now - t < BECKON_WINDOW_MS);
      if (s.beckonCycleTimestamps.length >= BECKON_CYCLES_REQUIRED) {
        beckon = true;
        if (now - s.beckonCycleTimestamps[s.beckonCycleTimestamps.length - 1] < BECKON_HOLD_MS) {
          // keep flagging true briefly after the last cycle so the lean animation can settle
        }
      }

      handStates.push({
        handedness: frame.handedness,
        pinch: { active: s.pinchDebounced, distance: pDist, point: pinchMidpoint(lm) },
        point: { active: s.pointDebounced, tip, direction: dir },
        curl,
        fingertipHistory: s.fingertipHistory.map((h) => h.p),
      });
    }

    // drop stale per-hand state for hands no longer detected this frame
    for (const key of Array.from(this.hands.keys())) {
      if (!seen.has(key)) this.hands.delete(key);
    }

    const pinchingHands = handStates.filter((h) => h.pinch.active);
    const pointingHands = handStates.filter((h) => h.point.active);
    const primaryPoint = pointingHands[0] ?? null;

    return {
      hands: handStates,
      singlePinch: pinchingHands.length === 1,
      twoHandPinch: pinchingHands.length === 2,
      doublePinch,
      pointing: pointingHands.length > 0,
      pointDirection: primaryPoint ? primaryPoint.point.direction : null,
      pointTip: primaryPoint ? primaryPoint.point.tip : null,
      circularMotion,
      flick,
      beckon,
      holdNearFlower,
    };
  }
}
