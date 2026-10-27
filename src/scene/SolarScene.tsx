import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from 'react';
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from '@react-three/fiber';
import { Line, OrbitControls } from '@react-three/drei';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Spherical,
  Vector3,
  type Group,
} from 'three';
import { BODIES } from '../data/bodies';
import { bodyScenePosition, toScene } from '../domain/astronomy/display';
import type {
  BodyId,
  BodyInfo,
  OrbitPaths,
  Snapshot,
} from '../domain/astronomy/types';
import { useExplorer } from '../state/store';
import { PlanetModel } from './PlanetModel';

function Planet({ body, snapshot }: { body: BodyInfo; snapshot: Snapshot }) {
  const group = useRef<Group>(null);
  const selected = useExplorer((state) => state.selected === body.id);
  useFrame(() => {
    group.current?.position.set(...bodyScenePosition(body.id, snapshot));
  });
  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 5) return;
    useExplorer.getState().select(body.id);
  };

  return (
    <group
      ref={group}
      onClick={select}
    >
      <PlanetModel body={body} />
      {body.id === 'Sun' && (
        <mesh scale={1.15}>
          <sphereGeometry args={[body.displayRadius, 32, 24]} />
          <meshBasicMaterial
            color={body.color}
            transparent
            opacity={0.065}
            blending={AdditiveBlending}
            side={BackSide}
            depthWrite={false}
          />
        </mesh>
      )}
      {selected && (
        <mesh>
          <sphereGeometry args={[body.displayRadius * 1.22, 24, 16]} />
          <meshBasicMaterial
            color="#65b6ff"
            wireframe
            transparent
            opacity={0.18}
          />
        </mesh>
      )}
    </group>
  );
}

type LabelElements = RefObject<Partial<Record<BodyId, HTMLSpanElement>>>;

function BodyLabels({
  snapshot,
  elements,
}: {
  snapshot: Snapshot;
  elements: LabelElements;
}) {
  const selected = useExplorer((state) => state.selected);
  const labels = useExplorer((state) => state.labels);
  const { camera, size } = useThree();
  const candidates = useMemo(
    () =>
      [...BODIES].sort(
        (a, b) => Number(b.id === selected) - Number(a.id === selected),
      ),
    [selected],
  );
  useFrame(() => {
    const occupied: { x: number; y: number }[] = [];
    for (const body of candidates) {
      const element = elements.current[body.id];
      if (!element) continue;
      const position = new Vector3(...bodyScenePosition(body.id, snapshot));
      position.y += body.displayRadius + 0.5;
      position.project(camera);
      const x = ((position.x + 1) * size.width) / 2;
      const y = ((1 - position.y) * size.height) / 2;
      const collision = occupied.some(
        (point) => Math.abs(point.x - x) < 52 && Math.abs(point.y - y) < 24,
      );
      const visible =
        (labels || body.id === selected) &&
        !collision &&
        Math.abs(position.z) < 1;
      element.setAttribute(
        'style',
        `visibility: ${visible ? 'visible' : 'hidden'}; transform: translate(${x}px, ${y}px) translate(-50%, -50%)`,
      );
      if (visible) occupied.push({ x, y });
    }
  });
  return null;
}

function Starfield() {
  const geometry = useMemo(() => {
    const positions = new Float32Array(1800 * 3);
    let seed = 48;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let index = 0; index < 1800; index++) {
      const theta = random() * Math.PI * 2;
      const cosPhi = random() * 2 - 1;
      const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
      positions.set(
        [
          180 * sinPhi * Math.cos(theta),
          180 * cosPhi,
          180 * sinPhi * Math.sin(theta),
        ],
        index * 3,
      );
    }
    const result = new BufferGeometry();
    result.setAttribute('position', new BufferAttribute(positions, 3));
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <points geometry={geometry}>
      <pointsMaterial
        color="#b7c8dd"
        size={0.19}
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  );
}

const HOME_POSITION = new Vector3(0, 29, 38);

