import * as THREE from 'three';

export function cursorToPixel(cursor: THREE.Vector2, resolution: THREE.Vector2) {
  const cursorNormalized = new THREE.Vector2(cursor.x * 0.5 + 0.5, cursor.y * 0.5 + 0.5);
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
  params: { pos: THREE.Vector2; resolution: THREE.Vector2; fillColor: THREE.Color; alpha: number }
) => {
  const cursorPixelIndex = pixelToIndex(params.pos, params.resolution);
  data[cursorPixelIndex] = params.fillColor.r * 255;
  data[cursorPixelIndex + 1] = params.fillColor.g * 255;
  data[cursorPixelIndex + 2] = params.fillColor.b * 255;
  data[cursorPixelIndex + 3] = params.alpha * 255;
};
