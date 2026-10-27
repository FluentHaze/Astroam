import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_UTC_MS, MIN_UTC_MS } from '../domain/astronomy/engine';
import { useExplorer } from './store';

beforeEach(() => useExplorer.getState().now());

describe('shared simulation clock', () => {
  it('pauses edits and resumes in the chosen direction', () => {
    const time = Date.UTC(2026, 9, 27);
    useExplorer.getState().setTime(time);
    useExplorer.getState().tick(1000, time + 1000);
    expect(useExplorer.getState().utcMs).toBe(time);
    useExplorer.getState().setSpeed(-86400);
    useExplorer.getState().togglePlaying();
    useExplorer.getState().tick(1000, time + 1000);
    expect(useExplorer.getState().utcMs).toBe(time - 86400000);
  });

  it('stops at both supported boundaries', () => {
    for (const [boundary, speed] of [
      [MAX_UTC_MS, 86400],
      [MIN_UTC_MS, -86400],
    ]) {
      useExplorer.getState().setTime(boundary);
      useExplorer.getState().setSpeed(speed);
      useExplorer.getState().togglePlaying();
      useExplorer.getState().tick(1000, boundary);
      expect(useExplorer.getState().utcMs).toBe(boundary);
      expect(useExplorer.getState().mode).toBe('paused');
    }
  });

  it('returns to wall clock and resets speed without changing selection', () => {
    useExplorer.getState().select('Mars');
    useExplorer.getState().setSpeed(86400);
    useExplorer.getState().now();
    const state = useExplorer.getState();
    expect(Math.abs(state.utcMs - Date.now())).toBeLessThan(100);
    expect(state.mode).toBe('live');
    expect(state.speed).toBe(1);
    expect(state.selected).toBe('Mars');
  });
});

describe('camera commands', () => {
  it('keeps selection and simulation time independent of the observation target', () => {
    const time = Date.UTC(2026, 9, 27);
    useExplorer.getState().setTime(time);
    useExplorer.getState().select('Earth');
    useExplorer.getState().followBody('Mars');
    useExplorer.getState().select(null);
    expect(useExplorer.getState().cameraTarget).toBe('Mars');
    expect(useExplorer.getState().cameraMode).toBe('following');
    expect(useExplorer.getState().utcMs).toBe(time);
    useExplorer.getState().resetCamera();
    expect(useExplorer.getState().cameraTarget).toBeNull();
    expect(useExplorer.getState().cameraMode).toBe('overview');
    expect(useExplorer.getState().utcMs).toBe(time);
  });

  it('allows the most recent camera command to win and releases tracking', () => {
    useExplorer.getState().focusBody('Moon');
    const token = useExplorer.getState().resetToken;
    useExplorer.getState().followBody('Saturn');
    expect(useExplorer.getState().resetToken).toBeGreaterThan(token);
    expect(useExplorer.getState().cameraTarget).toBe('Saturn');
    useExplorer.getState().releaseCamera();
    expect(useExplorer.getState().cameraMode).toBe('free');
    expect(useExplorer.getState().cameraTarget).toBeNull();
  });
});
