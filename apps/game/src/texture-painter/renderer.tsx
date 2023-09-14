import * as THREE from 'three';
import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { Size, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { fragmentShader, vertexShader } from './shaders';
import { TexturePainterControlState, TexturePainterControls, kInitialControlState } from './controls';
import { Tool } from './tools';

export type FrameCallbackParams = {
  delta: number;
  resolution: Size;
  cursor: {
    previous: THREE.Vector2;
    current: THREE.Vector2;
  };
  drawingPoints: Uint8Array;
  controls: TexturePainterControlState;
}

export type FrameCallback = (params: FrameCallbackParams) => void;

export function TexturePainterRenderer(props: {
  initialTool: Tool;
  registerCursorDownHandler: (handler: React.MouseEventHandler) => void;
  registerCursorUpHandler: (handler: React.MouseEventHandler) => void;
}): JSX.Element {
  const { gl, mouse, size } = useThree();

  const theTexture = useTexture('/the_texture.jpg');

  const controlState = useMemo(() => {
    return {
      tool: props.initialTool,
      controls: kInitialControlState,
    };
  }, []);

  const [
    textureComposer,
    cursorPositionUniform,
    drawingUniform,
    resolutionUniform,
    cursorOverlayUniform,
    drawingPoints,
  ] = useMemo(() => {
    const points = new Uint8Array(size.width * size.height * 4);
    const cursorPos = new THREE.Uniform(new THREE.Vector2(...mouse));
    const drawing = new THREE.Uniform(new THREE.Texture());
    const resolution = new THREE.Uniform(new THREE.Vector2(size.width, size.height));
    const cursorOverlay = new THREE.Uniform(controlState.tool.cursorOverlay);

    const composer = new EffectComposer(gl);
    composer.addPass(
      new ShaderPass(
        new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            cursorPos,
            resolution,
            drawing,
            cursorOverlay,
            background: { value: theTexture },
          },
        })
      )
    );
    return [composer, cursorPos, drawing, resolution, cursorOverlay, points];
  }, [gl, mouse, size, theTexture]);

  useFrame((_, delta) => {
    controlState.tool.frameHandler({
      delta,
      drawingPoints,
      resolution: size,
      controls: controlState.controls,
      cursor: {
        previous: cursorPositionUniform.value,
        current: mouse,
      },
    });

    cursorPositionUniform.value.copy(mouse);
    resolutionUniform.value.set(size.width, size.height);
    drawingUniform.value = new THREE.DataTexture(drawingPoints, size.width, size.height);
    drawingUniform.value.needsUpdate = true;
    cursorOverlayUniform.value = controlState.tool.cursorOverlay;

    gl.clear();
    gl.autoClear = false;
    textureComposer.render();
  });

  return (
    <TexturePainterControls
      initialTool={props.initialTool}
      registerCursorDownHandler={props.registerCursorDownHandler}
      registerCursorUpHandler={props.registerCursorUpHandler}
      updateTool={tool => {
        controlState.tool = tool;
      }}
      updateControls={controls => {
        Object.assign(controlState.controls, controls);
      }}
    />
  );
}
