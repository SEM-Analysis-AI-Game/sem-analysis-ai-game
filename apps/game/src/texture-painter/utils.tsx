import * as THREE from 'three';
import { Size } from '@react-three/fiber';

export function mouseToPixel(mouse: THREE.Vector2, resolution: Size) {
  const mouseNormalized = new THREE.Vector2(mouse.x * 0.5 + 0.5, mouse.y * 0.5 + 0.5);
  return new THREE.Vector2(
    Math.floor(mouseNormalized.x * resolution.width),
    Math.floor(mouseNormalized.y * resolution.height)
  );
}

export const fillPixel = (
  data: Uint8Array,
  params: { pos: THREE.Vector2; resolution: Size; fillColor: THREE.Color; alpha: number }
) => {
  const mousePixelIndex = (params.pos.y * params.resolution.width + params.pos.x) * 4;
  data[mousePixelIndex] = params.fillColor.r * 255;
  data[mousePixelIndex + 1] = params.fillColor.g * 255;
  data[mousePixelIndex + 2] = params.fillColor.b * 255;
  data[mousePixelIndex + 3] = params.alpha * 255;
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
