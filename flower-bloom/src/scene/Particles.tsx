import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useBloomStore } from '../state/store';
import { getGesture } from '../tracking/gestureBus';
import type { Vec2 } from '../types';

const POOL_SIZE = 320;

interface Particle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  r: number;
  g: number;
  b: number;
  size: number;
}

function makePool(): Particle[] {
  return Array.from({ length: POOL_SIZE }, () => ({
    active: false,
    x: 0,
    y: -100,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
    maxLife: 1,
    r: 1,
    g: 1,
    b: 1,
    size: 0.03,
  }));
}

/**
 * A single shared particle pool driving pick-pop bursts, wind gusts, and the pollen swirl
 * conjured by tracing a small circle while pointing (PRD §6). Anchored to `getFlowerWorldPos`
 * so effects originate from wherever the active flower currently sits.
 */
export function Particles({ getFlowerWorldPos }: { getFlowerWorldPos: () => [number, number, number] | null }) {
  const pool = useRef<Particle[]>(makePool());
  const pointsRef = useRef<THREE.Points>(null);
  const swirlAngle = useRef(0);
  const swirlDecay = useRef(0);
  const fx = useBloomStore((s) => s.fx);
  const popFx = useBloomStore((s) => s.popFx);
  const reducedMotion = useBloomStore((s) => s.reducedMotion);

  const { geometry, positions, colors, sizes } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(POOL_SIZE * 3);
    const colors = new Float32Array(POOL_SIZE * 3);
    const sizes = new Float32Array(POOL_SIZE);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return { geometry: geo, positions, colors, sizes };
  }, []);

  function spawn(origin: [number, number, number], color: THREE.Color, count: number, opts: Partial<Particle> & { spread?: number; speed?: number; life?: number } = {}) {
    const spread = opts.spread ?? 0.5;
    const speed = opts.speed ?? 0.8;
    const life = opts.life ?? 1.1;
    let spawned = 0;
    for (const p of pool.current) {
      if (spawned >= count) break;
      if (p.active) continue;
      p.active = true;
      p.x = origin[0];
      p.y = origin[1];
      p.z = origin[2];
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      p.vx = Math.sin(phi) * Math.cos(theta) * speed * (0.4 + Math.random() * spread);
      p.vy = Math.cos(phi) * speed * (0.5 + Math.random() * spread) + 0.3;
      p.vz = Math.sin(phi) * Math.sin(theta) * speed * (0.4 + Math.random() * spread);
      p.life = life * (0.7 + Math.random() * 0.6);
      p.maxLife = p.life;
      p.r = color.r;
      p.g = color.g;
      p.b = color.b;
      p.size = 0.05 + Math.random() * 0.04;
      spawned++;
    }
  }

  useEffect(() => {
    if (fx.length === 0 || reducedMotion) return;
    const origin = getFlowerWorldPos() ?? [0, 1, 0];
    for (const e of fx) {
      if (e.type === 'pop') {
        spawn(origin, new THREE.Color(e.color), 40, { spread: 0.9, speed: 1.6, life: 0.9 });
      } else if (e.type === 'gust') {
        spawn(origin, new THREE.Color('#eafff0'), 18, { spread: 0.6, speed: 1.0, life: 0.7 });
      }
      popFx(e.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fx]);

  useFrame((state, dt) => {
    const clampedDt = Math.min(dt, 0.05);
    const gesture = getGesture();
    const origin = getFlowerWorldPos();

    // continuous pollen swirl while a circular point gesture is detected, with a short
    // drifting decay afterward so it reads as disturbing something alive rather than a toggle
    if (origin && !reducedMotion) {
      if (gesture.circularMotion) {
        swirlDecay.current = 1;
        const dir = gesture.circularMotion === 'cw' ? 1 : -1;
        swirlAngle.current += dir * clampedDt * 2.4;
        if (Math.random() < clampedDt * 14) {
          const radius = 0.4 + Math.random() * 0.25;
          const angle = swirlAngle.current + Math.random() * 0.6;
          const px = origin[0] + Math.cos(angle) * radius;
          const pz = origin[2] + Math.sin(angle) * radius;
          const py = origin[1] + (Math.random() - 0.3) * 0.3;
          spawn([px, py, pz], new THREE.Color('#ffe08a'), 1, { spread: 0.15, speed: 0.15, life: 1.6 });
        }
      } else {
        swirlDecay.current = Math.max(0, swirlDecay.current - clampedDt * 0.6);
      }

      // cherry blossom: a few petals periodically detach and drift down in a slow spiral (PRD §7)
      const flower = useBloomStore.getState().flower;
      if (flower && flower.stage === 'bloomed' && flower.species === 'cherryBlossom' && Math.random() < clampedDt * 0.6) {
        const px = origin[0] + (Math.random() - 0.5) * 0.4;
        const pz = origin[2] + (Math.random() - 0.5) * 0.4;
        spawn([px, origin[1], pz], new THREE.Color('#ffb7c5'), 1, { spread: 0.05, speed: 0.05, life: 3.2 });
      }
    }

    for (const p of pool.current) {
      if (!p.active) continue;
      p.life -= clampedDt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy -= clampedDt * 0.6; // gravity
      p.vx *= 0.98;
      p.vz *= 0.98;
      p.x += p.vx * clampedDt;
      p.y += p.vy * clampedDt;
      p.z += p.vz * clampedDt;
    }

    for (let i = 0; i < POOL_SIZE; i++) {
      const p = pool.current[i];
      if (p.active) {
        const fade = Math.min(1, p.life / (p.maxLife * 0.4));
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        colors[i * 3] = p.r;
        colors[i * 3 + 1] = p.g;
        colors[i * 3 + 2] = p.b;
        sizes[i] = p.size * fade;
      } else {
        positions[i * 3 + 1] = -1000;
        sizes[i] = 0;
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
    void state;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        vertexColors
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

export type { Vec2 };
