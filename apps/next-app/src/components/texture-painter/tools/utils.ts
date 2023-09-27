import * as THREE from "three";

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

function inBounds(pos: THREE.Vector2, resolution: THREE.Vector2) {
  return (
    pos.x >= 0 &&
    pos.x < resolution.width &&
    pos.y >= 0 &&
    pos.y < resolution.height
  );
}

export function smoothPaint(
  resolution: THREE.Vector2,
  currentPixel: THREE.Vector2,
  previousPixel: THREE.Vector2,
  data: Uint8Array,
  color: THREE.Color,
  alpha: number,
  width: number
) {
  const movement = currentPixel.clone().sub(previousPixel);
  const movementLength = Math.round(movement.length());
  const step = movement.normalize();
  const perpindicularStep = step
    .clone()
    .rotateAround(new THREE.Vector2(), Math.PI / 2);
  const bound = new THREE.Vector2(resolution.width - 1, resolution.height - 1);
  const current = previousPixel.clone();
  for (let i = 0; i < movementLength; i++) {
    const ceil = current.clone().ceil();
    fillPixel(data, {
      pos: ceil,
      resolution,
      fillColor: color,
      alpha: alpha,
    });
    const floor = current.clone().floor();
    if (!floor.equals(ceil)) {
      fillPixel(data, {
        pos: floor,
        resolution,
        fillColor: color,
        alpha: alpha,
      });
    }
    current.add(step).clamp(new THREE.Vector2(), bound);
    const left = current.clone();
    const right = current.clone();
    for (let j = 0; j < width; j++) {
      if (inBounds(left, resolution)) {
        left.add(perpindicularStep).clamp(new THREE.Vector2(), bound);
        const leftCeil = left.clone().ceil();
        fillPixel(data, {
          pos: leftCeil,
          resolution,
          fillColor: color,
          alpha: alpha,
        });
        const leftFloor = left.clone().floor();
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
          .ceil()
          .clamp(new THREE.Vector2(), bound);
        fillPixel(data, {
          pos: leftCeilPlusOne,
          resolution,
          fillColor: color,
          alpha: alpha,
        });
      }
      if (inBounds(right, resolution)) {
        right.sub(perpindicularStep).clamp(new THREE.Vector2(), bound);
        const rightCeil = right.clone().ceil();
        fillPixel(data, {
          pos: rightCeil,
          resolution,
          fillColor: color,
          alpha: alpha,
        });
        const rightFloor = right.clone().floor();
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
          .ceil()
          .clamp(new THREE.Vector2(), bound);
        fillPixel(data, {
          pos: rightCeilPlusOne,
          resolution,
          fillColor: color,
          alpha: alpha,
        });
      }
    }
  }
}

export const drawCircle = (params: {
  data: Uint8Array;
  pos: THREE.Vector2;
  diameter: number;
  resolution: THREE.Vector2;
  color: THREE.Color;
  alpha: number;
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
        fillPixel(params.data, {
          pos,
          resolution: params.resolution,
          fillColor: params.color,
          alpha: params.alpha,
        });
      }
    }
  }
};

export const drawSquare = (params: {
  data: Uint8Array;
  pos: THREE.Vector2;
  length: number;
  resolution: THREE.Vector2;
  color: THREE.Color;
  alpha: number;
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
      fillPixel(params.data, {
        pos,
        resolution: params.resolution,
        fillColor: params.color,
        alpha: params.alpha,
      });
    }
  }
};
