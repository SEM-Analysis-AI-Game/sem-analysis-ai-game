import { FrameCallback, FrameCallbackParams } from './renderer';
import { cursorToPixel, fillPixel } from './utils';
import * as THREE from 'three';

export type ToolName = 'brush' | 'eraser';

export type Tool = {
  name: ToolName;
  cursorOverlay: THREE.Texture;
  frameHandler: FrameCallback;
};

const kBrushSmoothingThreshold = 0.01;

const drawCircle = (
  data: Uint8Array,
  params: { pos: THREE.Vector2; radius: number; resolution: THREE.Vector2; fillColor: THREE.Color; alpha: number }
) => {
  const minX = Math.max(-params.radius + 1, -params.pos.x);
  const minY = Math.max(-params.radius + 1, -params.pos.y);
  const maxX = Math.min(params.radius, params.resolution.width - params.pos.x);
  const maxY = Math.min(params.radius, params.resolution.height - params.pos.y);
  for (let x = minX; x < maxX; x++) {
    for (let y = minY; y < maxY; y++) {
      if (x * x + y * y <= params.radius * params.radius) {
        fillPixel(data, { ...params, pos: new THREE.Vector2(params.pos.x + x, params.pos.y + y) });
      }
    }
  }
};

const draw: (params: FrameCallbackParams & { radius: number; color: THREE.Color; alpha: number }) => void = ({
  controls,
  drawingPoints,
  resolution,
  cursor,
  alpha,
  color,
  radius,
}) => {
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
};

export function circleBrush(radius: number, color: THREE.Color, alpha: number): Tool {
  const diameterPixels = radius * 2 - 1;
  const cursorOverlayTextureData = new Uint8Array(diameterPixels * diameterPixels * 4).fill(1.0);
  drawCircle(cursorOverlayTextureData, {
    pos: new THREE.Vector2(radius - 1, radius - 1),
    resolution: new THREE.Vector2(diameterPixels, diameterPixels),
    radius: radius,
    fillColor: color,
    alpha: alpha,
  });
  const cursorOverlayTexture = new THREE.DataTexture(cursorOverlayTextureData, 39, 39);
  cursorOverlayTexture.needsUpdate = true;
  return {
    name: 'brush',
    cursorOverlay: cursorOverlayTexture,
    frameHandler: (params: FrameCallbackParams) => {
      draw({ ...params, radius, alpha, color });
    },
  };
}

export function eraserBrush(radius: number): Tool {
  const diameterPixels = radius * 2 - 1;
  const cursorOverlayTextureData = new Uint8Array(diameterPixels * diameterPixels * 4).fill(1.0);
  drawCircle(cursorOverlayTextureData, {
    pos: new THREE.Vector2(radius - 1, radius - 1),
    resolution: new THREE.Vector2(diameterPixels, diameterPixels),
    radius: radius,
    fillColor: new THREE.Color(0, 0, 0),
    alpha: 0.0,
  });
  drawCircle(cursorOverlayTextureData, {
    pos: new THREE.Vector2(radius - 1, radius - 1),
    resolution: new THREE.Vector2(diameterPixels, diameterPixels),
    radius: radius - 1,
    fillColor: new THREE.Color(1.0, 1.0, 1.0),
    alpha: 0.2,
  });
  const cursorOverlayTexture = new THREE.DataTexture(cursorOverlayTextureData, 39, 39);
  cursorOverlayTexture.needsUpdate = true;
  return {
    name: 'eraser',
    cursorOverlay: cursorOverlayTexture,
    frameHandler: (params: FrameCallbackParams) => {
      draw({ ...params, radius, color: new THREE.Color(0, 0, 0), alpha: 0.0 });
    },
  };
}
