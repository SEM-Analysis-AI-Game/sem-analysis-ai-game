"use client";

import * as THREE from "three";
import { createContext, useContext } from "react";
import { kSubdivisionSize } from "./renderer";

export class DrawingLayer {
  private readonly drawingUniforms: THREE.Uniform<THREE.DataTexture>[];
  public readonly pixelSize: THREE.Vector2;
  public readonly trailing: THREE.Vector2;
  public readonly numSections: THREE.Vector2;

  constructor(pixelSize: THREE.Vector2) {
    this.pixelSize = pixelSize;
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

  public sectionSize(x: number, y: number): THREE.Vector2 {
    return new THREE.Vector2(
      x === this.numSections.x ? this.trailing.x : kSubdivisionSize,
      y === this.numSections.y ? this.trailing.y : kSubdivisionSize
    );
  }

  public drawPoints(
    points: { pos: THREE.Vector2; color: THREE.Color; alpha: number }[]
  ): void {
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
      data[pixelIndex] = point.color.r * 255;
      data[pixelIndex + 1] = point.color.g * 255;
      data[pixelIndex + 2] = point.color.b * 255;
      data[pixelIndex + 3] = point.alpha * 255;
      uniform.value.needsUpdate = true;
    }
  }

  public uniform(x: number, y: number): THREE.Uniform<THREE.DataTexture> {
    return this.drawingUniforms[y * (this.numSections.x + 1) + x];
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
