import * as THREE from "three";
import { kSubdivisions } from "../shaders";

export function cursorToPixel(
  cursor: THREE.Vector2,
  resolution: THREE.Vector2
) {
  return cursor
    .clone()
    .multiplyScalar(0.5)
    .addScalar(0.5)
    .multiply(resolution)
    .floor();
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

export function smoothPaint(
  resolution: THREE.Vector2,
  currentPixel: THREE.Vector2,
  previousPixel: THREE.Vector2,
  brushSize: number,
  paint: (pos: THREE.Vector2) => Set<number>
): Set<number> {
  const changedSections = new Set<number>();
  const movement = currentPixel.clone().sub(previousPixel);
  const movementLength = Math.round(movement.length());
  const step = movement
    .normalize()
    .multiplyScalar(brushSize / 3)
    .clampLength(0, movementLength);
  const bound = new THREE.Vector2(resolution.width - 1, resolution.height - 1);
  const current = previousPixel.clone();
  for (let i = 0; i < movementLength; i += step.length()) {
    const ceil = current.clone().ceil();
    paint(ceil).forEach((index) => changedSections.add(index));
    current.add(step).clamp(new THREE.Vector2(), bound);
  }
  return changedSections;
}

function drawCircle(params: {
  fill: (pos: THREE.Vector2) => void;
  pos: THREE.Vector2;
  diameter: number;
  resolution: THREE.Vector2;
  color: THREE.Color;
  alpha: number;
}) {
  const radius = Math.floor((params.diameter + 1) / 2);
  const minX = Math.max(-radius + 1, -params.pos.x);
  const minY = Math.max(-radius + 1, -params.pos.y);
  const maxX = Math.min(radius, params.resolution.width - params.pos.x);
  const maxY = Math.min(radius, params.resolution.height - params.pos.y);
  for (let x = minX; x < maxX; x++) {
    for (let y = minY; y < maxY; y++) {
      if (x * x + y * y <= radius * radius) {
        const pos = new THREE.Vector2(params.pos.x + x, params.pos.y + y);
        params.fill(pos);
      }
    }
  }
}

export function drawCircleDirect(
  data: Uint8Array,
  pos: THREE.Vector2,
  diameter: number,
  resolution: THREE.Vector2,
  color: THREE.Color,
  alpha: number
) {
  drawCircle({
    fill: (pos) => {
      fillPixel(data, {
        pos,
        resolution,
        fillColor: color,
        alpha,
      });
    },
    pos,
    diameter,
    resolution,
    color,
    alpha,
  });
}

export function drawCircleLayered(
  drawings: Uint8Array[],
  pos: THREE.Vector2,
  diameter: number,
  resolution: THREE.Vector2,
  color: THREE.Color,
  alpha: number
): Set<number> {
  const changedSections = new Set<number>();
  drawCircle({
    fill: (pos) => {
      const { section, subPos } = toSubdivision(pos, resolution);
      changedSections.add(section);
      fillPixel(drawings[section], {
        pos: subPos,
        resolution: resolution.clone().divideScalar(kSubdivisions + 1),
        fillColor: color,
        alpha,
      });
    },
    pos,
    diameter,
    resolution,
    color,
    alpha,
  });
  return changedSections;
}

function drawSquare(params: {
  fill: (pos: THREE.Vector2) => void;
  pos: THREE.Vector2;
  length: number;
  resolution: THREE.Vector2;
  color: THREE.Color;
  alpha: number;
}) {
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
      params.fill(pos);
    }
  }
}

export function drawSquareDirect(
  data: Uint8Array,
  pos: THREE.Vector2,
  length: number,
  resolution: THREE.Vector2,
  color: THREE.Color,
  alpha: number
) {
  drawSquare({
    fill: (pos) => {
      fillPixel(data, {
        pos,
        resolution,
        fillColor: color,
        alpha,
      });
    },
    pos,
    length,
    resolution,
    color,
    alpha,
  });
}

export function drawSquareLayered(
  drawings: Uint8Array[],
  pos: THREE.Vector2,
  length: number,
  resolution: THREE.Vector2,
  color: THREE.Color,
  alpha: number
): Set<number> {
  const changedSections = new Set<number>();
  drawSquare({
    fill: (pos) => {
      const { section, subPos } = toSubdivision(pos, resolution);
      changedSections.add(section);
      fillPixel(drawings[section], {
        pos: subPos,
        resolution: resolution.clone().divideScalar(kSubdivisions + 1),
        fillColor: color,
        alpha,
      });
    },
    pos,
    length,
    resolution,
    color,
    alpha,
  });
  return changedSections;
}

export function toSubdivision(
  pos: THREE.Vector2,
  resolution: THREE.Vector2
): { section: number; subPos: THREE.Vector2 } {
  const sectionSize = resolution.clone().divideScalar(kSubdivisions + 1);
  const section = new THREE.Vector2(
    Math.floor(pos.x / sectionSize.x),
    Math.floor(pos.y / sectionSize.y)
  );
  const subPos = pos.clone().sub(section.clone().multiply(sectionSize));
  return { section: section.y * (kSubdivisions + 1) + section.x, subPos };
}
