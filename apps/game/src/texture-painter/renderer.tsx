import * as THREE from 'three';
import { useMemo, useState } from 'react';
import { useTexture } from '@react-three/drei';
import { Size, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { fragmentShader, vertexShader } from './shaders';
import { TexturePainterControlState, TexturePainterControls, kInitialControlState } from './controls';

export type FrameCallback = (params: {
  delta: number;
  resolution: Size;
  cursor: {
    previous: THREE.Vector2;
    current: THREE.Vector2;
  };
  drawingPoints: Uint8Array;
  controls: TexturePainterControlState;
}) => void;

export function TexturePainterRenderer(props: {
  registerCursorDownHandler: (handler: React.MouseEventHandler) => void;
  registerCursorUpHandler: (handler: React.MouseEventHandler) => void;
}): JSX.Element {
  const [frameHandler, setFrameHandler] = useState<FrameCallback>();

  const { gl, mouse, size } = useThree();

  const theTexture = useTexture('/the_texture.jpg');

  const controls = useMemo(() => {
    return kInitialControlState;
  }, []);

  const cursorOverlayReference = useMemo(() => {
    return { texture: new THREE.Texture() };
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
    const cursorOverlay = new THREE.Uniform(cursorOverlayReference.texture);

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
    if (frameHandler) {
      frameHandler({
        delta,
        controls,
        drawingPoints,
        resolution: size,
        cursor: {
          previous: cursorPositionUniform.value,
          current: mouse,
        },
      });
    }

    cursorPositionUniform.value.copy(mouse);
    resolutionUniform.value.set(size.width, size.height);
    drawingUniform.value = new THREE.DataTexture(drawingPoints, size.width, size.height);
    drawingUniform.value.needsUpdate = true;
    cursorOverlayUniform.value = cursorOverlayReference.texture;

    gl.clear();
    gl.autoClear = false;
    textureComposer.render();
  });

  return (
    <TexturePainterControls
      registerCursorDownHandler={props.registerCursorDownHandler}
      registerCursorUpHandler={props.registerCursorUpHandler}
      registerFrameHandler={frameHandler ? () => {} : setFrameHandler}
      updateControlState={state => {
        Object.assign(controls, state);
      }}
      updateCursorOverlay={texture => {
        cursorOverlayReference.texture = texture;
      }}
    />
  );
}
