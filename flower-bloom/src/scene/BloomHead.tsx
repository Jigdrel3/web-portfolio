import { useMemo } from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import type { SpeciesConfig } from '../types';
import { getPetalGeometry } from './petalShapes';
import { petalPose } from './bloomMotion';
import { clamp, remap } from '../utils/math';

// Extra backward-recurve angle (radians) layered on top of the base opening angle, at full
// curl. Kept well clear of PI so a fully-curled petal reads as "swept back past horizontal",
// never as flipping past straight-down and folding back toward the flower's own center.
const CURL_AMOUNT: Record<SpeciesConfig['petalShape'], number> = {
  thread: Math.PI * 0.3,
  broadOval: Math.PI * 0.12,
  ray: 0,
  funnel: Math.PI * 0.05,
  round5: Math.PI * 0.06,
  ruffledCup: 0,
  spiral: Math.PI * 0.03,
};

const MAX_PETAL_ANGLE = Math.PI * 0.85; // safety cap so petals never wrap past pointing straight down

interface BloomHeadProps {
  species: SpeciesConfig;
  globalT: number; // this head's own bloom progress, 0..1 (already includes cluster stagger)
  glowIntensity: number;
  reducedMotion?: boolean;
  ringCount?: number; // rose: concentric petal rings
}

function seededJitter(seed: number, amount: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * amount;
}

export function BloomHead({ species, globalT, glowIntensity, reducedMotion = false, ringCount = 1 }: BloomHeadProps) {
  const petalGeometry = useMemo(() => getPetalGeometry(species.petalShape), [species.petalShape]);
  const maxAngle = species.maxOpenAngle ?? Math.PI * 0.5;
  const curlAmount = CURL_AMOUNT[species.petalShape];
  const petalScale = species.petalShape === 'thread' ? 0.9 : species.petalShape === 'spiral' ? 0.55 : 0.7;

  const petals = useMemo(() => {
    const items: { azimuth: number; ring: number; index: number }[] = [];
    const perRing = Math.ceil(species.petalCount / ringCount);
    let i = 0;
    for (let r = 0; r < ringCount; r++) {
      const countThisRing = r === ringCount - 1 ? species.petalCount - perRing * (ringCount - 1) : perRing;
      for (let k = 0; k < countThisRing; k++) {
        const azimuth = (k / countThisRing) * Math.PI * 2 + r * 0.35 + seededJitter(i, 0.12);
        items.push({ azimuth, ring: r, index: i });
        i++;
      }
    }
    return items;
  }, [species.petalCount, ringCount]);

  const stamens = useMemo(() => {
    if (!species.hasStamens) return [];
    const count = Math.max(4, Math.round(species.petalCount * 0.8));
    return Array.from({ length: count }, (_, i) => (i / count) * Math.PI * 2 + seededJitter(i + 100, 0.15));
  }, [species.hasStamens, species.petalCount]);

  const stamenT = clamp(remap(globalT, 0.45, 1, 0, 1), 0, 1);
  const stamenLength = (species.petalShape === 'thread' ? 1.35 : 0.85) * stamenT;

  return (
    <group>
      {petals.map(({ azimuth, ring, index }) => {
        // reduced motion: a simple linear crossfade instead of each species' eased/overshoot curve
        const pose = reducedMotion
          ? { openT: clamp(globalT, 0, 1), curl: clamp(globalT, 0, 1) }
          : petalPose(species, globalT, index, petals.length, ring, ringCount);
        const theta = Math.min(Math.min(pose.openT, 1) * maxAngle + pose.curl * curlAmount, MAX_PETAL_ANGLE);
        const radius = 0.055 + ring * 0.045 + seededJitter(index, 0.012);
        const scale = petalScale * (0.92 + seededJitter(index + 50, 0.08)) * clamp(pose.openT * 1.3, 0.08, 1.15);
        return (
          <group key={index} rotation={[0, azimuth, 0]}>
            <group position={[0, 0.02, radius]} rotation={[theta, 0, 0]}>
              <mesh geometry={petalGeometry} scale={[scale, scale, 1]} castShadow>
                <meshStandardMaterial
                  color={species.petalColor ?? species.color}
                  emissive={species.color}
                  emissiveIntensity={0.25 + glowIntensity * 0.3}
                  roughness={0.45}
                  metalness={0.05}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {pose.openT > 0.15 && (
                <Line
                  points={[
                    [0, 0.02, 0],
                    [0, scale * 0.95, 0],
                  ]}
                  color={species.secondaryColor}
                  lineWidth={1}
                  transparent
                  opacity={0.55 * clamp(pose.openT, 0, 1)}
                  toneMapped={false}
                />
              )}
            </group>
          </group>
        );
      })}

      {species.hasStamens &&
        stamens.map((azimuth, i) => (
          <group key={i} rotation={[0, azimuth, 0]}>
            <group rotation={[Math.PI * 0.38, 0, 0]}>
              <Line
                points={[
                  [0, 0.05, 0],
                  [0, 0.05 + stamenLength, 0],
                ]}
                color={species.secondaryColor}
                lineWidth={1.5}
                toneMapped={false}
              />
              <mesh position={[0, 0.05 + stamenLength, 0]} scale={stamenT}>
                <sphereGeometry args={[0.035, 8, 8]} />
                <meshStandardMaterial
                  color={species.secondaryColor}
                  emissive={species.secondaryColor}
                  emissiveIntensity={0.8}
                />
              </mesh>
            </group>
          </group>
        ))}

      {species.hasCenterDisc && (
        <mesh position={[0, 0.03, 0]} scale={[0.22, 0.12, 0.22]} visible={globalT > 0.3}>
          <sphereGeometry args={[clamp(remap(globalT, 0.3, 1, 0.3, 1), 0, 1), 16, 12]} />
          <meshStandardMaterial
            color="#ffb703"
            emissive="#ffb703"
            emissiveIntensity={0.5 + glowIntensity * 0.3}
            roughness={0.6}
          />
        </mesh>
      )}
    </group>
  );
}
