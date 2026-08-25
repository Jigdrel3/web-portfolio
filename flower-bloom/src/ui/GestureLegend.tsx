import { useState } from 'react';

const CORE = [
  { label: 'Pinch', desc: 'Sprout a stem and bud' },
  { label: 'Two-hand pinch', desc: 'Bloom the flower' },
  { label: 'Point', desc: 'Rotate the bloom' },
  { label: 'Double pinch', desc: 'Pick the flower' },
];

const CHARM = [
  { label: 'Point, trace a circle', desc: 'Stir a pollen swirl' },
  { label: 'Point and hold', desc: 'Lean in and inspect' },
  { label: 'Flick past the bloom', desc: 'A gust ripples through' },
  { label: 'Beckon (curl a finger)', desc: 'Flower leans toward you' },
];

export function GestureLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`gesture-legend ${open ? 'open' : ''}`}>
      <button className="hud-chip legend-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? 'Close guide' : 'Gesture guide'}
      </button>
      {open && (
        <div className="legend-body">
          <h3>Core</h3>
          <ul>
            {CORE.map((g) => (
              <li key={g.label}>
                <strong>{g.label}</strong>
                <span>{g.desc}</span>
              </li>
            ))}
          </ul>
          <h3>For lingering</h3>
          <ul>
            {CHARM.map((g) => (
              <li key={g.label}>
                <strong>{g.label}</strong>
                <span>{g.desc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
