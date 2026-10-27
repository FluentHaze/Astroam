export type BodyId =
  | 'Sun'
  | 'Mercury'
  | 'Venus'
  | 'Earth'
  | 'Moon'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune';

export interface BodyInfo {
  id: BodyId;
  name: string;
  english: string;
  category: string;
  color: string;
  radiusKm: number;
  periodDays: number;
  displayRadius: number;
  description: string;
  fact: string;
  sourceUrl: string;
}

export interface Position {
  frame: 'heliocentric-equatorial-J2000';
  xAu: number;
  yAu: number;
  zAu: number;
}

export interface Snapshot {
  utcMs: number;
  positions: Record<BodyId, Position>;
}

export type OrbitPaths = Partial<Record<BodyId, Position[]>>;

export type CalculationRequest =
  | { kind: 'positions'; sequence: number; utcMs: number }
  | { kind: 'orbits'; sequence: number; utcMs: number };

export type CalculationResponse =
  | { kind: 'positions'; sequence: number; snapshot: Snapshot }
  | { kind: 'orbits'; sequence: number; paths: OrbitPaths }
  | { kind: 'error'; sequence: number; message: string };
