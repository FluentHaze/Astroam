import { Component, memo, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import type { BodyInfo } from '../domain/astronomy/types';
import { PlanetModel } from '../scene/PlanetModel';
import { PLANET_MAPS, useTextureAsset } from '../scene/planetTexture';

class PreviewBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return <span className="preview-unavailable">三维预览暂不可用</span>;
    return this.props.children;
  }
}

export default memo(function BodyPreview({ body }: { body: BodyInfo }) {
  const { status, retry } = useTextureAsset(PLANET_MAPS[body.id]);
  const isSaturn = body.id === 'Saturn';
  let caption = '表面贴图预览 · 非实时影像';
  if (body.id === 'Venus') caption = '金星地表示意 · 云层下方';
  if (status === 'loading') caption = '正在加载表面细节…';
  return (
    <div
      className="planet-preview"
      aria-label={`${body.name}贴图预览`}
    >
      <PreviewBoundary>
        <Canvas
          frameloop="demand"
          camera={{ position: [0, 0.12, 4], fov: 42 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
          fallback={
            <span className="preview-unavailable">三维预览暂不可用</span>
          }
          style={{ pointerEvents: 'none', position: 'absolute', inset: 0 }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[-3, 3, 4]}
            intensity={2.1}
          />
          <PlanetModel
            body={body}
            radius={isSaturn ? 0.7 : 0.95}
          />
        </Canvas>
      </PreviewBoundary>
      <span
        className="preview-cross cross-one"
        aria-hidden="true"
      >
        +
      </span>
      <span
        className="preview-cross cross-two"
        aria-hidden="true"
      >
        +
      </span>
      {status === 'error' ? (
        <button
          className="preview-retry"
          onClick={retry}
        >
          贴图加载失败，点击重试
        </button>
      ) : (
        <span className="preview-caption">{caption}</span>
      )}
    </div>
  );
});
