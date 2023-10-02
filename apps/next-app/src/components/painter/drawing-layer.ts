"use client";

import * as THREE from "three";
import { createContext, useContext } from "react";
import { kSubdivisionSize } from "./renderer";
import { CanvasAction } from "./action";
import { kDrawAlpha } from "./tools";
import { PointContainer } from "./point-container";

type BFSNode = {
  readonly data: THREE.Vector2;
  next: BFSNode | null;
};

const kNeighbors: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

export class DrawingLayer {
  private readonly drawingUniforms: THREE.Uniform<THREE.DataTexture>[];
  public readonly pixelSize: THREE.Vector2;
  public readonly trailing: THREE.Vector2;
  public readonly numSections: THREE.Vector2;

  private numSegments: number;
  private readonly segmentBuffer: Int32Array;
  private segmentMap: Map<
    number,
    { color: THREE.Color; points: PointContainer }
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

  public recomputeSegments(action: CanvasAction): void {
    let splitSegment = false;
    for (let segment of action.effectedSegments) {
      const segmentEntry = this.segmentMap.get(segment);
      if (!segmentEntry) {
        throw new Error("Segment not found");
      }
      let bfsStart: THREE.Vector2 | null = null;
      let totalPoints = 0;
      segmentEntry.points.forEach((x, y) => {
        if (!action.paintedPoints.hasPoint(x, y)) {
          totalPoints++;
          bfsStart = new THREE.Vector2(x, y);
        }
      });
      if (bfsStart) {
        const otherPortion = new PointContainer();
        segmentEntry.points.forEach((x, y) => {
          if (!action.paintedPoints.hasPoint(x, y)) {
            otherPortion.setPoint(x, y, null);
          }
        });

        let visited = new PointContainer();
        let queue: BFSNode | null = {
          data: bfsStart,
          next: null,
        };
        let tail = queue;
        while (queue) {
          const current = queue.data;
          if (!visited.hasPoint(current.x, current.y)) {
            visited.setPoint(current.x, current.y, null);
            otherPortion.deletePoint(current.x, current.y);

            for (let neighbor of kNeighbors) {
              const neighborX = neighbor[0] + current.x;
              const neighborY = neighbor[1] + current.y;
              if (
                segmentEntry.points.hasPoint(neighborX, neighborY) &&
                !action.paintedPoints.hasPoint(neighborX, neighborY) &&
                !visited.hasPoint(neighborX, neighborY)
              ) {
                tail.next = {
                  data: new THREE.Vector2(neighborX, neighborY),
                  next: null,
                };
                tail = tail.next;
              }
            }
          }
          queue = queue.next;
        }

        if (visited.size() < totalPoints) {
          this.numSegments++;
          const newSegment = this.numSegments;
          segmentEntry.points = otherPortion;
          visited.forEach((x, y) => {
            if (!action.paintedPoints.hasPoint(x, y)) {
              action.paintedPoints.setPoint(x, y, {
                newSegment,
                pos: new THREE.Vector2(x, y),
                oldSegment: segment,
              });
            }
            action.effectedSegments.add(segment);
            splitSegment = true;
            this.setSegment(x, y, newSegment);
          });
        } else {
          action.effectedSegments.delete(segment);
        }
      } else {
        action.effectedSegments.delete(segment);
      }
    }
    if (splitSegment) {
      this.recomputeSegments(action);
    }
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

  public setSegment(x: number, y: number, segment: number): void {
    const oldSegment = this.segment(x, y);
    this.segmentBuffer[y * this.pixelSize.x + x] = segment;
    const color = this.segmentColor(segment);
    if (segment !== -1) {
      const segmentEntry = this.segmentMap.get(segment);
      if (segmentEntry) {
        segmentEntry.points.setPoint(x, y, null);
      } else {
        throw new Error("Segment not found");
      }
    }
    if (oldSegment !== segment && oldSegment !== -1) {
      const oldSegmentEntry = this.segmentMap.get(oldSegment);
      if (oldSegmentEntry) {
        oldSegmentEntry.points.deletePoint(x, y);
      } else {
        throw new Error("Segment not found");
      }
    }
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
    data[pixelIndex + 3] = segment === -1 ? 0 : kDrawAlpha * 255.0;
    uniform.value.needsUpdate = true;
  }

  private segmentColor(segment: number): THREE.Color {
    const data = this.segmentMap.get(segment);
    if (!data) {
      let randomColor = new THREE.Color(
        Math.random(),
        Math.random(),
        Math.random()
      );
      let foundColor = false;
      while (!foundColor) {
        foundColor = true;
        for (let i = 0; i < this.numSegments && foundColor; i++) {
          const checkSegment = this.segmentMap.get(i);
          if (checkSegment) {
            if (
              new THREE.Vector3(
                checkSegment.color.r,
                checkSegment.color.g,
                checkSegment.color.b
              ).distanceTo(
                new THREE.Vector3(randomColor.r, randomColor.g, randomColor.b)
              ) < 0.075
            ) {
              randomColor = new THREE.Color(
                Math.random(),
                Math.random(),
                Math.random()
              );
              foundColor = false;
            }
          }
        }
      }
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