function CameraControls() {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const resetToken = useExplorer((state) => state.resetToken);
  const { camera, gl, invalidate } = useThree();

  useEffect(() => {
    camera.position.copy(HOME_POSITION);
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
    invalidate();
  }, [camera, resetToken, invalidate]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute(
      'aria-label',
      '太阳系三维场景，方向键旋转，加减键缩放，Home 重置视角',
    );
    const handleKey = (event: KeyboardEvent) => {
      const control = controls.current;
      if (!control) return;
      const keys = [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        '+',
        '=',
        '-',
        'Home',
      ];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') {
        useExplorer.getState().resetCamera();
        return;
      }
      const offset = camera.position.clone().sub(control.target);
      const spherical = new Spherical().setFromVector3(offset);
      if (event.key === 'ArrowLeft') spherical.theta -= 0.08;
      if (event.key === 'ArrowRight') spherical.theta += 0.08;
      if (event.key === 'ArrowUp') spherical.phi -= 0.08;
      if (event.key === 'ArrowDown') spherical.phi += 0.08;
      if (event.key === '+' || event.key === '=') spherical.radius *= 0.9;
      if (event.key === '-') spherical.radius *= 1.1;
      spherical.radius = Math.max(24, Math.min(115, spherical.radius));
      spherical.makeSafe();
      camera.position
        .copy(control.target)
        .add(offset.setFromSpherical(spherical));
      control.update();
    };
    canvas.addEventListener('keydown', handleKey);
    return () => canvas.removeEventListener('keydown', handleKey);
  }, [camera, gl]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      minDistance={24}
      maxDistance={115}
      enableDamping={false}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI - 0.1}
    />
  );
}

function SceneContent({
  snapshot,
  paths,
  labelElements,
}: {
  snapshot: Snapshot;
  paths: OrbitPaths;
  labelElements: LabelElements;
}) {
  const orbits = useExplorer((state) => state.orbits);
  const { gl, invalidate, setFrameloop } = useThree();
  useEffect(() => {
    const visibilityChanged = () => {
      setFrameloop(document.hidden ? 'never' : 'always');
      if (!document.hidden) invalidate();
    };
    const stopMenu = (event: Event) => event.preventDefault();
    document.addEventListener('visibilitychange', visibilityChanged);
    gl.domElement.addEventListener('contextmenu', stopMenu);
    return () => {
      document.removeEventListener('visibilitychange', visibilityChanged);
      gl.domElement.removeEventListener('contextmenu', stopMenu);
    };
  }, [gl, invalidate, setFrameloop]);
  const orbitLines = useMemo(
    () =>
      Object.entries(paths).map(([id, positions]) => ({
        id,
        points: positions.map(toScene),
      })),
    [paths],
  );

  return (
    <>
      <ambientLight intensity={0.32} />
      <pointLight
        position={[0, 0, 0]}
        intensity={2.6}
        decay={0}
      />
      <Starfield />
      {orbits &&
        orbitLines.map(({ id, points }) => (
          <Line
            key={id}
            points={points}
            color="#506983"
            transparent
            opacity={0.27}
            lineWidth={0.7}
          />
        ))}
      {BODIES.map((body) => (
        <Planet
          key={body.id}
          body={body}
          snapshot={snapshot}
        />
      ))}
      <BodyLabels
        snapshot={snapshot}
        elements={labelElements}
      />
      <CameraControls />
    </>
  );
}

export default function SolarScene({
  snapshot,
  paths,
}: {
  snapshot: Snapshot;
  paths: OrbitPaths;
}) {
  const [contextLost, setContextLost] = useState(false);
  const [generation, setGeneration] = useState(0);
  const selected = useExplorer((state) => state.selected);
  const labelElements = useRef<Partial<Record<BodyId, HTMLSpanElement>>>({});
  if (contextLost) {
    return (
      <div
        className="scene-fallback"
        role="status"
      >
        <h2>三维场景已中断</h2>
        <p>仍可通过天体列表查看资料和位置。</p>
        <button
          onClick={() => {
            setContextLost(false);
            setGeneration((value) => value + 1);
          }}
        >
          重新加载场景
        </button>
      </div>
    );
  }
  return (
    <div className="canvas-layer">
      <Canvas
        key={generation}
        camera={{ position: [0, 29, 38], fov: 50, near: 0.1, far: 450 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={(event) => {
          if (event.type === 'click') useExplorer.getState().select(null);
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            'webglcontextlost',
            (event) => {
              event.preventDefault();
              setContextLost(true);
            },
            { once: true },
          );
        }}
        fallback={
          <div className="scene-fallback">
            当前浏览器不支持 WebGL，请使用天体列表查看资料。
          </div>
        }
      >
        <Suspense fallback={null}>
          <SceneContent
            snapshot={snapshot}
            paths={paths}
            labelElements={labelElements}
          />
        </Suspense>
      </Canvas>
      <div
        className="scene-label-layer"
        aria-hidden="true"
      >
        {BODIES.map((body) => (
          <span
            key={body.id}
            ref={(element) => {
              if (element) labelElements.current[body.id] = element;
              else delete labelElements.current[body.id];
            }}
            className={
              selected === body.id ? 'body-label selected' : 'body-label'
            }
          >
            {body.name}
          </span>
        ))}
      </div>
    </div>
  );
}
