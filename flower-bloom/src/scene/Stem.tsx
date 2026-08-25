import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import './GrowthLineMaterial';

interface StemProps {
  height: number;
  growth: number; // 0..1
  bloomT: number; // 0..1
  color: string;
}

export function Stem({ height, growth, bloomT, color }: StemProps) {
  const matRef = useRef<any>(null);

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.02, height * 0.35, 0.01),
      new THREE.Vector3(-0.015, height * 0.68, -0.01),
      new THREE.Vector3(0, height, 0),
    ]);
    return new THREE.TubeGeometry(curve, 32, 0.018, 6, false);
  }, [height]);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uGrowth = growth;
      matRef.current.uBloomT = bloomT;
      matRef.current.uTime = state.clock.elapsedTime;
      matRef.current.uTrueColor = new THREE.Color(color);
    }
  });

  return (
    <mesh geometry={geometry}>
      <growthLineMaterial ref={matRef} uGrowth={growth} uBloomT={bloomT} transparent={false} />
    </mesh>
  );
}
