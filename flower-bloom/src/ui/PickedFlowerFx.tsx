import { useEffect, useRef } from 'react';
import { useBloomStore } from '../state/store';
import { easeInOutSine } from '../utils/math';

const DRIFT_MS = 650;
const FLY_MS = 900;

/**
 * The "pop → drift → bouquet" sequence after a double-pinch pick (PRD §6.1): a glowing dot
 * floats loosely near the pick point, then eases into the bouquet jar icon in the corner.
 */
export function PickedFlowerFx() {
  const pickedFlyer = useBloomStore((s) => s.pickedFlyer);
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickedFlyer) return;
    let raf = 0;
    const startedAt = pickedFlyer.startedAt;
    const startX = pickedFlyer.startX * window.innerWidth;
    const startY = pickedFlyer.startY * window.innerHeight;

    const tick = () => {
      const el = elRef.current;
      if (!el) return;
      const elapsed = performance.now() - startedAt;
      const jarEl = document.getElementById('bouquet-jar');
      const jarRect = jarEl?.getBoundingClientRect();
      const targetX = jarRect ? jarRect.left + jarRect.width / 2 : window.innerWidth - 40;
      const targetY = jarRect ? jarRect.top + jarRect.height / 2 : window.innerHeight - 40;

      if (elapsed < DRIFT_MS) {
        const bob = Math.sin(elapsed * 0.012) * 8;
        el.style.transform = `translate(${startX}px, ${startY + bob}px) scale(1)`;
        el.style.opacity = '1';
        raf = requestAnimationFrame(tick);
      } else if (elapsed < DRIFT_MS + FLY_MS) {
        const t = easeInOutSine((elapsed - DRIFT_MS) / FLY_MS);
        const x = startX + (targetX - startX) * t;
        const y = startY + (targetY - startY) * t;
        const scale = 1 - t * 0.75;
        el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        el.style.opacity = String(1 - t * 0.3);
        raf = requestAnimationFrame(tick);
      } else {
        useBloomStore.getState().addToBouquet(pickedFlyer.species);
        useBloomStore.getState().clearPickedFlyer();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pickedFlyer]);

  if (!pickedFlyer) return null;

  return (
    <div
      ref={elRef}
      className="picked-flyer"
      style={{ ['--flyer-color' as string]: pickedFlyer.color }}
      aria-hidden
    />
  );
}
