import { useBloomStore } from '../state/store';
import { SPECIES_LIST } from '../scene/species';

export function SpeciesPanel() {
  const panelOpen = useBloomStore((s) => s.panelOpen);
  const setPanelOpen = useBloomStore((s) => s.setPanelOpen);
  const selectedSpecies = useBloomStore((s) => s.selectedSpecies);
  const setSelectedSpecies = useBloomStore((s) => s.setSelectedSpecies);
  const flower = useBloomStore((s) => s.flower);

  return (
    <div className={`species-panel ${panelOpen ? 'open' : 'closed'}`}>
      <button
        className="species-panel-toggle"
        onClick={() => setPanelOpen(!panelOpen)}
        aria-expanded={panelOpen}
        aria-label={panelOpen ? 'Collapse species panel' : 'Expand species panel'}
      >
        {panelOpen ? '‹' : '›'}
      </button>
      {panelOpen && (
        <div className="species-panel-body">
          <h2>Species</h2>
          <p className="species-panel-hint">
            {flower ? 'Pick or wait for this bloom before switching.' : 'Choose what your next pinch grows.'}
          </p>
          <ul>
            {SPECIES_LIST.map((s) => (
              <li key={s.id}>
                <button
                  className={`species-item ${selectedSpecies === s.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSpecies(s.id)}
                  disabled={!!flower}
                  style={{ ['--species-color' as string]: s.color }}
                >
                  <span className="species-swatch" />
                  <span className="species-name">{s.name}</span>
                </button>
                {selectedSpecies === s.id && <p className="species-desc">{s.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
