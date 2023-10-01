"use client";

import * as THREE from "three";
import { createContext, useContext } from "react";
import { kSubdivisionSize } from "./renderer";
import { kDrawAlpha } from "./tools/draw/brush/brush";
import { CanvasAction } from "./action";

export class DrawingLayer {
  private readonly drawingUniforms: THREE.Uniform<THREE.DataTexture>[];
  public readonly pixelSize: THREE.Vector2;
  public readonly trailing: THREE.Vector2;
  public readonly numSections: THREE.Vector2;

  private activeSegment: number;
  private numSegments: number;
  private readonly segmentBuffer: Int32Array;
  private segmentMap: Map<number, { color: THREE.Color; points: Set<string> }>;

  constructor(pixelSize: THREE.Vector2) {
    this.segmentMap = new Map();
    this.activeSegment = 0;
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

  public recomputeSegments(action: CanvasAction): void {
    let splitSegment = false;
    for (let segment of action.effectedSegments) {
      const segmentEntry = this.segmentMap.get(segment);
      if (!segmentEntry) {
        throw new Error("Segment not found");
      }
      let bfsStart: THREE.Vector2 | null = null;
      let totalPoints = 0;
      for (let point of segmentEntry.points) {
        if (!action.drawnPoints.has(point)) {
          totalPoints++;
          bfsStart = new THREE.Vector2(
            parseInt(point.split(",")[0]),
            parseInt(point.split(",")[1])
          );
        }
      }
      if (!bfsStart) {
        continue;
      }

      const otherPortion = new Set<string>();
      for (let point of segmentEntry.points) {
        if (!action.drawnPoints.has(point)) {
          otherPortion.add(point);
        }
      }

      let visited = new Set<string>();
      let queue: THREE.Vector2[] = [bfsStart];
      while (queue.length > 0) {
        let current = queue.shift()!;
        const stringPos = `${current.x},${current.y}`;
        if (!visited.has(stringPos)) {
          visited.add(stringPos);
          otherPortion.delete(stringPos);

          const neighbors: THREE.Vector2[] = [
            new THREE.Vector2(current.x - 1, current.y),
            new THREE.Vector2(current.x + 1, current.y),
            new THREE.Vector2(current.x, current.y - 1),
            new THREE.Vector2(current.x, current.y + 1),
          ];

          for (let neighbor of neighbors) {
            const stringNeighbor = `${neighbor.x},${neighbor.y}`;
            if (
              segmentEntry.points.has(stringNeighbor) &&
              !action.drawnPoints.has(stringNeighbor) &&
              !visited.has(stringNeighbor)
            ) {
              queue.push(neighbor);
            }
          }
        }
      }

      if (visited.size < totalPoints) {
        const newSegment = this.numSegments;
        segmentEntry.points = otherPortion;
        for (let point of visited) {
          const pos = new THREE.Vector2(
            parseInt(point.split(",")[0]),
            parseInt(point.split(",")[1])
          );
          if (!action.paintedPoints.has(point)) {
            action.paintedPoints.set(point, {
              pos,
              newSegment,
              oldSegment: segment,
              oldAlpha: this.alpha(pos.x, pos.y),
              newAlpha: kDrawAlpha,
            });
          }
          action.effectedSegments.add(segment);
          splitSegment = true;
          this.setSegment(pos.x, pos.y, kDrawAlpha, newSegment);
        }
      } else {
        action.effectedSegments.delete(segment);
      }
    }
    if (splitSegment) {
      this.recomputeSegments(action);
    }
  }

  public getActiveSegment(): number {
    return this.activeSegment;
  }

  public updateActiveSegment(x: number, y: number): void {
    const segment = this.segment(x, y);
    if (segment === -1) {
      this.activeSegment = this.numSegments;
    } else {
      this.activeSegment = segment;
    }
  }

  public segment(x: number, y: number): number {
    return this.segmentBuffer[y * this.pixelSize.x + x];
  }

  public section(x: number, y: number): THREE.Vector2 {
    return new THREE.Vector2(x, y).divideScalar(kSubdivisionSize).floor();
  }

  public alpha(x: number, y: number): number {
    const section = this.section(x, y);
    const sectionPos = new THREE.Vector2(x, y)
      .sub(section.clone().multiplyScalar(kSubdivisionSize))
      .floor();
    const sectionSize = this.sectionSize(section.x, section.y);
    const pixelIndex = (sectionPos.y * sectionSize.x + sectionPos.x) * 4;
    const data = this.uniform(section.x, section.y).value.image.data;
    return data[pixelIndex + 3] / 255.0;
  }

  public sectionSize(j: number, i: number): THREE.Vector2 {
    return new THREE.Vector2(
      j === this.numSections.x ? this.trailing.x : kSubdivisionSize,
      i === this.numSections.y ? this.trailing.y : kSubdivisionSize
    );
  }

  public setSegment(
    x: number,
    y: number,
    alpha: number,
    segment: number
  ): void {
    const oldSegment = this.segment(x, y);
    this.segmentBuffer[y * this.pixelSize.x + x] = segment;
    const oldActiveSegment = this.activeSegment;
    this.activeSegment = segment;
    const color = this.activeColor();
    const pos = new THREE.Vector2(x, y);
    const segmentEntry = this.segmentMap.get(segment);
    if (segmentEntry) {
      segmentEntry.points.add(`${x},${y}`);
    } else {
      throw new Error("Segment not found");
    }
    if (oldSegment !== segment && oldSegment !== -1) {
      const oldSegmentEntry = this.segmentMap.get(oldSegment);
      if (oldSegmentEntry) {
        oldSegmentEntry.points.delete(`${x},${y}`);
      } else {
        throw new Error("Segment not found");
      }
    }
    const section = this.section(x, y);
    const uniform = this.uniform(section.x, section.y);
    const sectionPos = pos
      .clone()
      .sub(section.clone().multiplyScalar(kSubdivisionSize));
    const sectionSize = this.sectionSize(section.x, section.y);
    const pixelIndex = (sectionPos.y * sectionSize.x + sectionPos.x) * 4;
    const data = uniform.value.image.data;
    data[pixelIndex] = color.r * 255;
    data[pixelIndex + 1] = color.g * 255;
    data[pixelIndex + 2] = color.b * 255;
    data[pixelIndex + 3] = alpha * 255;
    uniform.value.needsUpdate = true;
    if (this.activeSegment === this.numSegments) {
      this.numSegments++;
    }
    this.activeSegment = oldActiveSegment;
  }

  private activeColor(): THREE.Color {
    const segment = this.segmentMap.get(this.activeSegment);
    if (!segment) {
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
              ) < 0.05
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
      this.segmentMap.set(this.activeSegment, {
        color: randomColor,
        points: new Set(),
      });
      return randomColor;
    }
    return segment.color;
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
