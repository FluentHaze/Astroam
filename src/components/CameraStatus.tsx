import { BODY_BY_ID } from '../data/bodies';
import { useExplorer } from '../state/store';

export function CameraStatus() {
  const mode = useExplorer((state) => state.cameraMode);
  const target = useExplorer((state) => state.cameraTarget);
  if (!target || (mode !== 'following' && mode !== 'focused')) return null;
  const following = mode === 'following';
  return (
    <div className="camera-status panel">
      <span role="status">{`${following ? '正在跟随' : '已聚焦'} · ${BODY_BY_ID[target].name}`}</span>
      {following && (
        <button onClick={() => useExplorer.getState().releaseCamera()}>
          退出跟随
        </button>
      )}
      <button onClick={() => useExplorer.getState().resetCamera()}>
        返回总览
      </button>
    </div>
  );
}
