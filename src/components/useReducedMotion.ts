import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';
function subscribe(listener: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
