import { create } from 'zustand';
import { MAX_UTC_MS, MIN_UTC_MS } from '../domain/astronomy/engine';
import type { BodyId } from '../domain/astronomy/types';

export type TimeMode = 'live' | 'paused' | 'playing';
export type CameraMode = 'overview' | 'focused' | 'following' | 'free';
interface ExplorerState {
  utcMs: number;
  mode: TimeMode;
  speed: number;
  selected: BodyId | null;
  labels: boolean;
  orbits: boolean;
  resetToken: number;
  cameraMode: CameraMode;
  cameraTarget: BodyId | null;
  meteors: boolean;
  meteorBurst: number;
  triggerMeteor: () => void;
  focusBody: (id: BodyId) => void;
  followBody: (id: BodyId) => void;
  releaseCamera: () => void;
  toggleMeteors: () => void;
  select: (id: BodyId | null) => void;
  setTime: (utcMs: number) => void;
  setSpeed: (speed: number) => void;
  togglePlaying: () => void;
  now: () => void;
  tick: (elapsedMs: number, systemUtcMs: number) => void;
  toggleLabels: () => void;
  toggleOrbits: () => void;
  resetCamera: () => void;
}

export const useExplorer = create<ExplorerState>((set) => ({
  utcMs: Date.now(),
  mode: 'live',
  speed: 1,
  selected: 'Earth',
  labels: true,
  orbits: true,
  resetToken: 0,
  cameraMode: 'overview',
  cameraTarget: null,
  meteors: true,
  meteorBurst: 0,
  triggerMeteor: () =>
    set((state) => ({ meteors: true, meteorBurst: state.meteorBurst + 1 })),
  focusBody: (cameraTarget) =>
    set((state) => ({
      cameraTarget,
      cameraMode: 'focused',
      resetToken: state.resetToken + 1,
    })),
  followBody: (cameraTarget) =>
    set((state) => ({
      cameraTarget,
      cameraMode: 'following',
      resetToken: state.resetToken + 1,
    })),
  releaseCamera: () => set({ cameraMode: 'free', cameraTarget: null }),
  toggleMeteors: () => set((state) => ({ meteors: !state.meteors })),
  select: (selected) => set({ selected }),
  setTime: (utcMs) => {
    if (Number.isFinite(utcMs) && utcMs >= MIN_UTC_MS && utcMs <= MAX_UTC_MS) {
      set({ utcMs, mode: 'paused' });
    }
  },
  setSpeed: (speed) => {
    if (Number.isFinite(speed) && speed !== 0) {
      set((state) => ({
        speed,
        mode: state.mode === 'live' ? 'paused' : state.mode,
      }));
    }
  },
  togglePlaying: () =>
    set((state) => ({ mode: state.mode === 'paused' ? 'playing' : 'paused' })),
  now: () => set({ utcMs: Date.now(), mode: 'live', speed: 1 }),
  tick: (elapsedMs, systemUtcMs) =>
    set((state) => {
      if (state.mode === 'paused') return state;
      const next =
        state.mode === 'live'
          ? systemUtcMs
          : state.utcMs + elapsedMs * state.speed;
      const utcMs = Math.max(MIN_UTC_MS, Math.min(MAX_UTC_MS, next));
      return { utcMs, mode: next === utcMs ? state.mode : 'paused' };
    }),
  toggleLabels: () => set((state) => ({ labels: !state.labels })),
  toggleOrbits: () => set((state) => ({ orbits: !state.orbits })),
  resetCamera: () =>
    set((state) => ({
      resetToken: state.resetToken + 1,
      cameraMode: 'overview',
      cameraTarget: null,
    })),
}));
