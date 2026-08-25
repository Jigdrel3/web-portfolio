import * as THREE from 'three';
import type { SpeciesConfig } from '../types';

/**
 * Builds a flat 2D outline for one petal, lying along +Y (base at origin, tip away from
 * center). Each species maps to a distinct silhouette per the PRD's growth-pattern table.
 */
export function buildPetalShape(type: SpeciesConfig['petalShape']): THREE.Shape {
  const shape = new THREE.Shape();

  switch (type) {
    case 'thread': {
      // Spider lily: long, thread-thin, gently tapering to a fine point.
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.045, 0.25, 0.02, 0.75);
      shape.quadraticCurveTo(0.01, 0.95, 0, 1.15);
      shape.quadraticCurveTo(-0.01, 0.95, -0.02, 0.75);
      shape.quadraticCurveTo(-0.045, 0.25, 0, 0);
      break;
    }
    case 'broadOval': {
      // Lily: broad waxy tepal, pointed tip.
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.22, 0.15, 0.2, 0.55);
      shape.quadraticCurveTo(0.16, 0.85, 0, 1.0);
      shape.quadraticCurveTo(-0.16, 0.85, -0.2, 0.55);
      shape.quadraticCurveTo(-0.22, 0.15, 0, 0);
      break;
    }
    case 'ray': {
      // Daisy: thin, narrow, blunt-tipped ray petal.
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.05, 0.3, 0.045, 0.6);
      shape.quadraticCurveTo(0.04, 0.78, 0, 0.82);
      shape.quadraticCurveTo(-0.04, 0.78, -0.045, 0.6);
      shape.quadraticCurveTo(-0.05, 0.3, 0, 0);
      break;
    }
    case 'funnel': {
      // Freesia: elongated, gently flared trumpet tepal.
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.1, 0.2, 0.16, 0.45);
      shape.quadraticCurveTo(0.2, 0.65, 0.14, 0.72);
      shape.quadraticCurveTo(0.07, 0.76, 0, 0.78);
      shape.quadraticCurveTo(-0.07, 0.76, -0.14, 0.72);
      shape.quadraticCurveTo(-0.2, 0.65, -0.16, 0.45);
      shape.quadraticCurveTo(-0.1, 0.2, 0, 0);
      break;
    }
    case 'round5': {
      // Cherry blossom: small round petal with a soft notch at the tip.
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.14, 0.1, 0.15, 0.32);
      shape.quadraticCurveTo(0.15, 0.48, 0.06, 0.5);
      shape.quadraticCurveTo(0.03, 0.44, 0, 0.46);
      shape.quadraticCurveTo(-0.03, 0.44, -0.06, 0.5);
      shape.quadraticCurveTo(-0.15, 0.48, -0.15, 0.32);
      shape.quadraticCurveTo(-0.14, 0.1, 0, 0);
      break;
    }
    case 'ruffledCup': {
      // Tulip: broad cupped petal with a wavy/frilled edge (parrot-tulip style).
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.22, 0.12, 0.24, 0.4);
      shape.quadraticCurveTo(0.27, 0.55, 0.2, 0.62);
      shape.quadraticCurveTo(0.26, 0.72, 0.16, 0.82);
      shape.quadraticCurveTo(0.22, 0.92, 0.08, 1.0);
      shape.quadraticCurveTo(0.04, 1.05, 0, 1.02);
      shape.quadraticCurveTo(-0.04, 1.05, -0.08, 1.0);
      shape.quadraticCurveTo(-0.22, 0.92, -0.16, 0.82);
      shape.quadraticCurveTo(-0.26, 0.72, -0.2, 0.62);
      shape.quadraticCurveTo(-0.27, 0.55, -0.24, 0.4);
      shape.quadraticCurveTo(-0.22, 0.12, 0, 0);
      break;
    }
    case 'spiral': {
      // Rose: broad, rounded, gently cupped petal for layered spiral arrangement.
      shape.moveTo(0, 0);
      shape.quadraticCurveTo(0.26, 0.18, 0.24, 0.5);
      shape.quadraticCurveTo(0.22, 0.78, 0.1, 0.9);
      shape.quadraticCurveTo(0.04, 0.95, 0, 0.92);
      shape.quadraticCurveTo(-0.04, 0.95, -0.1, 0.9);
      shape.quadraticCurveTo(-0.22, 0.78, -0.24, 0.5);
      shape.quadraticCurveTo(-0.26, 0.18, 0, 0);
      break;
    }
  }

  return shape;
}

const shapeCache = new Map<string, THREE.BufferGeometry>();

export function getPetalGeometry(type: SpeciesConfig['petalShape']): THREE.BufferGeometry {
  const cached = shapeCache.get(type);
  if (cached) return cached;
  const shape = buildPetalShape(type);
  const geometry = new THREE.ShapeGeometry(shape, 12);
  cupPetal(geometry, type);
  geometry.computeVertexNormals();
  shapeCache.set(type, geometry);
  return geometry;
}

// Curve amount per shape (length-wise trough depth + a cross-width cup), so petals are never
// perfectly flat — a flat plane goes edge-on and vanishes at some rotation angles as the flower
// turns, and real petals are gently curved anyway.
const CUP_DEPTH: Record<SpeciesConfig['petalShape'], number> = {
  thread: 0.6,
  broadOval: 0.35,
  ray: 0.5,
  funnel: 0.55,
  round5: 0.4,
  ruffledCup: 0.7,
  spiral: 0.45,
};

function cupPetal(geometry: THREE.BufferGeometry, type: SpeciesConfig['petalShape']) {
  const depth = CUP_DEPTH[type];
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // cross-width cup (trough) plus a slight lengthwise curl toward the tip
    const cup = depth * x * x * 6;
    const curl = depth * 0.5 * y * y;
    pos.setZ(i, cup + curl);
  }
  pos.needsUpdate = true;
}
