import { useSyncExternalStore } from 'react';
import { useExplorer } from '../state/store';
import { useReducedMotion } from './useReducedMotion';

function subscribeVisibility(listener: () => void) {
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
}
function getHidden() {
  return document.hidden;
}

export function MeteorEffects() {
  const enabled = useExplorer((state) => state.meteors);
  const burst = useExplorer((state) => state.meteorBurst);
  const hidden = useSyncExternalStore(
    subscribeVisibility,
    getHidden,
    () => false,
  );
  const reducedMotion = useReducedMotion();
  if (!enabled || reducedMotion) return null;
  return (
    <div
      className={hidden ? 'meteor-layer is-paused' : 'meteor-layer'}
      aria-hidden="true"
    >
      <span className="meteor meteor-one" />
      <span className="meteor meteor-two" />
      <span className="meteor meteor-three" />
      {burst > 0 && (
        <span
          key={burst}
          className="meteor meteor-burst"
        />
      )}
    </div>
  );
}
