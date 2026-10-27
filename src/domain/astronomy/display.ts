import type { BodyId, Position, Snapshot } from './types';

export type ScenePoint = [number, number, number];
const OBLIQUITY_RAD = (23.4392911 * Math.PI) / 180;

export function toScene(position: Position): ScenePoint {
  // Fixed J2000 equatorial -> ecliptic rotation, then Y-up scene mapping.
  const x = position.xAu;
  const y =
    position.yAu * Math.cos(OBLIQUITY_RAD) +
    position.zAu * Math.sin(OBLIQUITY_RAD);
  const z =
    -position.yAu * Math.sin(OBLIQUITY_RAD) +
    position.zAu * Math.cos(OBLIQUITY_RAD);
  const radiusAu = Math.hypot(x, y, z);
  if (radiusAu === 0) return [0, 0, 0];
  const scale = (5.8 * Math.pow(radiusAu, 0.58)) / radiusAu;
  return [x * scale, z * scale, -y * scale];
}

export function bodyScenePosition(id: BodyId, snapshot: Snapshot): ScenePoint {
  if (id !== 'Moon') return toScene(snapshot.positions[id]);
  const earth = snapshot.positions.Earth;
  const moon = snapshot.positions.Moon;
  const earthScene = toScene(earth);
  const relative = toScene({
    ...moon,
    xAu: moon.xAu - earth.xAu,
    yAu: moon.yAu - earth.yAu,
    zAu: moon.zAu - earth.zAu,
  });
  const length = Math.hypot(...relative);
  // Moon separation is magnified independently; never use this for lunar lighting.
  return earthScene.map(
    (value, index) => value + (relative[index] / length) * 0.95,
  ) as ScenePoint;
}
