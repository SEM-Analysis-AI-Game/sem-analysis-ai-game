import * as THREE from 'three';
import { draw, drawCircle } from './utils';
import { Tool } from '../tool';
import { FrameCallbackParams } from '../../renderer';

export function circleBrush(radius: number, color: THREE.Color, alpha: number): Tool<'Circle Brush'> {
  const diameterPixels = radius * 2 - 1;
  const cursorOverlayTextureData = new Uint8Array(diameterPixels * diameterPixels * 4).fill(1.0);
  drawCircle(cursorOverlayTextureData, {
    radius,
    pos: new THREE.Vector2(radius - 1, radius - 1),
    resolution: new THREE.Vector2(diameterPixels, diameterPixels),
    fillPoint: () => ({ color, alpha }),
  });
  const cursorOverlayTexture = new THREE.DataTexture(cursorOverlayTextureData, diameterPixels, diameterPixels);
  cursorOverlayTexture.needsUpdate = true;
  return {
    name: 'Circle Brush',
    cursorOverlay: cursorOverlayTexture,
    frameHandler: (params: FrameCallbackParams) => {
      draw({ ...params }, pos => {
        drawCircle(params.drawingPoints, {
          radius,
          pos,
          resolution: params.resolution,
          fillPoint: () => ({ color, alpha }),
        });
      });
    },
  };
}
