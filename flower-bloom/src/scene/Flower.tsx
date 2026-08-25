import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Stem } from './Stem';
import { BloomHead } from './BloomHead';
import { SPECIES, STEM_HEIGHT } from './species';
import { clamp, damp, easeOutQuad, remap } from '../utils/math';
import { clusterStagger } from './bloomMotion';
import { useBloomStore } from '../state/store';
import type { FlowerInstance } from '../state/store';

interface FlowerProps {
  instance: FlowerInstance;
  reducedMotion: boolean;
}

export function Flower({ instance, reducedMotion }: FlowerProps) {
  const species = SPECIES[instance.species];
  const height = STEM_HEIGHT[instance.species] ?? 1.3;
  const groupRef = useRef<THREE.Group>(null);
  const swayPhase = useRef(Math.random() * Math.PI * 2);

  const clusterOffsets = useMemo(() => {
    const n = species.clusterCount;

    if (species.clusterLayout === 'raceme' && n > 1) {
      // one-sided arching spike: blooms spaced up the stem, each facing outward along the arch
      return Array.from({ length: n }, (_, i) => {
        const f = i / (n - 1);
        return {
          position: [Math.sin(f * 0.7) * 0.22, -height * 0.32 * (1 - f), Math.cos(f * 0.7) * 0.05] as [
            number,
            number,
            number,
          ],
          rotation: [0.9 - f * 0.35, f * 0.5, 0] as [number, number, number],
        };
      });
    }

    return Array.from({ length: n }, (_, i) => {
      const azimuth = (i / n) * Math.PI * 2;
      const tilt = n > 1 ? 0.55 + (i % 2) * 0.1 : 0;
      const r = n > 1 ? 0.22 : 0;
      return {
        position: [Math.sin(azimuth) * r, 0.05 * i, Math.cos(azimuth) * r] as [number, number, number],
        rotation: [tilt, azimuth, 0] as [number, number, number],
      };
    });
  }, [species.clusterCount, species.clusterLayout, height]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    const idle =
      reducedMotion || instance.stage === 'sprouting' || instance.stage === 'seed'
        ? 0
        : Math.sin(state.clock.elapsedTime * 0.6 + swayPhase.current) * 0.035;
    const gustAt = useBloomStore.getState().gustAt;
    const gustAge = (performance.now() - gustAt) / 1000;
    const gust = reducedMotion || gustAge > 1.4 ? 0 : Math.sin(gustAge * 22) * Math.exp(-gustAge * 3) * 0.22;
    const targetZ = idle + instance.leanX + gust;
    groupRef.current.rotation.z = damp(groupRef.current.rotation.z, targetZ, 6, dt);
    groupRef.current.rotation.y = damp(groupRef.current.rotation.y, instance.rotationY, 8, dt);
  });

  const now = performance.now();
  const elapsed = now - instance.stageStartedAt;

  let growth = 1;
  let bloomT = 0;
  let showBud = false;

  if (instance.stage === 'sprouting') {
    const t = clamp(elapsed / species.growthDurationMs, 0, 1);
    growth = reducedMotion ? t : easeOutQuad(t);
    bloomT = 0;
    showBud = growth > 0.6;
  } else if (instance.stage === 'budded') {
    growth = 1;
    bloomT = 0;
    showBud = true;
  } else if (instance.stage === 'blooming') {
    growth = 1;
    bloomT = clamp(elapsed / species.bloomDurationMs, 0, 1);
    showBud = bloomT < 0.2;
  } else if (instance.stage === 'bloomed' || instance.stage === 'picked') {
    growth = 1;
    bloomT = 1;
    showBud = false;
  }

  const idlePulse =
    !reducedMotion && instance.stage === 'bloomed' && species.bloomEasing === 'linear'
      ? 1 + Math.sin(performance.now() * 0.0015) * 0.04 // tulip's gentle goblet "breathing"
      : 1;

  const budOpacity = showBud ? clamp(remap(bloomT, 0, 0.25, 1, 0), 0, 1) : 0;

  return (
    <group ref={groupRef} position={[instance.groundX, 0, 0]}>
      <Stem height={height} growth={growth} bloomT={bloomT} color={species.color} />

      {budOpacity > 0.01 && (
        <mesh position={[0, height, 0]} scale={[0.09, 0.16, 0.09]}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial
            color={species.secondaryColor}
            emissive={species.color}
            emissiveIntensity={0.25}
            transparent
            opacity={budOpacity}
          />
        </mesh>
      )}

      {bloomT > 0.001 &&
        clusterOffsets.map((c, i) => {
          const stagger = clusterStagger(species, i, species.clusterCount);
          const headT = clamp(remap(bloomT, stagger, 1, 0, 1), 0, 1);
          return (
            <group
              key={i}
              position={[c.position[0], height + c.position[1], c.position[2]]}
              rotation={c.rotation}
              scale={idlePulse}
            >
              <BloomHead
                species={species}
                globalT={headT}
                glowIntensity={bloomT}
                reducedMotion={reducedMotion}
                ringCount={species.ringCount ?? 1}
              />
            </group>
          );
        })}
    </group>
  );
}
