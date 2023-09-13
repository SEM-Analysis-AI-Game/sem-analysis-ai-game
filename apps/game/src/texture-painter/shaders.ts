export const vertexShader = `
varying vec3 vUv;

void main() {
    vUv = position;
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition; 
}`;

export const fragmentShader = `
precision highp float;
uniform vec2 cursorPos;
uniform vec2 resolution;
uniform sampler2D cursorOverlay;
uniform sampler2D drawing;
uniform sampler2D background;
varying vec3 vUv;

void main() {
    vec2 normalizedCoords = vUv.xy * 0.5 + 0.5;
    vec2 normalizedCursor = cursorPos.xy * 0.5 + 0.5;

    vec2 difference = normalizedCursor - normalizedCoords;
    vec2 pixelDifference = difference * resolution;
    
    ivec2 cursorOverlaySize = textureSize(cursorOverlay, 0);
    vec4 cursorOverlayColor = vec4(0.0);

    if (abs(pixelDifference.x) < float(cursorOverlaySize.x) * 0.5 && abs(pixelDifference.y) < float(cursorOverlaySize.y) * 0.5) {
        cursorOverlayColor = texture2D(cursorOverlay, 
            difference * resolution / vec2(float(cursorOverlaySize.x), float(cursorOverlaySize.y)) + 0.5);
    }

    gl_FragColor = texture2D(drawing, normalizedCoords) + texture2D(background, normalizedCoords) + cursorOverlayColor;
}`;
