import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useBloomStore } from '../state/store';
import { flowerHeadWorldPos } from './species';
import { damp } from '../utils/math';

const OVERVIEW_POS = new THREE.Vector3(0, 1.3, 4.4);
const OVERVIEW_LOOK = new THREE.Vector3(0, 1, 0);

/** Soft dolly-zoom into the bloom for the "point and hold" inspect gesture (PRD §6). */
export function CameraRig() {
  const { camera } = useThree();
  const currentLook = useRef(OVERVIEW_LOOK.clone());
  const reducedMotion = useBloomStore((s) => s.reducedMotion);

  useFrame((_state, dt) => {
    const { flower, inspectAmount } = useBloomStore.getState();
    const lambda = reducedMotion ? 12 : 3.2;

    let targetPos = OVERVIEW_POS;
    let targetLook = OVERVIEW_LOOK;

    if (flower && inspectAmount > 0.001) {
      const head = flowerHeadWorldPos(flower.species, flower.groundX);
      const closePos = new THREE.Vector3(head[0] * 0.4, head[1] + 0.05, 1.15);
      const closeLook = new THREE.Vector3(head[0], head[1], head[2]);
      targetPos = OVERVIEW_POS.clone().lerp(closePos, inspectAmount);
      targetLook = OVERVIEW_LOOK.clone().lerp(closeLook, inspectAmount);
    }

    camera.position.set(
      damp(camera.position.x, targetPos.x, lambda, dt),
      damp(camera.position.y, targetPos.y, lambda, dt),
      damp(camera.position.z, targetPos.z, lambda, dt),
    );
    currentLook.current.set(
      damp(currentLook.current.x, targetLook.x, lambda, dt),
      damp(currentLook.current.y, targetLook.y, lambda, dt),
      damp(currentLook.current.z, targetLook.z, lambda, dt),
    );
    camera.lookAt(currentLook.current);
  });

  return null;
}
