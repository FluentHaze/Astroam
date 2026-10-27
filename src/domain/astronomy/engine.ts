import { Body, HelioVector } from 'astronomy-engine';
import { BODIES } from '../../data/bodies';
import type { BodyId, OrbitPaths, Position, Snapshot } from './types';

export const DAY_MS = 86_400_000;
export const MIN_UTC_MS = Date.UTC(2000, 0, 1);
export const MAX_UTC_MS = Date.UTC(2051, 0, 1) - 1;

export function positionAt(id: BodyId, utcMs: number): Position {
  const vector = HelioVector(Body[id], new Date(utcMs));
  return {
    frame: 'heliocentric-equatorial-J2000',
    xAu: vector.x,
    yAu: vector.y,
    zAu: vector.z,
  };
}

export function calculateSnapshot(utcMs: number): Snapshot {
  if (!Number.isFinite(utcMs) || utcMs < MIN_UTC_MS || utcMs > MAX_UTC_MS) {
    throw new RangeError('请选择 2000 至 2050 年之间的日期');
  }
  const positions = Object.fromEntries(
    BODIES.map(({ id }) => [id, positionAt(id, utcMs)]),
  ) as Record<BodyId, Position>;
  return { utcMs, positions };
}

// Reference trajectories are sampled from the ephemeris, not ideal circles.
// Outer-planet paths sample a full revolution beyond the UI date range.
export function calculateOrbits(utcMs: number): OrbitPaths {
  const paths: OrbitPaths = {};
  for (const body of BODIES) {
    if (body.id === 'Sun' || body.id === 'Moon') continue;
    paths[body.id] = Array.from({ length: 161 }, (_, index) =>
      positionAt(body.id, utcMs + (index / 160) * body.periodDays * DAY_MS),
    );
  }
  return paths;
}
