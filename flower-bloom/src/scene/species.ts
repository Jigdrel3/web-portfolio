import type { SpeciesConfig, SpeciesId } from '../types';

/**
 * Botanically-grounded reference data (no personal reference photos were available for this
 * build — colors/structure/petal counts are drawn from real-world species knowledge per the
 * PRD's growth-pattern table, §7).
 */
export const SPECIES: Record<SpeciesId, SpeciesConfig> = {
  spiderLily: {
    id: 'spiderLily',
    name: 'Red Spider Lily',
    color: '#ff3b1f',
    secondaryColor: '#ff9a3c',
    petalCount: 6,
    petalShape: 'thread',
    clusterCount: 5,
    growthDurationMs: 1800,
    bloomDurationMs: 1500,
    bloomEasing: 'overshoot',
    description: 'Radial burst-and-curl — long thread-thin recurving petals, umbel cluster.',
    hasStamens: true,
  },
  lily: {
    id: 'lily',
    name: 'Lily',
    color: '#ff8f6b',
    secondaryColor: '#fff1e6',
    petalCount: 6,
    petalShape: 'broadOval',
    clusterCount: 1,
    growthDurationMs: 1800,
    bloomDurationMs: 1700,
    bloomEasing: 'sequential',
    description: 'Tip-first unzip — broad waxy tepals peel open from the pointed tip downward.',
    hasStamens: true,
  },
  daisy: {
    id: 'daisy',
    name: 'Daisy',
    color: '#ffe45c',
    secondaryColor: '#ffffff',
    petalColor: '#fffaf0',
    petalCount: 26,
    petalShape: 'ray',
    clusterCount: 1,
    growthDurationMs: 1500,
    bloomDurationMs: 900,
    bloomEasing: 'snap',
    description: 'Radial sunburst snap — thin white ray petals, yellow disc swells after.',
    hasCenterDisc: true,
  },
  freesia: {
    id: 'freesia',
    name: 'Freesia',
    color: '#ffcc33',
    secondaryColor: '#fff6d6',
    petalCount: 6,
    petalShape: 'funnel',
    clusterCount: 5,
    growthDurationMs: 1800,
    bloomDurationMs: 2200,
    bloomEasing: 'sequential',
    description: 'Sequential wave — trumpet blooms open one at a time, bottom to top.',
    clusterLayout: 'raceme',
  },
  cherryBlossom: {
    id: 'cherryBlossom',
    name: 'Cherry Blossom',
    color: '#ffb7c5',
    secondaryColor: '#fff0f3',
    petalCount: 5,
    petalShape: 'round5',
    clusterCount: 4,
    growthDurationMs: 1600,
    bloomDurationMs: 1400,
    bloomEasing: 'overshoot',
    description: 'Clustered soft unfurl — synchronized paper-fold-reverse petals, gentle drift after.',
  },
  tulip: {
    id: 'tulip',
    name: 'Tulip',
    color: '#e6339e',
    secondaryColor: '#ffb3de',
    petalCount: 6,
    petalShape: 'ruffledCup',
    clusterCount: 1,
    growthDurationMs: 2000,
    bloomDurationMs: 1800,
    bloomEasing: 'linear',
    description: 'Goblet breathing — ruffled cup petals that never fully flatten, gentle idle pulse.',
    maxOpenAngle: Math.PI * 0.38,
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    color: '#8a2e6b',
    secondaryColor: '#d98ec2',
    petalCount: 28,
    petalShape: 'spiral',
    clusterCount: 1,
    growthDurationMs: 1900,
    bloomDurationMs: 2600,
    bloomEasing: 'spiral',
    description: 'Spiral whorl unfurl — inner spiral opens first, outer rings follow in sequence.',
    ringCount: 4,
  },
};

export const SPECIES_LIST: SpeciesConfig[] = Object.values(SPECIES);

/** World-space stem height (bloom-head Y offset) per species. */
export const STEM_HEIGHT: Record<SpeciesId, number> = {
  spiderLily: 1.55,
  lily: 1.5,
  daisy: 1.1,
  freesia: 1.35,
  cherryBlossom: 1.3,
  tulip: 1.0,
  rose: 1.25,
};

export function flowerHeadWorldPos(species: SpeciesId, groundX: number): [number, number, number] {
  return [groundX, STEM_HEIGHT[species], 0];
}
