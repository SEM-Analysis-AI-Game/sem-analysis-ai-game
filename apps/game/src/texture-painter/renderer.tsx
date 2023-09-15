import * as THREE from 'three';
import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { fragmentShader, vertexShader } from './shaders';
import { TexturePainterControlState, TexturePainterControls, kInitialControlState } from './controls';
import { Tool } from './tools';

export type FrameCallbackParams = {
  delta: number;
  resolution: THREE.Vector2;
  cursor: {
    previous: THREE.Vector2;
    current: THREE.Vector2;
  };
  drawingPoints: Uint8Array;
  controls: TexturePainterControlState;
};

export type FrameCallback = (params: FrameCallbackParams) => void;

export function TexturePainterRenderer(props: {
  initialTool: Tool;
  setResolution: (resolution: THREE.Vector2) => void;
  registerCursorLeaveHandler: (handler: React.MouseEventHandler) => void;
  registerCursorEnterHandler: (handler: React.MouseEventHandler) => void;
  registerCursorDownHandler: (handler: React.MouseEventHandler) => void;
  registerCursorUpHandler: (handler: React.MouseEventHandler) => void;
}): JSX.Element {
  const { gl, mouse } = useThree();

  const theTexture = useTexture('/the_texture.jpg');

  const controlState = useMemo(() => {
    return {
      tool: props.initialTool,
      controls: kInitialControlState,
      hideCursorOverlay: false,
    };
  }, []);

  const [
    textureComposer,
    cursorPositionUniform,
    drawingUniform,
    cursorOverlayUniform,
    hideCursorOverlayUniform,
    drawingPoints,
  ] = useMemo(() => {
    const screenResolution = new THREE.Vector2(Math.round(theTexture.image.width), Math.round(theTexture.image.height));
    props.setResolution(screenResolution);
    const points = new Uint8Array(screenResolution.width * screenResolution.height * 4);
    const cursorPos = new THREE.Uniform(new THREE.Vector2(...mouse));
    const drawing = new THREE.Uniform(new THREE.Texture());
    const cursorOverlay = new THREE.Uniform(controlState.tool.cursorOverlay);
    const hideCursorOverlay = new THREE.Uniform(false);

    const composer = new EffectComposer(gl);
    composer.addPass(
      new ShaderPass(
        new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            cursorPos,
            drawing,
            hideCursorOverlay,
            cursorOverlay,
            background: { value: theTexture },
          },
        })
      )
    );
    return [composer, cursorPos, drawing, cursorOverlay, hideCursorOverlay, points];
  }, [gl, mouse, theTexture]);

  useFrame((_, delta) => {
    const resolution = new THREE.Vector2(Math.round(theTexture.image.width), Math.round(theTexture.image.height));
    controlState.tool.frameHandler({
      delta,
      drawingPoints,
      resolution,
      controls: controlState.controls,
      cursor: {
        previous: cursorPositionUniform.value,
        current: mouse,
      },
    });

    cursorPositionUniform.value.copy(mouse);
    drawingUniform.value = new THREE.DataTexture(drawingPoints, resolution.width, resolution.height);
    drawingUniform.value.needsUpdate = true;
    cursorOverlayUniform.value = controlState.tool.cursorOverlay;
    hideCursorOverlayUniform.value = controlState.hideCursorOverlay;

    gl.clear();
    gl.autoClear = false;
    textureComposer.render();
  });

  return (
    <TexturePainterControls
      {...props}
      updateTool={tool => {
        controlState.tool = tool;
      }}
      updateControls={controls => {
        Object.assign(controlState.controls, controls);
      }}
      hideCursorOverlay={hide => {
        controlState.hideCursorOverlay = hide;
      }}
    />
  );
}
