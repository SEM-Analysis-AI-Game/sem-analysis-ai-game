import * as THREE from 'three';
import { draw, drawSquare } from './utils';
import { Tool } from '../tool';
import { FrameCallbackParams } from '../../renderer';

export function squareBrush(length: number, color: THREE.Color, alpha: number): Tool<'Square Brush'> {
  const cursorOverlayTextureData = new Uint8Array(length * length * 4).fill(1.0);
  drawSquare(cursorOverlayTextureData, {
    length,
    pos: new THREE.Vector2(length / 2, length / 2),
    resolution: new THREE.Vector2(length, length),
    fillPoint: () => ({ color, alpha }),
  });
  const cursorOverlayTexture = new THREE.DataTexture(cursorOverlayTextureData, length, length);
  cursorOverlayTexture.needsUpdate = true;
  return {
    name: 'Square Brush',
    cursorOverlay: cursorOverlayTexture,
    frameHandler: (params: FrameCallbackParams) => {
      draw({ ...params }, pos => {
        drawSquare(params.drawingPoints, {
          length,
          pos,
          resolution: params.resolution,
          fillPoint: () => ({ color, alpha }),
        });
      });
    },
  };
}
