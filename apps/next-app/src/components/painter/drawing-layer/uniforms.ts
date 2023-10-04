import * as THREE from "three";
import { kSubdivisionSize } from "../renderer";

export class DrawingLayerUniforms {
  private readonly drawingUniforms: THREE.Uniform<THREE.DataTexture>[];
  private readonly trailing: THREE.Vector2;
  public readonly numSections: THREE.Vector2;

  constructor(pixelSize: THREE.Vector2) {
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

  public sectionSize(j: number, i: number): THREE.Vector2 {
    return new THREE.Vector2(
      j === this.numSections.x ? this.trailing.x : kSubdivisionSize,
      i === this.numSections.y ? this.trailing.y : kSubdivisionSize
    );
  }

  private section(x: number, y: number): THREE.Vector2 {
    return new THREE.Vector2(x, y).divideScalar(kSubdivisionSize).floor();
  }

  public uniform(j: number, i: number): THREE.Uniform<THREE.DataTexture> {
    return this.drawingUniforms[i * (this.numSections.x + 1) + j];
  }

  public fillPixel(
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
}
