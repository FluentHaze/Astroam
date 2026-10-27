import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  type Group,
} from 'three';

const SKY_RADIUS = 280;
const GALAXY_ROTATION = new Quaternion().setFromUnitVectors(
  new Vector3(0, 1, 0),
  new Vector3(0.42, 0.8, -0.43).normalize(),
);

function cloudNoise(x: number, y: number, period: number) {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  const fractionX = x - cellX;
  const fractionY = y - cellY;
  const smoothX = fractionX * fractionX * (3 - 2 * fractionX);
  const smoothY = fractionY * fractionY * (3 - 2 * fractionY);
  const hash = (ix: number, iy: number) => {
    const wrappedX = ((ix % period) + period) % period;
    let value = Math.imul(wrappedX, 374761393) + Math.imul(iy, 668265263);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
  };
  const top =
    hash(cellX, cellY) * (1 - smoothX) + hash(cellX + 1, cellY) * smoothX;
  const bottom =
    hash(cellX, cellY + 1) * (1 - smoothX) +
    hash(cellX + 1, cellY + 1) * smoothX;
  return top * (1 - smoothY) + bottom * smoothY;
}

function createGalaxyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 768;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const image = context.createImageData(canvas.width, canvas.height);
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = 5;
    image.data[index + 1] = 10;
    image.data[index + 2] = 18;
    image.data[index + 3] = 255;
  }
  for (let y = 0; y < canvas.height; y++) {
    const latitude = (y / (canvas.height - 1) - 0.5) * Math.PI;
    if (Math.abs(latitude) > 0.5) continue;
    for (let x = 0; x < canvas.width; x++) {
      const longitude = (x / canvas.width) * Math.PI * 2;
      // Periodic harmonics keep the equirectangular seam continuous.
      const drift = Math.sin(longitude * 3) * 0.025;
      const width = 0.13 + 0.04 * Math.sin(longitude * 2 + 0.8);
      const distance = latitude - drift;
      const envelope = Math.exp(-((distance / width) ** 2) * 0.7);
      const across = longitude / (2 * Math.PI);
      const wisps =
        cloudNoise(across * 32, latitude * 32 + 17, 32) * 0.55 +
        cloudNoise(across * 64, latitude * 64 + 53, 64) * 0.3 +
        cloudNoise(across * 128, latitude * 128 + 109, 128) * 0.15;
      const dustLane = Math.exp(
        -(((distance + Math.sin(longitude * 11) * 0.012) / 0.014) ** 2),
      );
      const brightness =
        envelope * Math.pow(wisps, 1.7) * 1.5 * (1 - dustLane * 0.72);
      const halo = Math.exp(-((distance / 0.32) ** 2)) * 0.07;
      const index = (y * canvas.width + x) * 4;
      image.data[index] = 5 + (brightness + halo) * 60;
      image.data[index + 1] = 10 + (brightness + halo) * 66;
      image.data[index + 2] = 18 + (brightness + halo) * 80;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function createStars() {
  const count = 26000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const brightnesses = new Float32Array(count);
  const palette = ['#dbe8ff', '#fff1db', '#bad4ff', '#eef3ff'].map(
    (hex) => new Color(hex),
  );
  let seed = 48;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let index = 0; index < count; index++) {
    const longitude = random() * Math.PI * 2;
    // A denser, irregular band supplements the sparse all-sky distribution.
    const latitude =
      index < 15000
        ? Math.asin(random() * 2 - 1)
        : (random() + random() + random() - 1.5) * 0.28;
    const radius = SKY_RADIUS - 2 - random() * 5;
    positions.set(
      [
        radius * Math.cos(latitude) * Math.cos(longitude),
        radius * Math.sin(latitude),
        radius * Math.cos(latitude) * Math.sin(longitude),
      ],
      index * 3,
    );
    const color = palette[Math.floor(random() * palette.length)];
    colors.set([color.r, color.g, color.b], index * 3);
    const magnitude = random();
    const bright = magnitude > 0.995;
    sizes[index] = bright ? 6 + random() * 4 : 1.1 + random() * 2.1;
    brightnesses[index] = bright ? 0.9 : 0.22 + magnitude * 0.55;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
  geometry.setAttribute('aBrightness', new BufferAttribute(brightnesses, 1));
  return geometry;
}

export function Starfield() {
  const group = useRef<Group>(null);
  const galaxy = useMemo(() => createGalaxyTexture(), []);
  const stars = useMemo(() => createStars(), []);
  const dpr = useThree((state) => state.viewport.dpr);
  const uniforms = useMemo(() => ({ uDpr: { value: dpr } }), [dpr]);
  useFrame(({ camera }) => {
    // A celestial background rotates with the view, without near-field parallax.
    group.current?.position.copy(camera.position);
  });
  useEffect(
    () => () => {
      galaxy?.dispose();
      stars.dispose();
    },
    [galaxy, stars],
  );
  return (
    <group
      ref={group}
      quaternion={GALAXY_ROTATION}
    >
      {galaxy && (
        <mesh renderOrder={-20}>
          <sphereGeometry args={[SKY_RADIUS, 48, 32]} />
          <meshBasicMaterial
            map={galaxy}
            side={BackSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
      <points
        geometry={stars}
        renderOrder={-19}
      >
        <shaderMaterial
          uniforms={uniforms}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
          toneMapped={false}
          vertexShader={`
            uniform float uDpr;
            attribute vec3 aColor;
            attribute float aSize;
            attribute float aBrightness;
            varying vec3 vColor;
            varying float vBrightness;
            void main() {
              vColor = aColor;
              vBrightness = aBrightness;
              gl_PointSize = aSize * uDpr;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vBrightness;
            void main() {
              float radius = length(gl_PointCoord - 0.5) * 2.0;
              if (radius > 1.0) discard;
              float core = exp(-radius * radius * 7.0);
              float halo = exp(-radius * radius * 4.0) * 0.12;
              float alpha = (core + halo) * vBrightness;
              gl_FragColor = vec4(vColor, alpha);
              #include <colorspace_fragment>
            }
          `}
        />
      </points>
    </group>
  );
}
