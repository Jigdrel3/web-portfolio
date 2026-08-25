import { remap } from './math';
import type { Vec2 } from '../types';

/**
 * Maps a raw (unmirrored) MediaPipe landmark X coordinate to world-space X on the ground
 * plane. The video is displayed mirrored (selfie view), so we flip X before remapping, keeping
 * "the flower grows where you pinched" visually true to what the user sees on screen.
 */
export function rawPointToGroundX(raw: Vec2): number {
  const mirroredX = 1 - raw.x;
  return remap(mirroredX, 0, 1, -1.6, 1.6);
}

export function groundXToNormalizedScreenX(groundX: number): number {
  return remap(groundX, -1.6, 1.6, 0, 1);
}
