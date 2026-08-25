import { useEffect, type RefObject } from 'react';
import { useBloomStore } from '../state/store';
import { emptyGestureState, setGesture } from './gestureBus';
import { clamp } from '../utils/math';
import type { GestureState, Vec2 } from '../types';

/**
 * Mouse-driven stand-in for the hand-tracking gesture bus (PRD §11): click to pinch, drag to
 * point/rotate, double-click to pick. Feeds the exact same gesture bus GameLoop reads, so the
 * rest of the app doesn't know or care whether a real hand or a mouse produced the gesture.
 */
export function useFallbackControls(targetRef: RefObject<HTMLElement | null>) {
  const fallbackMode = useBloomStore((s) => s.fallbackMode);

  useEffect(() => {
    if (!fallbackMode) return;
    const maybeEl = targetRef.current;
    if (!maybeEl) return;
    const el: HTMLElement = maybeEl;

    let mouseNorm: Vec2 = { x: 0.5, y: 0.5 };
    let hovering = false;

    function build(overrides: Partial<GestureState>): GestureState {
      const rawPoint: Vec2 = { x: 1 - mouseNorm.x, y: mouseNorm.y };
      const direction: Vec2 = { x: clamp((mouseNorm.x - 0.5) * 2.2, -1, 1), y: (mouseNorm.y - 0.5) * 2 };
      const pinchActive = overrides.singlePinch || overrides.twoHandPinch ? true : false;
      return {
        ...emptyGestureState,
        hands: hovering
          ? [
              {
                handedness: 'Right',
                pinch: { active: pinchActive, distance: pinchActive ? 0.1 : 1, point: rawPoint },
                point: { active: true, tip: rawPoint, direction },
                curl: 0,
                fingertipHistory: [],
              },
            ]
          : [],
        pointing: hovering,
        pointDirection: hovering ? direction : null,
        pointTip: hovering ? rawPoint : null,
        ...overrides,
      };
    }

    function updateMouseNorm(e: MouseEvent) {
      const rect = el.getBoundingClientRect();
      mouseNorm = {
        x: clamp((e.clientX - rect.left) / rect.width, 0, 1),
        y: clamp((e.clientY - rect.top) / rect.height, 0, 1),
      };
    }

    function handleMove(e: MouseEvent) {
      updateMouseNorm(e);
      hovering = true;
      setGesture(build({}));
    }

    function handleDown(e: MouseEvent) {
      updateMouseNorm(e);
      hovering = true;
      const { flower } = useBloomStore.getState();
      if (!flower) {
        setGesture(build({ singlePinch: true }));
      } else if (flower.stage === 'budded') {
        setGesture(build({ twoHandPinch: true }));
      } else {
        setGesture(build({}));
      }
    }

    function handleUp() {
      setGesture(build({}));
    }

    function handleDoubleClick(e: MouseEvent) {
      updateMouseNorm(e);
      setGesture(build({ doublePinch: true }));
      requestAnimationFrame(() => setGesture(build({})));
    }

    function handleLeave() {
      hovering = false;
      setGesture(build({}));
    }

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mousedown', handleDown);
    el.addEventListener('mouseup', handleUp);
    el.addEventListener('dblclick', handleDoubleClick);
    el.addEventListener('mouseleave', handleLeave);

    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mousedown', handleDown);
      el.removeEventListener('mouseup', handleUp);
      el.removeEventListener('dblclick', handleDoubleClick);
      el.removeEventListener('mouseleave', handleLeave);
      setGesture(emptyGestureState);
    };
  }, [fallbackMode, targetRef]);
}
