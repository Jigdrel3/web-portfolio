import type { Vec3 } from '../types';

/** MediaPipe Hands 21-landmark indices used across gesture math. */
export const LM = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_TIP: 20,
} as const;

const d3 = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** Distance from wrist to middle-MCP — a stable proxy for "hand size in frame", used to
 * normalize distance thresholds regardless of how close the hand is to the camera. */
export function handScale(lm: Vec3[]): number {
  return Math.max(d3(lm[LM.WRIST], lm[LM.MIDDLE_MCP]), 1e-4);
}

export function pinchDistance(lm: Vec3[]): number {
  return d3(lm[LM.THUMB_TIP], lm[LM.INDEX_TIP]) / handScale(lm);
}

/** 0 = straight, 1 = fully curled. Ratio of (tip-to-mcp straight-line) to (sum of the two
 * segment lengths) — a fully extended finger has ratio ~1 (curl 0); a curled finger folds the
 * tip back toward the mcp, shrinking that ratio toward 0 (curl 1). */
function fingerCurl(lm: Vec3[], mcp: number, pip: number, tip: number): number {
  const straight = d3(lm[mcp], lm[tip]);
  const segments = d3(lm[mcp], lm[pip]) + d3(lm[pip], lm[tip]);
  const ratio = segments < 1e-6 ? 1 : straight / segments;
  return 1 - Math.min(1, Math.max(0, ratio));
}

export function indexCurl(lm: Vec3[]): number {
  return fingerCurl(lm, LM.INDEX_MCP, LM.INDEX_PIP, LM.INDEX_TIP);
}

export function middleCurl(lm: Vec3[]): number {
  return fingerCurl(lm, LM.MIDDLE_MCP, LM.MIDDLE_PIP, LM.MIDDLE_TIP);
}

export function ringCurl(lm: Vec3[]): number {
  return fingerCurl(lm, LM.RING_MCP, LM.RING_PIP, LM.RING_TIP);
}

export function pinkyCurl(lm: Vec3[]): number {
  return fingerCurl(lm, LM.PINKY_MCP, LM.PINKY_PIP, LM.PINKY_TIP);
}

export function isPointing(lm: Vec3[]): boolean {
  return indexCurl(lm) < 0.32 && middleCurl(lm) > 0.55 && ringCurl(lm) > 0.55 && pinkyCurl(lm) > 0.55;
}

export function pointDirection(lm: Vec3[]): { x: number; y: number } {
  const from = lm[LM.INDEX_MCP];
  const to = lm[LM.INDEX_TIP];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1e-4;
  return { x: dx / len, y: dy / len };
}

export function pinchMidpoint(lm: Vec3[]): { x: number; y: number } {
  const a = lm[LM.THUMB_TIP];
  const b = lm[LM.INDEX_TIP];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
