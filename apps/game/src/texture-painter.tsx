import { useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OrthographicCamera, useTexture } from "@react-three/drei";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import * as THREE from "three";

const vertexShader = `
varying vec3 vUv;

void main() {
    vUv = position;
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition; 
}`;

const fragmentShader = `
precision highp float;
uniform vec2 mousePos;
uniform float brushSize;
uniform vec2 resolution;
uniform sampler2D drawing;
uniform sampler2D background;
varying vec3 vUv;

void main() {
    vec2 pixelPos = vUv.xy * resolution;
    if (distance(mousePos * resolution, pixelPos) <= brushSize) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    } else {
        vec2 texCoords = vUv.xy * 0.5 + 0.5;
        gl_FragColor = texture2D(drawing, texCoords) + texture2D(background, texCoords);
    }
}`;

const kBrushSmoothingThreshold = 0.01;

const kFillAlpha = 0.5;

function TexturePainterRenderer(props: {
  setMouseDownHandler: (handler: () => void) => void;
  setMouseUpHandler: (handler: () => void) => void;
}): null {
  const { gl, mouse, size } = useThree();

  const theTexture = useTexture("/the_texture.jpg");

  const [painting, setPainting] = useState(false);

  const [fillColor, setFillColor] = useState(new THREE.Color(0xff0000));

  useEffect(() => {
    props.setMouseDownHandler(() => () => setPainting(true));
    props.setMouseUpHandler(() => () => setPainting(false));
  }, []);

  const [
    textureComposer,
    mousePositionUniform,
    drawingUniform,
    resolutionUniform,
    brushSizeUniform,
    drawingPoints,
  ] = useMemo(() => {
    const points = new Uint8Array(size.width * size.height * 4);
    const mousePos = new THREE.Uniform(new THREE.Vector2(...mouse));
    const drawing = new THREE.Uniform(new THREE.Texture());
    const resolution = new THREE.Uniform(
      new THREE.Vector2(size.width, size.height)
    );
    const brushSize = new THREE.Uniform(20.0);

    const composer = new EffectComposer(gl);
    composer.addPass(
      new ShaderPass(
        new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            brushSize,
            mousePos,
            resolution,
            drawing,
            background: { value: theTexture },
          },
        })
      )
    );
    return [composer, mousePos, drawing, resolution, brushSize, points];
  }, [gl, mouse, size, theTexture]);

  const setBrushSize = (size: number) => {
    brushSizeUniform.value = size;
  };

  const fillPixel = (pos: THREE.Vector2) => {
    const mousePixelIndex = (pos.y * size.width + pos.x) * 4;
    drawingPoints[mousePixelIndex] = fillColor.r * 255;
    drawingPoints[mousePixelIndex + 1] = fillColor.g * 255;
    drawingPoints[mousePixelIndex + 2] = fillColor.b * 255;
    drawingPoints[mousePixelIndex + 3] = kFillAlpha * 255;
  };

  const updateUniforms = () => {
    mousePositionUniform.value.copy(mouse);
    resolutionUniform.value.set(size.width, size.height);
    drawingUniform.value = new THREE.DataTexture(
      drawingPoints,
      size.width,
      size.height
    );
    drawingUniform.value.needsUpdate = true;
  };

  const drawCircle = (pos: THREE.Vector2) => {
    const brushSize = brushSizeUniform.value * 0.5;
    for (let i = -brushSize; i <= brushSize; i++) {
      for (let j = -brushSize; j <= brushSize; j++) {
        if (i * i + j * j <= brushSize * brushSize) {
          fillPixel(new THREE.Vector2(pos.x + i, pos.y + j));
        }
      }
    }
  };

  const mouseToPixel = (mouse: THREE.Vector2) => {
    const mouseNormalized = new THREE.Vector2(
      mouse.x * 0.5 + 0.5,
      mouse.y * 0.5 + 0.5
    );
    return new THREE.Vector2(
      Math.floor(mouseNormalized.x * size.width),
      Math.floor(mouseNormalized.y * size.height)
    );
  };

  const paint = () => {
    drawCircle(mouseToPixel(mousePositionUniform.value));
    const movement = mouse.clone().sub(mousePositionUniform.value);
    const movementLength = movement.length();
    const strides = movementLength / kBrushSmoothingThreshold;
    const step = movement.divideScalar(strides);
    for (let i = 0; i < strides; i++) {
      mousePositionUniform.value.add(step);
      drawCircle(mouseToPixel(mousePositionUniform.value));
    }
  };

  return useFrame(() => {
    if (painting) {
      paint();
    }

    updateUniforms();

    gl.clear();
    gl.autoClear = false;
    textureComposer.render();
  });
}

export function TexturePainter(): JSX.Element {
  const [mouseUpHandler, setMouseUpHandler] = useState(() => () => {});
  const [mouseDownHandler, setMouseDownHandler] = useState(() => () => {});

  return (
    <Canvas onMouseDown={mouseDownHandler} onMouseUp={mouseUpHandler}>
      <OrthographicCamera makeDefault />
      <TexturePainterRenderer
        setMouseDownHandler={setMouseDownHandler}
        setMouseUpHandler={setMouseUpHandler}
      />
    </Canvas>
  );
}
