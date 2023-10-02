import * as THREE from "three";

function pixelToIndex(pos: THREE.Vector2, resolution: THREE.Vector2) {
  return (pos.y * resolution.width + pos.x) * 4;
}

export const fillPixel = (
  data: Uint8Array,
  resolution: THREE.Vector2,
  pos: THREE.Vector2,
  fillColor: THREE.Color,
  alpha: number
) => {
  const cursorPixelIndex = pixelToIndex(pos, resolution);
  data[cursorPixelIndex] = fillColor.r * 255;
  data[cursorPixelIndex + 1] = fillColor.g * 255;
  data[cursorPixelIndex + 2] = fillColor.b * 255;
  data[cursorPixelIndex + 3] = alpha * 255;
};

export function createCirclePointsInCircle(diameter: number): THREE.Vector2[] {
  const radius = Math.floor((diameter + 1) / 2);
  const points: THREE.Vector2[] = [];
  for (let x = -radius; x < radius; x++) {
    for (let y = -radius; y < radius; y++) {
      if (x * x + y * y <= radius * radius) {
        points.push(new THREE.Vector2(x, y));
      }
    }
  }
  return points;
}

export function drawCircle(params: {
  fill: (pos: THREE.Vector2) => void;
  pos: THREE.Vector2;
  diameter: number;
  resolution: THREE.Vector2;
  memoizedPoints: THREE.Vector2[];
}) {
  const radius = Math.floor((params.diameter + 1) / 2);
  const minX = Math.max(-radius + 1, -params.pos.x);
  const minY = Math.max(-radius + 1, -params.pos.y);
  const maxX = Math.min(radius, params.resolution.width - params.pos.x);
  const maxY = Math.min(radius, params.resolution.height - params.pos.y);
  for (let point of params.memoizedPoints) {
    if (
      point.x >= minX &&
      point.x < maxX &&
      point.y >= minY &&
      point.y < maxY
    ) {
      const pos = new THREE.Vector2(
        params.pos.x + point.x,
        params.pos.y + point.y
      );
      params.fill(pos);
    }
  }
}

export function drawSquare(params: {
  fill: (pos: THREE.Vector2) => void;
  pos: THREE.Vector2;
  length: number;
  resolution: THREE.Vector2;
}) {
  const halfLength = Math.floor(params.length / 2);
  const minX = Math.max(-halfLength, -params.pos.x);
  const minY = Math.max(-halfLength, -params.pos.y);
  const maxX = Math.min(halfLength, params.resolution.width - params.pos.x);
  const maxY = Math.min(halfLength, params.resolution.height - params.pos.y);
  for (let x = minX; x < maxX; x++) {
    for (let y = minY; y < maxY; y++) {
      const pos = new THREE.Vector2(params.pos.x + x, params.pos.y + y);
      params.fill(pos);
    }
  }
}
