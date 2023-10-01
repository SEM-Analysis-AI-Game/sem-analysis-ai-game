"use client";

import * as THREE from "three";
import { createContext, useContext } from "react";
import { kSubdivisionSize } from "./renderer";

export class DrawingLayer {
  private readonly drawingUniforms: THREE.Uniform<THREE.DataTexture>[];
  public readonly pixelSize: THREE.Vector2;
  public readonly trailing: THREE.Vector2;
  public readonly numSections: THREE.Vector2;

  private activeSegment: number;
  private numSegments: number;
  private readonly segmentBuffer: Int32Array;
  private segmentColorMap: Map<number, THREE.Color>;

  constructor(pixelSize: THREE.Vector2) {
    this.segmentColorMap = new Map();
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

  public updateActiveSegment(x: number, y: number): void {
    const segment = this.segmentBuffer[y * this.pixelSize.x + x];
    if (segment === -1) {
      this.activeSegment = this.numSegments;
    } else {
      this.activeSegment = segment;
    }
  }

  public sectionSize(j: number, i: number): THREE.Vector2 {
    return new THREE.Vector2(
      j === this.numSections.x ? this.trailing.x : kSubdivisionSize,
      i === this.numSections.y ? this.trailing.y : kSubdivisionSize
    );
  }

  public drawPoints(points: { pos: THREE.Vector2; alpha: number }[]): void {
    for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
      const point = points[pointIndex];
      const section = point.pos.clone().divideScalar(kSubdivisionSize).floor();
      const uniform = this.uniform(section.x, section.y);
      const sectionPos = point.pos
        .clone()
        .sub(section.clone().multiplyScalar(kSubdivisionSize));
      const sectionSize = this.sectionSize(section.x, section.y);
      const pixelIndex = (sectionPos.y * sectionSize.x + sectionPos.x) * 4;
      const data = uniform.value.image.data;
      const color = this.activeColor();
      data[pixelIndex] = color.r * 255;
      data[pixelIndex + 1] = color.g * 255;
      data[pixelIndex + 2] = color.b * 255;
      data[pixelIndex + 3] = point.alpha * 255;
      uniform.value.needsUpdate = true;
      this.segmentBuffer[point.pos.y * this.pixelSize.x + point.pos.x] =
        this.activeSegment;
      if (this.activeSegment === this.numSegments) {
        this.numSegments++;
      }
    }
  }

  private activeColor(): THREE.Color {
    const color = this.segmentColorMap.get(this.activeSegment);
    if (!color) {
      const randomColor = new THREE.Color(
        Math.random(),
        Math.random(),
        Math.random()
      );
      this.segmentColorMap.set(this.activeSegment, randomColor);
      return randomColor;
    }
    return color;
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
