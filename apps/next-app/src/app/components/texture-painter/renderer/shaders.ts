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
uniform sampler2D cursorOverlay;
uniform sampler2D drawing;
uniform sampler2D background;
uniform bool hideCursorOverlay;
varying vec3 vUv;

void main() {
    vec2 normalizedCoords = vUv.xy * 0.5 + 0.5;
    vec4 cursorOverlayColor = vec4(0.0);

    if (!hideCursorOverlay) {
        vec2 normalizedCursor = cursorPos.xy * 0.5 + 0.5;
        vec2 difference = normalizedCursor - normalizedCoords;

        ivec2 iResolution = textureSize(background, 0);
        vec2 resolution = vec2(float(iResolution.x), float(iResolution.y));

        vec2 pixelDifference = difference * resolution;

        ivec2 iCursorResolution = textureSize(cursorOverlay, 0);
        vec2 cursorResolution = vec2(float(iCursorResolution.x), float(iCursorResolution.y));

        if (abs(pixelDifference.x) < cursorResolution.x * 0.5 && abs(pixelDifference.y) < cursorResolution.y * 0.5) {
            cursorOverlayColor = texture2D(cursorOverlay, pixelDifference / cursorResolution + 0.5);
        }
    }
    
    gl_FragColor = texture2D(background, normalizedCoords);

    vec4 drawingColor = texture2D(drawing, normalizedCoords);
    gl_FragColor = mix(gl_FragColor, drawingColor, drawingColor.a);

    gl_FragColor = mix(gl_FragColor, cursorOverlayColor, cursorOverlayColor.a);
}`;
