import { useEffect, useRef, useState } from 'react';
import type {
  CalculationResponse,
  OrbitPaths,
  Snapshot,
} from '../domain/astronomy/types';
import { useExplorer } from '../state/store';

export function useAstronomy() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [paths, setPaths] = useState<OrbitPaths>({});
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/astronomy.worker.ts', import.meta.url),
      { type: 'module' },
    );
    let lastTick = performance.now();
    let requestedTime = NaN;
    let latestPositionSequence = 0;
    let failed = false;
    worker.onmessage = ({ data }: MessageEvent<CalculationResponse>) => {
      if (data.kind === 'error') {
        failed = true;
        setError(data.message);
        setSnapshot(null);
      } else if (data.kind === 'orbits') {
        setPaths(data.paths);
      } else if (data.sequence === latestPositionSequence) {
        setSnapshot(data.snapshot);
        setError('');
      }
    };
    worker.onerror = () => {
      failed = true;
      setError('计算线程无法启动，请重试或刷新页面');
      setSnapshot(null);
    };
    const update = () => {
      const current = performance.now();
      if (document.hidden) {
        lastTick = current;
        return;
      }
      useExplorer.getState().tick(current - lastTick, Date.now());
      lastTick = current;
      const utcMs = useExplorer.getState().utcMs;
      if (requestedTime === utcMs || failed) return;
      requestedTime = utcMs;
      latestPositionSequence = ++sequence.current;
      worker.postMessage({
        kind: 'positions',
        sequence: latestPositionSequence,
        utcMs,
      });
    };
    const visibilityChanged = () => {
      lastTick = performance.now();
      if (!document.hidden) update();
    };
    worker.postMessage({
      kind: 'orbits',
      sequence: ++sequence.current,
      utcMs: useExplorer.getState().utcMs,
    });
    update();
    const interval = window.setInterval(update, 80);
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', visibilityChanged);
      worker.terminate();
    };
  }, [retryToken]);

  return {
    snapshot,
    paths,
    error,
    retry: () => setRetryToken((value) => value + 1),
  };
}
