import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

/**
 * Shared material for the stem tube and the faint in-petal "veins" (PRD §8): a glowing line
 * that reveals progressively along its length (uGrowth) and shifts from the schematic growth
 * green to the flower's true color as it blooms (uBloomT).
 */
export const GrowthLineMaterial = shaderMaterial(
  {
    uGrowth: 1,
    uBloomT: 0,
    uGrowColor: new THREE.Color('#59ff8f'),
    uTrueColor: new THREE.Color('#ff3b1f'),
    uIntensity: 2.2,
    uTime: 0,
  },
  /* vertex */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    uniform float uGrowth;
    uniform float uBloomT;
    uniform vec3 uGrowColor;
    uniform vec3 uTrueColor;
    uniform float uIntensity;
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      if (vUv.x > uGrowth) discard;
      vec3 color = mix(uGrowColor, uTrueColor, uBloomT);
      float pulse = 0.9 + 0.1 * sin(uTime * 3.0 + vUv.x * 8.0);
      // brighten the growing tip so it reads as an active, glowing edge
      float tipGlow = smoothstep(uGrowth - 0.08, uGrowth, vUv.x) * 0.6;
      gl_FragColor = vec4(color * uIntensity * pulse + color * tipGlow, 1.0);
    }
  `,
);

extend({ GrowthLineMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    growthLineMaterial: Record<string, unknown>;
  }
}
