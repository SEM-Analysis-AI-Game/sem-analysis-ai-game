"use client";

import * as THREE from "three";
import { createContext, useContext } from "react";
import { kSubdivisionSize } from "./renderer";
import { kDrawAlpha } from "./tools";
import { PointContainer } from "./point-container";
import { CanvasAction } from "./action";

type BFSNode = {
  data: THREE.Vector2;
  next: BFSNode | null;
};

function breadthFirstSearch(
  start: THREE.Vector2,
  test: (pos: THREE.Vector2) => boolean,
  neighbors: [number, number][]
): PointContainer {
  const visited = new PointContainer();
  let queue: BFSNode | null = {
    data: start,
    next: null,
  };
  let tail = queue;
  while (queue) {
    const current = queue.data;
    if (test(current)) {
      if (!visited.hasPoint(current.x, current.y)) {
        visited.setPoint(current.x, current.y, null);
        for (let neighbor of neighbors) {
          const neighborPos = new THREE.Vector2(
            current.x + neighbor[0],
            current.y + neighbor[1]
          );
          if (test(neighborPos)) {
            tail.next = {
              data: neighborPos,
              next: null,
            };
            tail = tail.next;
          }
        }
      }
    }
    queue = queue.next;
  }
  return visited;
}

const kBorderAlphaBoost = 0.5;

export class DrawingLayer {
  private readonly drawingUniforms: THREE.Uniform<THREE.DataTexture>[];
  public readonly pixelSize: THREE.Vector2;
  public readonly trailing: THREE.Vector2;
  public readonly numSections: THREE.Vector2;

  private numSegments: number;
  private readonly segmentBuffer: Int32Array;
  private segmentMap: Map<
    number,
    {
      color: THREE.Color;
      points: PointContainer<{ numNeighbors: number }>;
    }
  >;

  constructor(pixelSize: THREE.Vector2) {
    this.segmentMap = new Map();
    this.numSegments = 0;
    this.pixelSize = pixelSize;
    this.segmentBuffer = new Int32Array(pixelSize.x * pixelSize.y).fill(-1);
    this.numSections = pixelSize.clone().divideScalar(kSubdivisionSize).floor();
    this.trailing = pixelSize
      .clone()
      .sub(this.numSections.clone().multiplyScalar(kSubdivisionSize));

    this.drawingUniforms = [];
    for (let i = 0; i < this.numSections.y + 1; i++) {
      for (let j = 0; j < this.numSections.x + 1; j++) {
        const sectionSize = this.sectionSize(j, i);
        const drawingUniform = new THREE.Uniform(
          new THREE.DataTexture(
            new Uint8Array(sectionSize.x * sectionSize.y * 4),
            sectionSize.x,
            sectionSize.y
          )
        );
        this.drawingUniforms.push(drawingUniform);
      }
    }
  }

  public incrementSegments(): void {
    this.numSegments++;
  }

  public getNumSegments(): number {
    return this.numSegments;
  }

  public segment(x: number, y: number): number {
    return this.segmentBuffer[y * this.pixelSize.x + x];
  }

  public section(x: number, y: number): THREE.Vector2 {
    return new THREE.Vector2(x, y).divideScalar(kSubdivisionSize).floor();
  }

  public sectionSize(j: number, i: number): THREE.Vector2 {
    return new THREE.Vector2(
      j === this.numSections.x ? this.trailing.x : kSubdivisionSize,
      i === this.numSections.y ? this.trailing.y : kSubdivisionSize
    );
  }

  public recomputeSegments(action: CanvasAction): void {
    for (let segment of action.effectedSegments) {
      let boundary = this.segmentMap
        .get(segment)!
        .points.filter((x, y, data) => data.numNeighbors < 4);

      while (boundary.size() > 0) {
        let bfsStart: THREE.Vector2 | null = null;
        boundary.forEach((x, y, data) => {
          if (!bfsStart) {
            bfsStart = new THREE.Vector2(x, y);
          }
        });
        if (!bfsStart) {
          throw new Error("bfsStart is null");
        }
        let totalPoints = boundary.size();
        const visited = breadthFirstSearch(
          bfsStart,
          (pos) => boundary.hasPoint(pos.x, pos.y),
          [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ]
        );
        if (visited.size() < totalPoints) {
          this.numSegments++;
          const newSegment = this.numSegments;
          let fillStart: THREE.Vector2 | null = null;
          boundary.forEach((x, y, data) => {
            if (
              !fillStart &&
              visited.size() < totalPoints / 2 === visited.hasPoint(x, y)
            ) {
              fillStart = new THREE.Vector2(x, y);
            }
          });
          if (!fillStart) {
            throw new Error("fillStart is null");
          }
          const fillVisited = breadthFirstSearch(
            fillStart,
            (pos) => this.segment(pos.x, pos.y) === segment,
            [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
            ]
          );
          fillVisited.forEach((x, y) => {
            if (!action.paintedPoints.hasPoint(x, y)) {
              action.paintedPoints.setPoint(x, y, {
                newSegment: newSegment,
                oldSegment: segment,
              });
            }
            this.setSegment(x, y, newSegment);
          });
        }
        boundary = boundary.filter((x, y, data) => !visited.hasPoint(x, y));
      }
    }
  }

