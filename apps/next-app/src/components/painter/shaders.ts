import { kPanMultiplier } from "./tools";

export const vertexShader = `
varying vec3 vUv;

void main() {
    vUv = position;
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition; 
}`;

export const backgroundFragmentShader = `
uniform sampler2D background;
uniform float zoom;
uniform vec2 pan;
varying vec3 vUv;

void main() {
    vec2 transformedCoords = ((vUv.xy / sqrt(zoom)) + pan * ${kPanMultiplier.toFixed(
      1
    )}) * 0.5 + 0.5;
    gl_FragColor = texture2D(background, transformedCoords);
}`;

export function buildFragmentShader(
  size: THREE.Vector2,
  position: THREE.Vector2
) {
  return `
uniform sampler2D inputDiffuse;
uniform float zoom;
uniform vec2 pan;
varying vec3 vUv;

void main() {
    gl_FragColor = vec4(0.0);

    vec2 transformedCoords = ((vUv.xy / sqrt(zoom)) + pan * ${kPanMultiplier.toFixed(
      1
    )}) * 0.5 + 0.5;
    vec2 min = vec2(float(${position.x}), float(${position.y}));
    vec2 max = min + vec2(float(${size.x}), float(${size.y}));

    if (transformedCoords.x > min.x && transformedCoords.x < max.x && transformedCoords.y > min.y && transformedCoords.y < max.y) {
        transformedCoords = (transformedCoords - min) / (max - min);
        gl_FragColor = texture2D(inputDiffuse, transformedCoords);
    }
}`;
}
