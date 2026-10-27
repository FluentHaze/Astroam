import { useMemo, useSyncExternalStore } from 'react';
import {
  NoColorSpace,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from 'three';
import type { BodyId } from '../domain/astronomy/types';

export const PLANET_MAPS = {
  Sun: '/textures/sun.webp',
  Mercury: '/textures/mercury.webp',
  Venus: '/textures/venus.webp',
  Earth: '/textures/earth.webp',
  Moon: '/textures/moon.webp',
  Mars: '/textures/mars.webp',
  Jupiter: '/textures/jupiter.webp',
  Saturn: '/textures/saturn.webp',
  Uranus: '/textures/uranus.webp',
  Neptune: '/textures/neptune.webp',
} satisfies Record<BodyId, string>;

interface TextureState {
  texture: Texture | null;
  status: 'loading' | 'ready' | 'error';
}

interface TextureResource {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => TextureState;
  retry: () => void;
}

const resources = new Map<string, TextureResource>();

function resourceFor(url: string, isData: boolean): TextureResource {
  const key = url + ':' + isData;
  const existing = resources.get(key);
  if (existing) return existing;
  let state: TextureState = { texture: null, status: 'loading' };
  let pending: Texture | null = null;
  let generation = 0;
  let disposeTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: TextureState) => {
    state = next;
    for (const listener of listeners) listener();
  };
  const load = () => {
    const requestGeneration = ++generation;
    publish({ texture: null, status: 'loading' });
    const texture = new TextureLoader().load(
      url,
      (loaded) => {
        if (generation !== requestGeneration) {
          loaded.dispose();
          return;
        }
        pending = null;
        publish({ texture: loaded, status: 'ready' });
      },
      undefined,
      () => {
        if (generation !== requestGeneration) return;
        texture.dispose();
        pending = null;
        publish({ texture: null, status: 'error' });
      },
    );
    texture.colorSpace = isData ? NoColorSpace : SRGBColorSpace;
    texture.anisotropy = 4;
    pending = texture;
  };
  const resource: TextureResource = {
    getSnapshot: () => state,
    retry: () => {
      if (state.status === 'error') load();
    },
    subscribe: (listener) => {
      clearTimeout(disposeTimer);
      listeners.add(listener);
      if (!state.texture && !pending && state.status !== 'error') load();
      return () => {
        listeners.delete(listener);
        if (listeners.size) return;
        // Share scene and preview textures; allow StrictMode to resubscribe.
        disposeTimer = setTimeout(() => {
          generation++;
          pending?.dispose();
          state.texture?.dispose();
          pending = null;
          state = { texture: null, status: 'loading' };
        }, 1000);
      };
    },
  };
  resources.set(key, resource);
  return resource;
}

export function useTextureAsset(url: string, isData = false) {
  const resource = useMemo(() => resourceFor(url, isData), [url, isData]);
  const state = useSyncExternalStore(resource.subscribe, resource.getSnapshot);
  return { ...state, retry: resource.retry };
}
