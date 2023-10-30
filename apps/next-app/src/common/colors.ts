import * as THREE from "three";

const colorCache: THREE.Color[] = [];

export function getColor(segment: number): THREE.Color {
  if (colorCache.length > segment) {
    return colorCache[segment];
  }
  const index = colorCache.length + 1;
  while (colorCache.length <= segment) {
    const segmentColorIndex = index * 3;
    const x = Math.sin(segmentColorIndex) * 10000;
    const y = Math.sin(segmentColorIndex + 1) * 10000;
    const z = Math.sin(segmentColorIndex + 2) * 10000;
    colorCache.push(
      new THREE.Color(x - Math.floor(x), y - Math.floor(y), z - Math.floor(z))
    );
  }
  return colorCache[colorCache.length - 1];
}
