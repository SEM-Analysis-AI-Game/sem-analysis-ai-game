export const vertexShader = `
varying vec3 vUv;

void main() {
    vUv = position;
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition; 
}`;

export const fragmentShader = `
precision highp float;
uniform vec2 mousePos;
uniform vec2 resolution;
uniform sampler2D drawing;
uniform sampler2D background;
varying vec3 vUv;

void main() {
    vec2 pixelPos = vUv.xy * resolution;
    vec2 texCoords = vUv.xy * 0.5 + 0.5;
    gl_FragColor = texture2D(drawing, texCoords) + texture2D(background, texCoords);
}`;
