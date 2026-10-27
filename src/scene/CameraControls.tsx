import { useEffect, useRef, type ComponentRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Spherical, Vector3 } from 'three';
import { BODIES, BODY_BY_ID } from '../data/bodies';
import { bodyScenePosition } from '../domain/astronomy/display';
import type { Snapshot } from '../domain/astronomy/types';
import { useExplorer } from '../state/store';
import { useReducedMotion } from '../components/useReducedMotion';

const HOME_POSITION = new Vector3(0, 29, 38);
interface CameraTransition {
  fromPosition: Vector3;
  fromTarget: Vector3;
  destination: Vector3;
  offset: Vector3;
  elapsed: number;
}

export function CameraControls({ snapshot }: { snapshot: Snapshot }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, gl } = useThree();
  const reducedMotion = useReducedMotion();
  const runtime = useRef({
    token: -1,
    updating: false,
    expectedTarget: new Vector3(),
    transition: null as CameraTransition | null,
  });

  useFrame((_, delta) => {
    const control = controls.current;
    if (!control) return;
    const state = useExplorer.getState();
    const current = runtime.current;
    if (state.resetToken !== current.token) {
      current.token = state.resetToken;
      const destination = state.cameraTarget
        ? new Vector3(...bodyScenePosition(state.cameraTarget, snapshot))
        : new Vector3();
      let offset = HOME_POSITION.clone();
      if (state.cameraTarget) {
        const body = BODY_BY_ID[state.cameraTarget];
        const distance = Math.max(2.2, body.displayRadius * 6);
        offset = camera.position
          .clone()
          .sub(control.target)
          .normalize()
          .multiplyScalar(distance);
      }
      current.transition = {
        fromPosition: camera.position.clone(),
        fromTarget: control.target.clone(),
        destination,
        offset,
        elapsed: 0,
      };
    }
    current.updating = true;
    if (state.cameraMode === 'free') current.transition = null;
    control.minDistance = state.cameraTarget
      ? Math.max(0.65, BODY_BY_ID[state.cameraTarget].displayRadius * 1.5)
      : 0.65;
    const transition = current.transition;
    if (transition) {
      transition.elapsed += Math.min(delta, 0.05);
      if (state.cameraMode === 'following' && state.cameraTarget) {
        transition.destination.set(
          ...bodyScenePosition(state.cameraTarget, snapshot),
        );
      }
      const progress = reducedMotion
        ? 1
        : Math.min(transition.elapsed / 0.5, 1);
      const eased = 1 - (1 - progress) ** 3;
      camera.position.lerpVectors(
        transition.fromPosition,
        transition.destination.clone().add(transition.offset),
        eased,
      );
      control.target.lerpVectors(
        transition.fromTarget,
        transition.destination,
        eased,
      );
      if (progress === 1) current.transition = null;
    } else if (state.cameraMode === 'following' && state.cameraTarget) {
      const target = new Vector3(
        ...bodyScenePosition(state.cameraTarget, snapshot),
      );
      camera.position.add(target.clone().sub(current.expectedTarget));
      control.target.copy(target);
    }
    // The overview uses a compressed scale; keep the camera outside every body.
    for (const body of BODIES) {
      const center = new Vector3(...bodyScenePosition(body.id, snapshot));
      const offset = camera.position.clone().sub(center);
      const minimum = body.displayRadius * 1.25;
      if (offset.lengthSq() < minimum * minimum) {
        if (offset.lengthSq() < 0.000001) offset.set(0, 0.5, 1);
        camera.position
          .copy(center)
          .add(offset.normalize().multiplyScalar(minimum));
      }
    }
    control.update();
    current.expectedTarget.copy(control.target);
    current.updating = false;
  });

  useEffect(() => {
    const control = controls.current;
    if (!control) return;
    const onStart = () => {
      if (!runtime.current.transition) return;
      runtime.current.transition = null;
      useExplorer.getState().releaseCamera();
    };
    const onChange = () => {
      const current = runtime.current;
      if (current.updating) return;
      if (control.target.distanceToSquared(current.expectedTarget) > 0.000001) {
        if (useExplorer.getState().cameraMode === 'following')
          useExplorer.getState().releaseCamera();
      }
      current.expectedTarget.copy(control.target);
    };
    control.addEventListener('start', onStart);
    control.addEventListener('change', onChange);
    const canvas = gl.domElement;
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute(
      'aria-label',
      '太阳系三维场景，方向键旋转，加减键缩放，Home 重置视角',
    );
    const handleKey = (event: KeyboardEvent) => {
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
      onStart();
      const offset = camera.position.clone().sub(control.target);
      const spherical = new Spherical().setFromVector3(offset);
      if (event.key === 'ArrowLeft') spherical.theta -= 0.08;
      if (event.key === 'ArrowRight') spherical.theta += 0.08;
      if (event.key === 'ArrowUp') spherical.phi -= 0.08;
      if (event.key === 'ArrowDown') spherical.phi += 0.08;
      if (event.key === '+' || event.key === '=') spherical.radius *= 0.9;
      if (event.key === '-') spherical.radius *= 1.1;
      spherical.radius = Math.max(
        control.minDistance,
        Math.min(115, spherical.radius),
      );
      spherical.makeSafe();
      camera.position
        .copy(control.target)
        .add(offset.setFromSpherical(spherical));
      control.update();
    };
    canvas.addEventListener('keydown', handleKey);
    return () => {
      canvas.removeEventListener('keydown', handleKey);
      control.removeEventListener('start', onStart);
      control.removeEventListener('change', onChange);
    };
  }, [camera, gl]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      minDistance={0.65}
      maxDistance={115}
      enableDamping={false}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI - 0.1}
    />
  );
}
