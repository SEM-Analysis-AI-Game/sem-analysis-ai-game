/**
 * This shader does nothing but pass the texture through.
 */
export const vertexShader = `
varying vec3 vUv;

void main() {
    vUv = position;
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition; 
}`;

/**
 * Converts a number to GLSL float type.
 */
function toGLSLFloat(n: number) {
  if (Number.isInteger(n)) {
    return n.toFixed(1);
  } else {
    return n;
  }
}

/**
 * This shader function applies pan and zoom to screen coordinates, and then
 * converts them to texture coordinates.
 */
const kApplyPanAndZoom = `
uniform vec2 pan;
uniform float zoom;
void applyPanAndZoom(in vec2 uv, out vec2 transformedCoords) {
  transformedCoords = ((uv / sqrt(zoom)) + pan) * 0.5 + 0.5;
}
`;

/**
 * This shader applies pan and zoom to the background texture.
 */
export const backgroundFragmentShader = `
varying vec3 vUv;

uniform sampler2D background;

${kApplyPanAndZoom}

void main() {
    vec2 transformedCoords = vec2(0.0);
    applyPanAndZoom(vUv.xy, transformedCoords);
    gl_FragColor = texture2D(background, transformedCoords);
}`;

/**
 * Builds a fragment shader for rendering a section of the drawing layer.
 *
 * Pan and zoom are applied.
 *
 * @param size The size of the section to render.
 * @param position The position of the section to render.
 */
export function buildFragmentShader(
  size: THREE.Vector2,
  position: THREE.Vector2
) {
  return `
varying vec3 vUv;

uniform sampler2D inputDiffuse;

${kApplyPanAndZoom}

void main() {
    gl_FragColor = vec4(0.0);

    vec2 transformedCoords = vec2(0.0);
    applyPanAndZoom(vUv.xy, transformedCoords);

    vec2 min = vec2(${toGLSLFloat(position.x)}, ${toGLSLFloat(position.y)});
    vec2 max = min + vec2(${toGLSLFloat(size.x)}, ${toGLSLFloat(size.y)});

    if (transformedCoords.x > min.x && transformedCoords.x < max.x && transformedCoords.y > min.y && transformedCoords.y < max.y) {
        transformedCoords = (transformedCoords - min) / (max - min);
        gl_FragColor = texture2D(inputDiffuse, transformedCoords);
    }
}`;
}
