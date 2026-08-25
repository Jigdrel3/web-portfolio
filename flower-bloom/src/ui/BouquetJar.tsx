import { useEffect, useRef, useState } from 'react';
import { useBloomStore } from '../state/store';
import { SPECIES } from '../scene/species';
import type { SpeciesId } from '../types';

export function BouquetJar() {
  const bouquet = useBloomStore((s) => s.bouquet);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(bouquet.length);

  useEffect(() => {
    if (bouquet.length > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 420);
      prevCount.current = bouquet.length;
      return () => clearTimeout(t);
    }
    prevCount.current = bouquet.length;
  }, [bouquet.length]);

  const counts = new Map<SpeciesId, number>();
  for (const id of bouquet) counts.set(id, (counts.get(id) ?? 0) + 1);

  return (
    <div className="bouquet-wrap">
      {open && (
        <div className="bouquet-summary">
          <h3>Your bouquet</h3>
          {bouquet.length === 0 ? (
            <p>Nothing picked yet — double-pinch a bloomed flower to collect it.</p>
          ) : (
            <ul>
              {Array.from(counts.entries()).map(([id, count]) => (
                <li key={id}>
                  <span className="species-swatch" style={{ ['--species-color' as string]: SPECIES[id].color }} />
                  {SPECIES[id].name} × {count}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <button
        id="bouquet-jar"
        className={`bouquet-jar ${bump ? 'bump' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Bouquet jar, ${bouquet.length} flower${bouquet.length === 1 ? '' : 's'} collected`}
      >
        <svg viewBox="0 0 48 56" width="40" height="46" aria-hidden>
          <path
            d="M14 6 H34 V14 L38 20 V48 Q38 52 34 52 H14 Q10 52 10 48 V20 L14 14 Z"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.5"
          />
          {bouquet.slice(-8).map((id, i) => (
            <circle key={i} cx={16 + (i % 4) * 5.5} cy={44 - Math.floor(i / 4) * 6} r="3" fill={SPECIES[id].color} />
          ))}
        </svg>
      </button>
    </div>
  );
}
