import { clamp, easeInOutSine, easeOutBack, easeOutQuad } from '../utils/math';
import type { SpeciesConfig } from '../types';

export interface PetalPose {
  openT: number; // how open this petal is right now (can exceed 1 briefly on overshoot)
  curl: number; // 0..1 extra backward curl, applied late in the bloom
}

/**
 * Per-petal opening curve, keyed by the species' designed bloom character (PRD §7 table).
 * `globalT` is 0..1 progress of the bloom-head this petal belongs to; `ring`/`ringCount` let
 * concentric layouts (rose) stagger outward ring-by-ring.
 */
export function petalPose(
  species: SpeciesConfig,
  globalT: number,
  petalIndex: number,
  petalCount: number,
  ring = 0,
  ringCount = 1,
): PetalPose {
  const t = clamp(globalT, 0, 1);

  switch (species.bloomEasing) {
    case 'overshoot': {
      const eased = easeOutBack(t);
      return { openT: clamp(eased, 0, 1.25), curl: clamp((t - 0.55) / 0.45, 0, 1) };
    }
    case 'snap': {
      const eased = easeOutQuad(clamp(t * 1.6, 0, 1));
      return { openT: eased, curl: 0 };
    }
    case 'linear': {
      return { openT: easeInOutSine(t), curl: 0 };
    }
    case 'sequential': {
      const stagger = petalIndex / Math.max(1, petalCount - 1);
      const windowStart = stagger * 0.55;
      const petalT = clamp((t - windowStart) / 0.45, 0, 1);
      return { openT: easeOutQuad(petalT), curl: clamp((petalT - 0.7) / 0.3, 0, 1) * 0.4 };
    }
    case 'spiral': {
      const ringStagger = ring / Math.max(1, ringCount - 1);
      const windowStart = ringStagger * 0.6;
      const petalT = clamp((t - windowStart) / 0.5, 0, 1);
      return { openT: easeInOutSine(petalT), curl: 0 };
    }
    default:
      return { openT: t, curl: 0 };
  }
}

/** Fractional (0..1 of total bloom duration) start-delay for each bloom-head in a cluster. */
export function clusterStagger(species: SpeciesConfig, clusterIndex: number, clusterCount: number): number {
  if (clusterCount <= 1) return 0;
  switch (species.id) {
    case 'freesia':
      // strong bottom-to-top traveling wave, one bloom clearly after another
      return (clusterIndex / (clusterCount - 1)) * 0.65;
    case 'spiderLily':
      // near-simultaneous, just enough offset to read as organic rather than robotic
      return (clusterIndex / (clusterCount - 1)) * 0.12;
    default:
      return 0;
  }
}
