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

export const smoothPaint: (
  params: FrameCallbackParams,
  paint: (pos: THREE.Vector2) => void,
  color: THREE.Color,
  alpha: number,
  size: number
) => void = (
  { controls, resolution, cursor, data },
  paint,
  color,
  alpha,
  size
) => {
  if (controls.cursorDown) {
    cursor.current.clampScalar(-1, 1);
    const currentPixel = cursorToPixel(cursor.current, resolution);
    paint(currentPixel);
    const previousPixel = cursorToPixel(cursor.previous, resolution).clamp(
      new THREE.Vector2(),
      new THREE.Vector2(resolution.width - 1, resolution.height - 1)
    );
    const movement = currentPixel.clone().sub(previousPixel);
    const movementLength = Math.round(movement.length());
    const step = movement.normalize();
    const perpindicular = step
      .clone()
      .rotateAround(new THREE.Vector2(), Math.PI / 2);
    for (let i = 0; i < movementLength; i++) {
      fillPixel(data, {
        pos: previousPixel.clone().ceil(),
        resolution,
        fillColor: color,
        alpha: alpha,
      });
      fillPixel(data, {
        pos: previousPixel.clone().floor(),
        resolution,
        fillColor: color,
        alpha: alpha,
      });
      previousPixel
        .add(step)
        .clamp(
          new THREE.Vector2(),
          new THREE.Vector2(resolution.width - 1, resolution.height - 1)
        );
      const left = previousPixel.clone();
      const right = previousPixel.clone();
      for (let j = 0; j < size / 2; j++) {
        if (
          left.x > 0 &&
          left.x < resolution.width &&
          left.y > 0 &&
          left.y < resolution.height
        ) {
          left
            .add(perpindicular)
            .clamp(
              new THREE.Vector2(),
              new THREE.Vector2(resolution.width - 1, resolution.height - 1)
            );
          const leftCeil = new THREE.Vector2(
            Math.ceil(left.x),
            Math.ceil(left.y)
          );
          const leftFloor = new THREE.Vector2(
            Math.floor(left.x),
            Math.floor(left.y)
          );
          fillPixel(data, {
            pos: leftCeil,
            resolution,
            fillColor: color,
            alpha: alpha,
          });
          if (!leftFloor.equals(leftCeil)) {
            fillPixel(data, {
              pos: leftFloor,
              resolution,
              fillColor: color,
              alpha: alpha,
            });
          }
          const leftCeilPlusOne = leftCeil
            .clone()
            .add(step)
            .round()
            .clamp(
              new THREE.Vector2(),
              new THREE.Vector2(resolution.width - 1, resolution.height - 1)
            );
          if (
            !leftCeilPlusOne.equals(leftCeil) &&
            !leftCeilPlusOne.equals(leftFloor)
          ) {
            fillPixel(data, {
              pos: leftCeilPlusOne,
              resolution,
              fillColor: color,
              alpha: alpha,
            });
          }
          const leftCeilMinusOne = leftCeil
            .clone()
            .sub(step)
            .round()
            .clamp(
              new THREE.Vector2(),
              new THREE.Vector2(resolution.width - 1, resolution.height - 1)
            );
          if (
            !leftCeilMinusOne.equals(leftCeil) &&
            !leftCeilMinusOne.equals(leftFloor) &&
            !leftCeilMinusOne.equals(leftCeilPlusOne)
          ) {
            fillPixel(data, {
              pos: leftCeilMinusOne,
              resolution,
              fillColor: color,
              alpha: alpha,
            });
          }
        }
        if (
          right.x > 0 &&
          right.x < resolution.width &&
          right.y > 0 &&
          right.y < resolution.height
        ) {
          right
            .sub(perpindicular)
            .clamp(
              new THREE.Vector2(),
              new THREE.Vector2(resolution.width - 1, resolution.height - 1)
            );
          const rightCeil = new THREE.Vector2(
            Math.ceil(right.x),
            Math.ceil(right.y)
          );
          const rightFloor = new THREE.Vector2(
            Math.floor(right.x),
            Math.floor(right.y)
          );
          fillPixel(data, {
            pos: rightCeil,
            resolution,
            fillColor: color,
            alpha: alpha,
          });
          if (!rightFloor.equals(rightCeil)) {
            fillPixel(data, {
              pos: rightFloor,
              resolution,
              fillColor: color,
              alpha: alpha,
            });
          }
          const rightCeilPlusOne = rightCeil
            .clone()
            .add(step)
            .round()
            .clamp(
              new THREE.Vector2(),
              new THREE.Vector2(resolution.width - 1, resolution.height - 1)
            );
          if (
            !rightCeilPlusOne.equals(rightCeil) &&
            !rightCeilPlusOne.equals(rightFloor)
          ) {
            fillPixel(data, {
              pos: rightCeilPlusOne,
              resolution,
              fillColor: color,
              alpha: alpha,
            });
          }
          const rightCeilMinusOne = rightCeil
            .clone()
            .sub(step)
            .round()
            .clamp(
              new THREE.Vector2(),
              new THREE.Vector2(resolution.width - 1, resolution.height - 1)
            );
          if (
            !rightCeilMinusOne.equals(rightCeil) &&
            !rightCeilMinusOne.equals(rightFloor) &&
            !rightCeilMinusOne.equals(rightCeilPlusOne)
          ) {
            fillPixel(data, {
              pos: rightCeilMinusOne,
              resolution,
              fillColor: color,
              alpha: alpha,
            });
          }
        }
      }
    }
  }
};

export const drawCircle = (params: {
  drawPoint: (pos: THREE.Vector2) => void;
  pos: THREE.Vector2;
  diameter: number;
  resolution: THREE.Vector2;
}) => {
  const radius = Math.floor((params.diameter + 1) / 2);
  const minX = Math.max(-radius + 1, -params.pos.x);
  const minY = Math.max(-radius + 1, -params.pos.y);
  const maxX = Math.min(radius, params.resolution.width - params.pos.x);
  const maxY = Math.min(radius, params.resolution.height - params.pos.y);
  for (let x = minX; x < maxX; x++) {
    for (let y = minY; y < maxY; y++) {
      if (x * x + y * y <= radius * radius) {
        const pos = new THREE.Vector2(params.pos.x + x, params.pos.y + y);
        params.drawPoint(pos);
      }
    }
  }
};

export const drawSquare = (params: {
  drawPoint: (pos: THREE.Vector2) => void;
  pos: THREE.Vector2;
  length: number;
  resolution: THREE.Vector2;
}) => {
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
      params.drawPoint(pos);
    }
  }
};
