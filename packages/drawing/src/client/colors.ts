import * as THREE from "three";
import seedrandom from "seedrandom";

// random colors
const colorCache: THREE.Color[] = [];

const random = seedrandom("behind-density-lines");

/**
 * Pseudo-randomly generates a color for a segment.
 *
 * This is deterministic, so the same segment will always have the same color.
 */
export function getColor(segment: number): THREE.Color {
  if (colorCache.length > segment) {
    return colorCache[segment];
  }
  while (colorCache.length <= segment) {
    const r = random();
    const g = random();
    const b = random();
    colorCache.push(new THREE.Color(r, g, b));
  }
  return colorCache[colorCache.length - 1];
}
