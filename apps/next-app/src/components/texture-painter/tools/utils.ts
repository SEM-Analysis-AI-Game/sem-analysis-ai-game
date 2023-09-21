import * as THREE from "three";
import { FrameCallbackParams } from "../renderer";

export function cursorToPixel(
  cursor: THREE.Vector2,
  resolution: THREE.Vector2
) {
  const cursorNormalized = new THREE.Vector2(
    cursor.x * 0.5 + 0.5,
    cursor.y * 0.5 + 0.5
  );
  return new THREE.Vector2(
    Math.floor(cursorNormalized.x * resolution.width),
    Math.floor(cursorNormalized.y * resolution.height)
  );
}

export function pixelToIndex(pos: THREE.Vector2, resolution: THREE.Vector2) {
  return (pos.y * resolution.width + pos.x) * 4;
}

export const fillPixel = (
  data: Uint8Array,
  params: {
    pos: THREE.Vector2;
    resolution: THREE.Vector2;
    fillColor: THREE.Color;
    alpha: number;
  }
) => {
  const cursorPixelIndex = pixelToIndex(params.pos, params.resolution);
  data[cursorPixelIndex] = params.fillColor.r * 255;
  data[cursorPixelIndex + 1] = params.fillColor.g * 255;
  data[cursorPixelIndex + 2] = params.fillColor.b * 255;
  data[cursorPixelIndex + 3] = params.alpha * 255;
};

const kBrushSmoothingThreshold = 2;

export const smoothPaint: (
  params: FrameCallbackParams,
  paint: (pos: THREE.Vector2) => void
) => void = ({ controls, resolution, cursor }, paint) => {
  if (controls.cursorDown) {
    const currentPixel = cursorToPixel(cursor.current, resolution);
    paint(currentPixel);
    const previousPixel = cursorToPixel(cursor.previous, resolution);
    const movement = currentPixel.clone().sub(previousPixel);
    const movementLength = movement.length();
    const strides = movementLength / kBrushSmoothingThreshold;
    const step = movement.divideScalar(strides);
    for (let i = 0; i < strides; i++) {
      previousPixel.add(step);
      paint(
        new THREE.Vector2(
          Math.round(previousPixel.x),
          Math.round(previousPixel.y)
        )
      );
    }
  }
};

export const drawCircle = (
  data: Uint8Array,
  params: {
    pos: THREE.Vector2;
    diameter: number;
    resolution: THREE.Vector2;
    fillPoint: (pos: THREE.Vector2) => { color: THREE.Color; alpha: number };
  }
) => {
  const radius = Math.floor((params.diameter + 1) / 2);
  const minX = Math.max(-radius + 1, -params.pos.x);
  const minY = Math.max(-radius + 1, -params.pos.y);
  const maxX = Math.min(radius, params.resolution.width - params.pos.x);
  const maxY = Math.min(radius, params.resolution.height - params.pos.y);
  for (let x = minX; x < maxX; x++) {
    for (let y = minY; y < maxY; y++) {
      if (x * x + y * y <= radius * radius) {
        const pos = new THREE.Vector2(params.pos.x + x, params.pos.y + y);
        const fill = params.fillPoint(pos);
        fillPixel(data, {
          ...params,
          pos,
          fillColor: fill.color,
          alpha: fill.alpha,
        });
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
  const maxX = Math.min(
    params.length / 2,
    params.resolution.width - params.pos.x
  );
  const maxY = Math.min(
    params.length / 2,
    params.resolution.height - params.pos.y
  );
  for (let x = minX; x < maxX; x++) {
    for (let y = minY; y < maxY; y++) {
      const pos = new THREE.Vector2(params.pos.x + x, params.pos.y + y);
      const fill = params.fillPoint(pos);
      fillPixel(data, {
        ...params,
        pos,
        fillColor: fill.color,
        alpha: fill.alpha,
      });
    }
  }
};
