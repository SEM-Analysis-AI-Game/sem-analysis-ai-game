import * as THREE from "three";
import { DrawEvent } from "./socket-events";
import { breadthFirstTraversal } from "./bft";
import { StaticImageData } from "next/image";

/**
 * the points that make up a brush. pos is the position of the point relative
 * to the center of the brush. if a point is on the boundary of the brush, it
 * will have its edges stored in boundaryEdges.
 *
 * the edges are stored as directions in the form [x, y] where x and y are -1, 0,
 * or 1. for example, the edge [1, 0] is the right edge of the brush, or [0, -1]
 * is the bottom edge of the brush. diagonal edges are not stored.
 *
 * the boundaryEdges are used for tracking segment boundaries while drawing.
 */
type BrushPoints = readonly {
  pos: readonly [number, number];
  boundaryEdges: readonly (readonly [number, number])[];
}[];

/**
 * the points in the brush. the brush is a circle with a diameter of 20 pixels.
 */
const brushes: BrushPoints[] = [];
for (let i = 5; i <= 100; i += 5) {
  brushes.push(createCirclePoints(i));
}

/**
 * the factor to divide the brush size when interpolating across a segment
 */
const kDrawingSmoothStep = 4;

/**
 * the alpha value to use when drawing.
 */
export const kDrawAlpha = 0.5;

/**
 * the alpha value to add to kDrawAlpha when drawing the border of a segment.
 */
export const kBorderAlphaBoost = 0.5;

type SplitInfo = {
  color: THREE.Color;
  oldSegment: number;
  newSegment: number;
  pos: readonly [number, number];
};

export function smoothPaintClient(
  segmentBuffer: Int32Array,
  image: StaticImageData,
  drawing: THREE.DataTexture,
  segmentData: {
    color: THREE.Color;
  }[],
  event: Omit<DrawEvent, "splitInfo">,
  splitInfo: readonly SplitInfo[] | null
): SplitInfo[] | undefined {
  return smoothPaint(
    (pos) => getSegment(segmentBuffer, [image.width, image.height], pos),
    (pos, segment) => (segmentBuffer[pos[1] * image.width + pos[0]] = segment),
    (pos, alpha, segment) =>
      fillPixel(
        drawing,
        pos,
        [image.width, image.height],
        alpha ??
          drawing.image.data[(pos[1] * image.width + pos[0]) * 4 + 3] / 255,
        segmentData[segment].color
      ),
    (pos) =>
      drawing.image.data[(pos[1] * image.width + pos[0]) * 4 + 3] === 255,
    (color) => {
      segmentData.push({
        color,
      });
      return segmentData.length - 1;
    },
    event,
    [image.width, image.height],
    splitInfo
  );
}

/**
 * draws a smooth brush stroke between two points.
 */
