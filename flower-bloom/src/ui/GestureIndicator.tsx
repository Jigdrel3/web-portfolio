import { useEffect, useState } from 'react';
import { getGesture, subscribeGesture } from '../tracking/gestureBus';
import type { GestureState } from '../types';

function describeGesture(g: GestureState): string {
  if (g.doublePinch) return 'Double pinch — picking';
  if (g.twoHandPinch) return 'Two-hand pinch — blooming';
  if (g.singlePinch) return 'Pinch — sprouting';
  if (g.beckon) return 'Beckoning the flower closer';
  if (g.circularMotion) return `Stirring pollen (${g.circularMotion === 'cw' ? 'clockwise' : 'counter-clockwise'})`;
  if (g.holdNearFlower) return 'Holding near the bloom — inspecting';
  if (g.pointing) return 'Pointing — rotating';
  if (g.hands.length > 0) return 'Hand detected';
  return 'No hand detected';
}

export function GestureIndicator() {
  const [gesture, setLocalGesture] = useState<GestureState>(getGesture());

  useEffect(() => subscribeGesture(setLocalGesture), []);

  return (
    <div className="hud-chip gesture-indicator" aria-live="polite">
      <span className={`gesture-dot ${gesture.hands.length > 0 ? 'active' : ''}`} />
      <span>{describeGesture(gesture)}</span>
    </div>
  );
}
