import * as THREE from 'three';
import { draw, drawCircle } from './utils';
import { Tool } from '../tool';
import { pixelToIndex } from '../utils';
import { FrameCallbackParams } from '../../renderer';

export function circleEraser(radius: number, strength: number): Tool<'Circle Eraser'> {
  const diameterPixels = radius * 2 - 1;
  const cursorOverlayTextureData = new Uint8Array(diameterPixels * diameterPixels * 4).fill(1.0);
  drawCircle(cursorOverlayTextureData, {
    radius,
    pos: new THREE.Vector2(radius - 1, radius - 1),
    resolution: new THREE.Vector2(diameterPixels, diameterPixels),
    fillPoint: () => ({ color: new THREE.Color(0, 0, 0), alpha: 1.0 }),
  });
  drawCircle(cursorOverlayTextureData, {
    pos: new THREE.Vector2(radius - 1, radius - 1),
    resolution: new THREE.Vector2(diameterPixels, diameterPixels),
    radius: radius - 1,
    fillPoint: () => ({ color: new THREE.Color(0, 0, 0), alpha: 0.0 }),
  });
  const cursorOverlayTexture = new THREE.DataTexture(cursorOverlayTextureData, diameterPixels, diameterPixels);
  cursorOverlayTexture.needsUpdate = true;
  return {
    name: 'Circle Eraser',
    cursorOverlay: cursorOverlayTexture,
    frameHandler: (params: FrameCallbackParams) => {
      draw({ ...params }, pos => {
        drawCircle(params.drawingPoints, {
          radius,
          pos,
          resolution: params.resolution,
          fillPoint: pos => {
            const index = pixelToIndex(pos, params.resolution);
            const newAlpha = Math.max(params.drawingPoints[index + 3] / 255.0 - strength * params.delta, 0.0);
            if (newAlpha === 0.0) {
              return { color: new THREE.Color(0, 0, 0), alpha: 0.0 };
            } else {
              return {
                color: new THREE.Color(
                  params.drawingPoints[index] / 255.0,
                  params.drawingPoints[index + 1] / 255.0,
                  params.drawingPoints[index + 2] / 255.0
                ),
                alpha: newAlpha,
              };
            }
          },
        });
      });
    },
  };
}