  public setSegment(x: number, y: number, segment: number): void {
    const oldSegment = this.segment(x, y);
    this.segmentBuffer[y * this.pixelSize.x + x] = segment;
    const color = this.segmentColor(segment);

    const neighbors = [
      new THREE.Vector2(x - 1, y),
      new THREE.Vector2(x + 1, y),
      new THREE.Vector2(x, y - 1),
      new THREE.Vector2(x, y + 1),
    ];

    if (oldSegment !== -1 && segment !== oldSegment) {
      const oldSegmentEntry = this.segmentMap.get(oldSegment)!;
      oldSegmentEntry.points.deletePoint(x, y);
      for (let neighbor of neighbors.filter(
        (neighbor) => this.segment(neighbor.x, neighbor.y) === oldSegment
      )) {
        const neighborEntry = oldSegmentEntry.points.getPoint(
          neighbor.x,
          neighbor.y
        );
        if (neighborEntry) {
          this.fillPixel(
            neighbor.x,
            neighbor.y,
            kDrawAlpha + kBorderAlphaBoost,
            oldSegmentEntry.color
          );
        }
        oldSegmentEntry.points.setPoint(neighbor.x, neighbor.y, {
          numNeighbors: neighborEntry ? neighborEntry.numNeighbors - 1 : 0,
        });
      }
    }

    if (segment === -1 && oldSegment !== -1) {
      this.fillPixel(x, y, 0, color);
    } else if (segment !== -1) {
      const segmentEntry = this.segmentMap.get(segment)!;
      if (!segmentEntry.points.hasPoint(x, y)) {
        const inSegmentNeighbors = neighbors.filter(
          (neighbor) => this.segment(neighbor.x, neighbor.y) === segment
        );
        segmentEntry.points.setPoint(x, y, {
          numNeighbors: inSegmentNeighbors.length,
        });
        this.fillPixel(
          x,
          y,
          kDrawAlpha +
            (inSegmentNeighbors.length < 4 ? kBorderAlphaBoost : 0.0),
          color
        );
        for (let neighbor of inSegmentNeighbors) {
          const newNumNeighbors =
            segmentEntry.points.getPoint(neighbor.x, neighbor.y)!.numNeighbors +
            1;
          segmentEntry.points.setPoint(neighbor.x, neighbor.y, {
            numNeighbors: newNumNeighbors,
          });
          if (newNumNeighbors === 4) {
            this.fillPixel(
              neighbor.x,
              neighbor.y,
              kDrawAlpha,
              segmentEntry.color
            );
          }
        }
      }
    }
  }

  public segmentPoints(
    segment: number
  ): PointContainer<{ numNeighbors: number }> | undefined {
    return this.segmentMap.get(segment)?.points;
  }

  private fillPixel(
    x: number,
    y: number,
    alpha: number,
    color: THREE.Color
  ): void {
    const section = this.section(x, y);
    const uniform = this.uniform(section.x, section.y);
    const sectionPos = new THREE.Vector2(x, y).sub(
      section.clone().multiplyScalar(kSubdivisionSize)
    );
    const sectionSize = this.sectionSize(section.x, section.y);
    const pixelIndex = (sectionPos.y * sectionSize.x + sectionPos.x) * 4;
    const data = uniform.value.image.data;
    data[pixelIndex] = color.r * 255;
    data[pixelIndex + 1] = color.g * 255;
    data[pixelIndex + 2] = color.b * 255;
    data[pixelIndex + 3] = alpha * 255.0;
    uniform.value.needsUpdate = true;
  }

  private segmentColor(segment: number): THREE.Color {
    const data = this.segmentMap.get(segment);
    if (!data) {
      const randomColor = new THREE.Color(
        Math.random(),
        Math.random(),
        Math.random()
      );
      this.segmentMap.set(segment, {
        color: randomColor,
        points: new PointContainer(),
      });
      return randomColor;
    }
    return data.color;
  }

  public uniform(j: number, i: number): THREE.Uniform<THREE.DataTexture> {
    return this.drawingUniforms[i * (this.numSections.x + 1) + j];
  }
}

export const DrawingLayerContext = createContext<DrawingLayer | null>(null);

export function useDrawingLayer(): DrawingLayer {
  const drawingLayer = useContext(DrawingLayerContext);

  if (!drawingLayer) {
    throw new Error(
      "useDrawingLayer must be used within a DrawingLayerContext"
    );
  }

  return drawingLayer;
}
