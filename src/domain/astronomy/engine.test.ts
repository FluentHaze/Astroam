import { describe, expect, it } from 'vitest';
import { calculateSnapshot, MIN_UTC_MS, MAX_UTC_MS } from './engine';
import { bodyScenePosition } from './display';

describe('ephemeris adapter', () => {
  it('keeps physical coordinates distinct from the schematic display', () => {
    const snapshot = calculateSnapshot(Date.UTC(2026, 9, 27));
    const earth = snapshot.positions.Earth;
    const moon = snapshot.positions.Moon;
    expect(Object.keys(snapshot.positions)).toHaveLength(10);
    expect(Math.hypot(earth.xAu, earth.yAu, earth.zAu)).toBeGreaterThan(0.98);
    expect(Math.hypot(earth.xAu, earth.yAu, earth.zAu)).toBeLessThan(1.02);
    const lunarDistance = Math.hypot(
      moon.xAu - earth.xAu,
      moon.yAu - earth.yAu,
      moon.zAu - earth.zAu,
    );
    expect(lunarDistance).toBeGreaterThan(0.0023);
    expect(lunarDistance).toBeLessThan(0.0028);
    expect(earth.frame).toBe('heliocentric-equatorial-J2000');
    const earthScene = bodyScenePosition('Earth', snapshot);
    const moonScene = bodyScenePosition('Moon', snapshot);
    expect(
      Math.hypot(...moonScene.map((value, index) => value - earthScene[index])),
    ).toBeCloseTo(0.95);
  });

  it('accepts range endpoints and rejects invalid input', () => {
    expect(() => calculateSnapshot(MIN_UTC_MS)).not.toThrow();
    expect(() => calculateSnapshot(MAX_UTC_MS)).not.toThrow();
    for (const value of [NaN, Infinity, MIN_UTC_MS - 1, MAX_UTC_MS + 1]) {
      expect(() => calculateSnapshot(value)).toThrow(RangeError);
    }
  });

  it('places Earth on opposing sides of the Sun six months apart', () => {
    const first = calculateSnapshot(Date.UTC(2026, 0, 1)).positions.Earth;
    const second = calculateSnapshot(Date.UTC(2026, 6, 1)).positions.Earth;
    const dot =
      first.xAu * second.xAu + first.yAu * second.yAu + first.zAu * second.zAu;
    expect(dot).toBeLessThan(-0.95);
  });
});
