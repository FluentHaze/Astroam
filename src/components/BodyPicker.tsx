import { ArrowUpRight } from 'lucide-react';
import { BODIES } from '../data/bodies';
import { useExplorer } from '../state/store';

export function BodyPicker() {
  const selected = useExplorer((state) => state.selected);
  const select = useExplorer((state) => state.select);
  return (
    <nav
      className="body-picker panel"
      aria-label="天体选择"
    >
      <div className="section-heading">
        <span>太阳系天体</span>
        <span className="muted">10</span>
      </div>
      <div className="body-list">
        {BODIES.map((body, index) => (
          <button
            key={body.id}
            className={
              selected === body.id ? 'body-option active' : 'body-option'
            }
            aria-pressed={selected === body.id}
            onClick={() => select(body.id)}
          >
            <span className="body-number">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className={`planet-dot planet-${body.id.toLowerCase()}`} />
            <span className="body-option-name">{body.name}</span>
            <ArrowUpRight size={14} />
          </button>
        ))}
      </div>
      <div className="picker-footer">
        <span className="status-dot" />
        <span>本地星历计算</span>
      </div>
    </nav>
  );
}
