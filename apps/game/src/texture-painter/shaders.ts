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
uniform sampler2D mouseOverlay;
uniform sampler2D drawing;
uniform sampler2D background;
varying vec3 vUv;

void main() {
    vec2 normalizedCoords = vUv.xy * 0.5 + 0.5;
    vec2 normalizedMouse = mousePos.xy * 0.5 + 0.5;

    vec2 difference = normalizedMouse - normalizedCoords;
    vec2 pixelDifference = difference * resolution;
    
    ivec2 mouseOverlaySize = textureSize(mouseOverlay, 0);
    vec4 mouseOverlayColor = vec4(0.0);

    if (abs(pixelDifference.x) < float(mouseOverlaySize.x) * 0.5 && abs(pixelDifference.y) < float(mouseOverlaySize.y) * 0.5) {
        mouseOverlayColor = texture2D(mouseOverlay, difference * resolution / vec2(float(mouseOverlaySize.x), float(mouseOverlaySize.y)) + 0.5);
    }

    gl_FragColor = texture2D(drawing, normalizedCoords) + texture2D(background, normalizedCoords) + mouseOverlayColor;
}`;
