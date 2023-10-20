import * as THREE from "three";
import { kSubdivisionSize } from "../renderer";

/**
 * Updates and stores the drawing layer uniforms. The uniforms form a 2D array
 * of textures that are used to store the drawing layer. The drawing layer is
 * subdivided into sections of size kSubdivisionSize. Each section is stored in
 * a texture.
 *
 * The extra pixels that don't fit into a section are stored in the trailing
 * vector.
 *
 * The numSections vector stores the number of sections in each dimension,
 * not including the trailing section.
 */
export type RendererState = {
  /**
   * The size of the background
   */
  readonly pixelSize: THREE.Vector2;

  /**
   * The uniforms for each section. These are mutable and their updates
   * are detected in the render loop.
   */
  readonly drawingUniforms: THREE.Uniform<THREE.DataTexture>[];

  /**
   * The number of pixels in the trailing section. This section is not
   * counted in numSections.
   */
  readonly trailing: THREE.Vector2;

  /**
   * The number of sections in each dimension. This does not include the
   * trailing section.
   */
  readonly numSections: THREE.Vector2;
};

export function calculateSectionSize(
  numSections: THREE.Vector2,
  trailing: THREE.Vector2,
  j: number,
  i: number
) {
  return new THREE.Vector2(
    j === numSections.x ? trailing.x : kSubdivisionSize,
    i === numSections.y ? trailing.y : kSubdivisionSize
  );
}

/**
 * Gets the size of a section. This is kSubdivisionSize for all sections
 * except the trailing section, which is the remainder of the drawing layer
 * size divided by kSubdivisionSize.
 */
export function getSectionSize(
  state: RendererState,
  j: number,
  i: number
): THREE.Vector2 {
  return calculateSectionSize(state.numSections, state.trailing, j, i);
}

/**
 * Gets the section that a pixel is in.
 */
export function getSection(pos: THREE.Vector2): THREE.Vector2 {
  return pos.clone().divideScalar(kSubdivisionSize).floor();
}

/**
 * Gets the uniform for a given section.
 */
export function getUniform(
  state: RendererState,
  j: number,
  i: number
): THREE.Uniform<THREE.DataTexture> {
  return state.drawingUniforms[i * (state.numSections.x + 1) + j];
}

/**
 * Paints a pixel on the appropriate drawing uniform and marks it to be
 * updated on the next frame.
 */
export function fillPixel(
  state: RendererState,
  pos: THREE.Vector2,
  alpha: number,
  color: THREE.Color
): void {
  const section = getSection(pos);
  const uniform = getUniform(state, section.x, section.y);
  const sectionPos = pos
    .clone()
    .sub(section.clone().multiplyScalar(kSubdivisionSize));
  const sectionSize = getSectionSize(state, section.x, section.y);
  const pixelIndex = (sectionPos.y * sectionSize.x + sectionPos.x) * 4;
  const data = uniform.value.image.data;
  data[pixelIndex] = color.r * 255;
  data[pixelIndex + 1] = color.g * 255;
  data[pixelIndex + 2] = color.b * 255;
  data[pixelIndex + 3] = alpha * 255.0;
  uniform.value.needsUpdate = true;
}
