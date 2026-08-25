import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useBloomStore } from '../state/store';
import { getGesture } from '../tracking/gestureBus';
import { SPECIES, flowerHeadWorldPos } from './species';
import { damp } from '../utils/math';
import { rawPointToGroundX, groundXToNormalizedScreenX } from '../utils/spatial';
import type { GestureState } from '../types';

const ROTATE_RANGE = Math.PI * 1.1;
const LEAN_ANGLE = 0.22;

/**
 * Central game-logic tick: reads the latest classified gesture every render frame and drives
 * all flower lifecycle transitions (sprout → bud → bloom → pick) plus the charm-gesture layer.
 * Renders nothing itself.
 */
export function GameLoop() {
  const lastGestureRef = useRef<GestureState | null>(null);
  const wasTwoHandPinchingRef = useRef(false);
  const { camera } = useThree();

  useFrame((_state, dt) => {
    const gesture = getGesture();
    const isNewDetection = gesture !== lastGestureRef.current;
    lastGestureRef.current = gesture;
    const twoHandRisingEdge = gesture.twoHandPinch && !wasTwoHandPinchingRef.current;
    wasTwoHandPinchingRef.current = gesture.twoHandPinch;

    const store = useBloomStore.getState();
    const { flower, selectedSpecies } = store;

    if (!flower) {
      if (gesture.singlePinch) {
        const hand = gesture.hands.find((h) => h.pinch.active);
        if (hand) {
          const groundX = rawPointToGroundX(hand.pinch.point);
          store.spawnFlower(selectedSpecies, groundX, hand.pinch.point);
        }
      }
      if (store.inspectAmount > 0.001) store.setInspectAmount(damp(store.inspectAmount, 0, 3, dt));
      return;
    }

    const species = SPECIES[flower.species];

    if (flower.stage !== 'bloomed' && store.inspectAmount > 0.001) {
      store.setInspectAmount(damp(store.inspectAmount, 0, 3, dt));
    }

    switch (flower.stage) {
      case 'sprouting': {
        const elapsed = performance.now() - flower.stageStartedAt;
        if (elapsed >= species.growthDurationMs) store.setStage('budded');
        break;
      }
      case 'budded': {
        if (twoHandRisingEdge) store.setStage('blooming');
        break;
      }
      case 'blooming': {
        const elapsed = performance.now() - flower.stageStartedAt;
        if (elapsed >= species.bloomDurationMs) store.setStage('bloomed');
        break;
      }
      case 'bloomed': {
        // rotation: point direction maps to a target angle; Flower.tsx damps toward it visually
        if (gesture.pointing && gesture.pointDirection) {
          store.setRotationY(gesture.pointDirection.x * ROTATE_RANGE);
        }

        // beckon: lean the stem toward whichever hand is beckoning
        if (gesture.beckon) {
          const hand = gesture.hands[0];
          const flowerScreenX = groundXToNormalizedScreenX(flower.groundX);
          const handScreenX = hand ? 1 - hand.point.tip.x : flowerScreenX;
          const sign = handScreenX < flowerScreenX ? 1 : -1;
          store.setLeanX(damp(flower.leanX, sign * LEAN_ANGLE, 6, dt));
        } else if (Math.abs(flower.leanX) > 0.001) {
          store.setLeanX(damp(flower.leanX, 0, 4, dt));
        }

        // hold-to-inspect: sustained point near the bloom eases the camera in
        const targetInspect = gesture.holdNearFlower ? 1 : 0;
        store.setInspectAmount(damp(store.inspectAmount, targetInspect, 3, dt));

        if (isNewDetection && gesture.flick) {
          store.triggerGust();
          store.pushFx({ type: 'gust', color: species.secondaryColor });
        }

        if (isNewDetection && gesture.doublePinch) {
          const worldPos = flowerHeadWorldPos(flower.species, flower.groundX);
          store.pushFx({ type: 'pop', color: species.color });

          const projected = new THREE.Vector3(...worldPos).project(camera);
          const screenX = (projected.x + 1) / 2;
          const screenY = (1 - projected.y) / 2;
          store.launchPickedFlyer(flower.species, species.color, screenX, screenY);
          store.clearFlower();
        }
        break;
      }
      case 'picked':
        break;
    }
  });

  return null;
}
