import { FrameCallbackParams } from '../../renderer';
import { cursorToPixel, fillPixel } from '../utils';
import * as THREE from 'three';

const kBrushSmoothingThreshold = 0.01;

export const draw: (params: FrameCallbackParams, paint: (pos: THREE.Vector2) => void) => void = (
  { controls, resolution, cursor },
  paint
) => {
  if (controls.cursorDown) {
    paint(cursorToPixel(cursor.current, resolution));
    const movement = cursor.current.clone().sub(cursor.previous);
    const movementLength = movement.length();
    const strides = movementLength / kBrushSmoothingThreshold;
    const step = movement.divideScalar(strides);
    for (let i = 0; i < strides; i++) {
      cursor.previous.add(step);
      paint(cursorToPixel(cursor.previous, resolution));
    }
  }
};

export const drawCircle = (
  data: Uint8Array,
  params: {
    pos: THREE.Vector2;
    radius: number;
    resolution: THREE.Vector2;
    fillPoint: (pos: THREE.Vector2) => { color: THREE.Color; alpha: number };
  }
) => {
  const minX = Math.max(-params.radius + 1, -params.pos.x);
  const minY = Math.max(-params.radius + 1, -params.pos.y);
  const maxX = Math.min(params.radius, params.resolution.width - params.pos.x);
  const maxY = Math.min(params.radius, params.resolution.height - params.pos.y);
  for (let x = minX; x < maxX; x++) {
    for (let y = minY; y < maxY; y++) {
      if (x * x + y * y <= params.radius * params.radius) {
        const pos = new THREE.Vector2(params.pos.x + x, params.pos.y + y);
        const fill = params.fillPoint(pos);
        fillPixel(data, { ...params, pos, fillColor: fill.color, alpha: fill.alpha });
      }
    }
  }
};

export const drawSquare = (
  data: Uint8Array,
  params: {
    pos: THREE.Vector2;
    length: number;
    resolution: THREE.Vector2;
    fillPoint: (pos: THREE.Vector2) => { color: THREE.Color; alpha: number };
  }
) => {
  const minX = Math.max(-params.length / 2, -params.pos.x);
  const minY = Math.max(-params.length / 2, -params.pos.y);
  const maxX = Math.min(params.length / 2, params.resolution.width - params.pos.x);
  const maxY = Math.min(params.length / 2, params.resolution.height - params.pos.y);
  for (let x = minX; x < maxX; x++) {
    for (let y = minY; y < maxY; y++) {
      const pos = new THREE.Vector2(params.pos.x + x, params.pos.y + y);
      const fill = params.fillPoint(pos);
      fillPixel(data, { ...params, pos, fillColor: fill.color, alpha: fill.alpha });
    }
  }
};