export function smoothPaint(
  getSegment: (pos: readonly [number, number]) => number,
  setSegment: (pos: readonly [number, number], segment: number) => void,
  fill: (
    pos: readonly [number, number],
    alpha: number | undefined,
    segment: number
  ) => void,
  isBoundary: (pos: readonly [number, number]) => boolean,
  createSegment: (color: THREE.Color) => number,
  event: Omit<DrawEvent, "splitInfo">,
  resolution: readonly [number, number],
  splitInfo: readonly SplitInfo[] | null
): SplitInfo[] | undefined {
  // get the segment where the brush stroke starts
  let segment = getSegment(event.from);

  // if the segment is -1, the brush stroke starts in an empty area.
  if (segment === -1) {
    segment = createSegment(new THREE.Color(`#${event.color}`));
  }

  const brushSize = event.size;

  const effectedSegments: Map<
    number,
    { newBoundaryPoints: Set<string> }
  > | null = splitInfo
    ? null
    : new Map<number, { newBoundaryPoints: Set<string> }>();

  // draw the starting point of the brush stroke
  draw(
    getSegment,
    setSegment,
    fill,
    segment,
    event.from,
    resolution,
    brushSize,
    effectedSegments
  );

  // current interpolation point
  const current: [number, number] = [event.to[0], event.to[1]];

  // distance between the start and end points of the brush stroke
  const length = Math.sqrt(
    Math.pow(current[0] - event.from[0], 2) +
      Math.pow(current[1] - event.from[1], 2)
  );

  // the step to take for each interpolation
  const step = [
    ((event.size / kDrawingSmoothStep) * (event.from[0] - current[0])) / length,
    ((event.size / kDrawingSmoothStep) * (event.from[1] - current[1])) / length,
  ];

  // interpolate between the end and start point of the brush stroke
  for (
    let i = 0;
    i < Math.floor(length / (event.size / kDrawingSmoothStep));
    i++
  ) {
    const currentPos = [
      Math.floor(current[0]),
      Math.floor(current[1]),
    ] as const;

    // draw at the current interpolation point
    draw(
      getSegment,
      setSegment,
      fill,
      segment,
      currentPos,
      resolution,
      brushSize,
      effectedSegments
    );

    current[0] += step[0];
    current[1] += step[1];
  }

  if (effectedSegments) {
    const splits: SplitInfo[] = [];
    for (const effectedSegment of effectedSegments) {
      const segment = effectedSegment[0];
      const { newBoundaryPoints } = effectedSegment[1];
      while (newBoundaryPoints.size > 0) {
        let boundarySize = newBoundaryPoints.size;
        const bfsStart = newBoundaryPoints
          .values()
          .next()
          .value.split(",")
          .map((str: string) => parseInt(str)) as [number, number];
        newBoundaryPoints.delete(`${bfsStart[0]},${bfsStart[1]}`);
        const visited = breadthFirstTraversal(bfsStart, (pos) => {
          const stringify = `${pos[0]},${pos[1]}`;
          if (
            pos[0] >= 0 &&
            pos[1] >= 0 &&
            pos[0] < resolution[0] &&
            pos[1] < resolution[1] &&
            newBoundaryPoints.has(stringify)
          ) {
            newBoundaryPoints.delete(stringify);
            return true;
          }
          return false;
        });
        if (visited.size < boundarySize) {
          boundarySize -= visited.size;
          const newColor = new THREE.Color(
            Math.random(),
            Math.random(),
            Math.random()
          );
          breadthFirstTraversal(bfsStart, (pos, exitLoop) => {
            if (
              pos[0] >= 0 &&
              pos[1] >= 0 &&
              pos[0] < resolution[0] &&
              pos[1] < resolution[1] &&
              getSegment(pos) === segment &&
              isBoundary(pos)
            ) {
              const stringify = `${pos[0]},${pos[1]}`;
              if (newBoundaryPoints.has(stringify)) {
                boundarySize--;
                if (boundarySize === 0) {
                  exitLoop();
                }
              }
              return true;
            }
            return false;
          });
          if (boundarySize !== 0) {
            const newSegment = createSegment(newColor);
            splits.push({
              newSegment,
              oldSegment: segment,
              color: newColor,
              pos: bfsStart,
            });
            breadthFirstTraversal(bfsStart, (pos) => {
              if (
                pos[0] >= 0 &&
                pos[1] >= 0 &&
                pos[0] < resolution[0] &&
                pos[1] < resolution[1] &&
                getSegment(pos) === segment
              ) {
                setSegment(pos, newSegment);
                fill(pos, undefined, newSegment);
                return true;
              }
              return false;
            });
          }
        }
      }
    }
    return splits;
  } else if (splitInfo) {
    for (const info of splitInfo) {
      if (info.oldSegment !== info.newSegment) {
        const oldSegment = getSegment(info.pos);
        const newSegment = createSegment(info.color);
        breadthFirstTraversal(info.pos, (pos) => {
          if (
            pos[0] >= 0 &&
            pos[1] >= 0 &&
            pos[0] < resolution[0] &&
            pos[1] < resolution[1] &&
            getSegment(pos) === oldSegment
          ) {
            setSegment(pos, newSegment);
            fill(pos, undefined, newSegment);
            return true;
          }
          return false;
        });
      }
    }
  } else {
    throw new Error("effectedSegments and splitInfo are both undefined");
  }
}

/**
 * gets the segment at a given position.
 */
export function getSegment(
  segmentBuffer: Int32Array,
  resolution: readonly [number, number],
  pos: readonly [number, number]
): number {
  return segmentBuffer[pos[1] * resolution[0] + pos[0]];
}

/**
 * creates the points for a brush with the given diameter.
 */
function createCirclePoints(diameter: number): BrushPoints {
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

/**
 * draws a brush stroke at a given position.
 */
function draw(
  getSegment: (pos: readonly [number, number]) => number,
  setSegment: (pos: readonly [number, number], segment: number) => void,
  fill: (
    pos: readonly [number, number],
    alpha: number | undefined,
    segment: number
  ) => void,
  activeSegment: number,
  pos: readonly [number, number],
  resolution: readonly [number, number],
  size: number,
  effectedSegments: Map<number, { newBoundaryPoints: Set<string> }> | null
): void {
  const kBrushPoints =
    brushes[Math.max(Math.min(Math.floor(size / 5 - 1), 19), 0)];

  for (const point of kBrushPoints) {
    const pixelPos = [pos[0] + point.pos[0], pos[1] + point.pos[1]] as const;
    if (
      pixelPos[0] >= 0 &&
      pixelPos[1] >= 0 &&
      pixelPos[0] < resolution[0] &&
      pixelPos[1] < resolution[1]
    ) {
      const oldSegment = getSegment(pixelPos);
      effectedSegments
        ?.get(oldSegment)
        ?.newBoundaryPoints.delete(`${pixelPos[0]},${pixelPos[1]}`);
      setSegment(pixelPos, activeSegment);

      const isBoundary =
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
            const segment = getSegment(pos);
            if (segment !== activeSegment) {
              if (segment !== -1) {
                if (effectedSegments) {
                  let segmentEntry = effectedSegments.get(segment);
                  if (!segmentEntry) {
                    segmentEntry = {
                      newBoundaryPoints: new Set<string>(),
                    };
                    effectedSegments.set(segment, segmentEntry);
                  }
                  segmentEntry.newBoundaryPoints.add(`${pos[0]},${pos[1]}`);
                }
                fill(pos, kDrawAlpha + kBorderAlphaBoost, segment);
              }
              return true;
            }
          }
          return false;
        }).length > 0 ||
        pixelPos[0] === 0 ||
        pixelPos[1] === 0 ||
        pixelPos[0] === resolution[0] - 1 ||
        pixelPos[1] === resolution[1] - 1;

      fill(
        pixelPos,
        kDrawAlpha + (isBoundary ? kBorderAlphaBoost : 0),
        activeSegment
      );
    }
  }
}

/**
 * fills a pixel in the drawing uniform.
 */
export function fillPixel(
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
