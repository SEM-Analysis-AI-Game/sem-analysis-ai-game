import * as THREE from "three";
import { DrawEvent } from "./socket-events";

export const kBrushPoints = createCirclePoints(20);
const kDrawingSmoothStep = 8;
const kDrawAlpha = 0.5;
const kBorderAlphaBoost = 0.5;

function createCirclePoints(diameter: number): readonly {
  pos: readonly [number, number];
  boundaryEdges: readonly (readonly [number, number])[];
}[] {
  const points: {
    pos: readonly [number, number];
    boundaryEdges: readonly (readonly [number, number])[];
  }[] = [];
  const radius = Math.ceil(diameter / 2);
  for (let x = -radius; x < radius; x++) {
    for (let y = -radius; y < radius; y++) {
      const lengthSquared = x * x + y * y;
      const radiusSquared = radius * radius;
      if (lengthSquared < radiusSquared) {
        const boundaryEdges: (readonly [number, number])[] = [];

        function checkOffset(offset: readonly [number, number]) {
          const lengthSquared =
            (offset[0] + x) * (offset[0] + x) +
            (offset[1] + y) * (offset[1] + y);
          if (lengthSquared >= radiusSquared) {
            boundaryEdges.push(offset);
          }
        }
        if (x < 0) {
          checkOffset([-1, 0]);
        } else if (x > 0) {
          checkOffset([1, 0]);
        }

        if (y < 0) {
          checkOffset([0, -1]);
        } else if (y > 0) {
          checkOffset([0, 1]);
        }

        points.push({
          boundaryEdges,
          pos: [x, y],
        });
      }
    }
  }
  return points;
}

export function smoothPaint(
  event: DrawEvent,
  segmentBuffer: Int32Array,
  segmentData: {
    color: THREE.Color;
  }[],
  drawing: THREE.DataTexture | null,
  resolution: readonly [number, number]
): void {
  let segment = getSegment(segmentBuffer, resolution, event.from);
  if (segment === -1) {
    segmentData.push({
      color: new THREE.Color(`#${event.color}`),
    });
    segment = segmentData.length - 1;
  }

  draw(segmentBuffer, segment, segmentData, drawing, event.to, resolution);

  const current: [number, number] = [event.to[0], event.to[1]];

  const length = Math.sqrt(
    Math.pow(current[0] - event.from[0], 2) +
      Math.pow(current[1] - event.from[1], 2)
  );

  const step = [
    (kDrawingSmoothStep * (event.from[0] - current[0])) / length,
    (kDrawingSmoothStep * (event.from[1] - current[1])) / length,
  ];

  while (
    step[0] * (event.from[0] - current[0]) +
      step[1] * (event.from[1] - current[1]) >
    0
  ) {
    const currentPos = [
      Math.floor(current[0]),
      Math.floor(current[1]),
    ] as const;

    draw(segmentBuffer, segment, segmentData, drawing, currentPos, resolution);

    current[0] += step[0];
    current[1] += step[1];
  }
}

export function getSegment(
  segmentBuffer: Int32Array,
  resolution: readonly [number, number],
  pos: readonly [number, number]
): number {
  return segmentBuffer[pos[1] * resolution[0] + pos[0]];
}

function draw(
  segmentBuffer: Int32Array,
  activeSegment: number,
  segmentData: readonly { color: THREE.Color }[],
  drawing: THREE.DataTexture | null,
  pos: readonly [number, number],
  resolution: readonly [number, number]
): void {
  for (const point of kBrushPoints) {
    const pixelPos = [pos[0] + point.pos[0], pos[1] + point.pos[1]] as const;
    if (
      pixelPos[0] >= 0 &&
      pixelPos[1] >= 0 &&
      pixelPos[0] < resolution[0] &&
      pixelPos[1] < resolution[1]
    ) {
      segmentBuffer[pixelPos[1] * resolution[0] + pixelPos[0]] = activeSegment;

      const isBoundary =
        (drawing &&
          point.boundaryEdges.filter((offset) => {
            const pos = [
              offset[0] + pixelPos[0],
              offset[1] + pixelPos[1],
            ] as const;
            if (
              pos[0] < 0 ||
              pos[1] < 0 ||
              pos[0] >= resolution[0] ||
              pos[1] >= resolution[1]
            ) {
              return true;
            } else {
              const segment = getSegment(segmentBuffer, resolution, pos);
              if (segment !== activeSegment) {
                if (segment !== -1) {
                  fillPixel(
                    drawing,
                    pos,
                    resolution,
                    kDrawAlpha + kBorderAlphaBoost,
                    segmentData[segment].color
                  );
                }
                return true;
              }
            }
            return false;
          }).length > 0) ||
        pixelPos[0] === 0 ||
        pixelPos[1] === 0 ||
        pixelPos[0] === resolution[0] - 1 ||
        pixelPos[1] === resolution[1] - 1;

      if (drawing) {
        fillPixel(
          drawing,
          pixelPos,
          resolution,
          kDrawAlpha + (isBoundary ? kBorderAlphaBoost : 0),
          segmentData[activeSegment].color
        );
      }
    }
  }
}

function fillPixel(
  drawing: THREE.DataTexture,
  pos: readonly [number, number],
  resolution: readonly [number, number],
  alpha: number,
  color: THREE.Color
): void {
  const pixelIndex = (pos[1] * resolution[0] + pos[0]) * 4;
  const data = drawing.image.data;
  data[pixelIndex] = color.r * 255;
  data[pixelIndex + 1] = color.g * 255;
  data[pixelIndex + 2] = color.b * 255;
  data[pixelIndex + 3] = alpha * 255;
  drawing.needsUpdate = true;
}
