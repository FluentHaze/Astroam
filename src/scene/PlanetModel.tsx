import { useEffect, useMemo } from 'react';
import { BackSide, DoubleSide, RingGeometry } from 'three';
import type { BodyInfo } from '../domain/astronomy/types';
import { PLANET_MAPS, useTextureAsset } from './planetTexture';

function EarthLayers({ radius }: { radius: number }) {
  const { texture } = useTextureAsset('/textures/earth-clouds.webp');
  return (
    <>
      {texture && (
        <mesh>
          <sphereGeometry args={[radius * 1.012, 64, 40]} />
          <meshStandardMaterial
            map={texture}
            transparent
            opacity={0.82}
            depthWrite={false}
            roughness={1}
          />
        </mesh>
      )}
      <mesh>
        <sphereGeometry args={[radius * 1.04, 48, 32]} />
        <shaderMaterial
          transparent
          side={BackSide}
          depthWrite={false}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vView;
            void main() {
              vec4 positionView = modelViewMatrix * vec4(position, 1.0);
              vNormal = normalize(normalMatrix * normal);
              vView = normalize(-positionView.xyz);
              gl_Position = projectionMatrix * positionView;
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            varying vec3 vView;
            void main() {
              float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.0);
              gl_FragColor = vec4(0.22, 0.55, 1.0, rim * 0.32);
            }
          `}
        />
      </mesh>
    </>
  );
}

function EarthSurface({ body, radius }: { body: BodyInfo; radius: number }) {
  const { texture } = useTextureAsset(PLANET_MAPS.Earth);
  const { texture: normal } = useTextureAsset(
    '/textures/earth-normal.webp',
    true,
  );
  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 40]} />
      <meshStandardMaterial
        key={`${Boolean(texture)}-${Boolean(normal)}`}
        map={texture}
        normalMap={normal}
        normalScale={[0.35, 0.35]}
        color={texture ? 'white' : body.color}
        roughness={0.78}
        metalness={0}
      />
    </mesh>
  );
}

function SaturnRings({ radius }: { radius: number }) {
  const { texture } = useTextureAsset('/textures/saturn-ring.webp');
  const geometry = useMemo(() => {
    const innerRadius = radius * 1.2;
    const outerRadius = radius * 2.28;
    const result = new RingGeometry(innerRadius, outerRadius, 128);
    const positions = result.getAttribute('position');
    const uv = result.getAttribute('uv');
    for (let index = 0; index < positions.count; index++) {
      // Qt asset contains two full annuli. Sample the left disk with planar UVs.
      uv.setXY(
        index,
        (positions.getX(index) / outerRadius + 1) * 0.25,
        (positions.getY(index) / outerRadius + 1) * 0.5,
      );
    }
    return result;
  }, [radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2.5, 0.15, 0]}
    >
      <meshStandardMaterial
        key={texture ? 'textured' : 'fallback'}
        map={texture}
        color={texture ? 'white' : '#c4b18b'}
        side={DoubleSide}
        transparent
        opacity={texture ? 0.95 : 0.45}
        alphaTest={0.02}
        roughness={1}
      />
    </mesh>
  );
}

export function PlanetModel({
  body,
  radius = body.displayRadius,
}: {
  body: BodyInfo;
  radius?: number;
}) {
  const { texture } = useTextureAsset(PLANET_MAPS[body.id]);
  return (
    <group rotation={[0, -0.4, 0]}>
      {body.id === 'Earth' ? (
        <EarthSurface
          body={body}
          radius={radius}
        />
      ) : (
        <mesh>
          <sphereGeometry args={[radius, 64, 40]} />
          {body.id === 'Sun' ? (
            <meshBasicMaterial
              key={texture ? 'textured' : 'fallback'}
              map={texture}
              color={texture ? 'white' : body.color}
              toneMapped={false}
            />
          ) : (
            <meshStandardMaterial
              key={texture ? 'textured' : 'fallback'}
              map={texture}
              color={texture ? 'white' : body.color}
              roughness={0.96}
            />
          )}
        </mesh>
      )}
      {body.id === 'Earth' && <EarthLayers radius={radius} />}
      {body.id === 'Saturn' && <SaturnRings radius={radius} />}
    </group>
  );
}
