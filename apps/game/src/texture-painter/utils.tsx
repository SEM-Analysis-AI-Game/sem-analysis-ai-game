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
  for (let i = -params.radius + 1; i < params.radius; i++) {
    for (let j = -params.radius + 1; j < params.radius; j++) {
      if (i * i + j * j <= params.radius * params.radius) {
        fillPixel(data, { ...params, pos: new THREE.Vector2(params.pos.x + i, params.pos.y + j) });
      }
    }
  }
};
