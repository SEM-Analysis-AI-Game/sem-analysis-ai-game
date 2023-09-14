import { FrameCallback } from './renderer';
import { cursorToPixel, drawCircle } from './utils';
import * as THREE from 'three';

export type ToolName = 'brush' | 'eraser';

export type Tool = {
  name: ToolName;
  cursorOverlay: THREE.Texture;
  frameHandler: FrameCallback;
};

const kBrushSmoothingThreshold = 0.01;

export function circleBrush(radius: number, color: THREE.Color, alpha: number): Tool {
  const diameterPixels = radius * 2 - 1;
  const cursorOverlayTextureData = new Uint8Array(diameterPixels * diameterPixels * 4).fill(1.0);
  drawCircle(cursorOverlayTextureData, {
    pos: new THREE.Vector2(radius - 1, radius - 1),
    resolution: { width: diameterPixels, height: diameterPixels, top: 0, left: 0 },
    radius: radius,
    fillColor: color,
    alpha: alpha,
  });
  const cursorOverlayTexture = new THREE.DataTexture(cursorOverlayTextureData, 39, 39);
  cursorOverlayTexture.needsUpdate = true;
  return {
    name: 'brush',
    cursorOverlay: cursorOverlayTexture,
    frameHandler: ({ controls, drawingPoints, cursor, resolution }) => {
      if (controls.cursorDown) {
        drawCircle(drawingPoints, {
          pos: cursorToPixel(cursor.previous, resolution),
          resolution: resolution,
          radius: radius,
          fillColor: color,
          alpha: alpha,
        });
        const movement = cursor.current.clone().sub(cursor.previous);
        const movementLength = movement.length();
        const strides = movementLength / kBrushSmoothingThreshold;
        const step = movement.divideScalar(strides);
        for (let i = 0; i < strides; i++) {
          cursor.previous.add(step);
          drawCircle(drawingPoints, {
            pos: cursorToPixel(cursor.previous, resolution),
            resolution: resolution,
            radius: radius,
            fillColor: color,
            alpha: alpha,
          });
        }
      }
    },
  };
}
