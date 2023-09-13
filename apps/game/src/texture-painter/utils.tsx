import * as THREE from 'three';
import { Size } from '@react-three/fiber';

export function cursorToPixel(cursor: THREE.Vector2, resolution: Size) {
  const cursorNormalized = new THREE.Vector2(cursor.x * 0.5 + 0.5, cursor.y * 0.5 + 0.5);
  return new THREE.Vector2(
    Math.floor(cursorNormalized.x * resolution.width),
    Math.floor(cursorNormalized.y * resolution.height)
  );
}

export const fillPixel = (
  data: Uint8Array,
  params: { pos: THREE.Vector2; resolution: Size; fillColor: THREE.Color; alpha: number }
) => {
  const cursorPixelIndex = (params.pos.y * params.resolution.width + params.pos.x) * 4;
  data[cursorPixelIndex] = params.fillColor.r * 255;
  data[cursorPixelIndex + 1] = params.fillColor.g * 255;
  data[cursorPixelIndex + 2] = params.fillColor.b * 255;
  data[cursorPixelIndex + 3] = params.alpha * 255;
};

export const drawCircle = (
  data: Uint8Array,
  params: { pos: THREE.Vector2; radius: number; resolution: Size; fillColor: THREE.Color; alpha: number }
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
