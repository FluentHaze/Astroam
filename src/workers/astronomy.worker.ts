import { calculateOrbits, calculateSnapshot } from '../domain/astronomy/engine';
import type {
  CalculationRequest,
  CalculationResponse,
} from '../domain/astronomy/types';

self.onmessage = ({ data }: MessageEvent<CalculationRequest>) => {
  let response: CalculationResponse;
  try {
    response =
      data.kind === 'orbits'
        ? {
            kind: 'orbits',
            sequence: data.sequence,
            paths: calculateOrbits(data.utcMs),
          }
        : {
            kind: 'positions',
            sequence: data.sequence,
            snapshot: calculateSnapshot(data.utcMs),
          };
  } catch (error) {
    response = {
      kind: 'error',
      sequence: data.sequence,
      message: error instanceof Error ? error.message : '天文计算失败',
    };
  }
  self.postMessage(response);
};
