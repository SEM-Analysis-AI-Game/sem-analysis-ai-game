import * as THREE from 'three';
import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { fragmentShader, vertexShader } from './shaders';
import { TexturePainterControlState } from './controls';
import { Tool } from './tools';
import { useTexture } from '@react-three/drei';

/**
 * The parameters passed to the three.js render loop callback.
 */
export type FrameCallbackParams = {
  /**
   * The time in seconds since the last frame.
   */
  delta: number;

  /**
   * The resolution of the background image.
   */
  resolution: THREE.Vector2;

  /**
   * The cursor position in screen coordinates at the end of
   * the previous frame and at the start of the current frame.
   */
  cursor: {
    previous: THREE.Vector2;
    current: THREE.Vector2;
  };

  /**
   * The drawing layer. This is a flattened array of RGBA values.
   * Writing to this array will update the drawing.
   *
   * length = resolution.width * resolution.height * 4
   */
  drawingPoints: Uint8Array;

  /**
   * The current state of the controls.
   */
  controls: TexturePainterControlState;
};

/**
 * A function that is called every frame to update the renderer state.
 */
export type FrameCallback = (params: FrameCallbackParams) => void;

export function TexturePainterRenderer(props: {
  drawingPoints: Uint8Array;
  tool: Tool;
  controls: TexturePainterControlState;
  hideCursorOverlay: boolean;
  texture: THREE.Texture | undefined;
  setTexture: (texture: THREE.Texture) => void;
}): null {
  const { gl, mouse } = useThree();

  const theTexture = useTexture('/the_texture.jpg');

  const state = useMemo(() => {
    if (props.texture) {
      const resolution = new THREE.Vector2(
        Math.round(props.texture.image.width),
        Math.round(props.texture.image.height)
      );
      const cursorPosUniform = new THREE.Uniform(new THREE.Vector2(...mouse));
      const drawingUniform = new THREE.Uniform(
        new THREE.DataTexture(props.drawingPoints, resolution.width, resolution.height)
      );
      const cursorOverlayUniform = new THREE.Uniform(props.tool.cursorOverlay);
      const hideCursorOverlayUniform = new THREE.Uniform(props.hideCursorOverlay);

      const composer = new EffectComposer(gl);
      composer.addPass(
        new ShaderPass(
          new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
              cursorOverlay: cursorOverlayUniform,
              hideCursorOverlay: hideCursorOverlayUniform,
              drawing: drawingUniform,
              cursorPos: cursorPosUniform,
              background: { value: props.texture },
            },
          })
        )
      );
      return [resolution, composer, { cursorPosUniform, drawingUniform }] as const;
    } else {
      props.setTexture(theTexture);
    }
  }, [gl, mouse, props.tool, props.hideCursorOverlay, props.texture, props.setTexture]);

  return useFrame((_, delta) => {
    if (state) {
      const [resolution, composer, uniforms] = state;
      props.tool.frameHandler({
        delta,
        resolution,
        controls: props.controls,
        drawingPoints: props.drawingPoints,
        cursor: {
          previous: uniforms.cursorPosUniform.value,
          current: mouse,
        },
      });

      uniforms.cursorPosUniform.value.copy(mouse);
      uniforms.drawingUniform.value = new THREE.DataTexture(props.drawingPoints, resolution.width, resolution.height);
      uniforms.drawingUniform.value.needsUpdate = true;

      gl.clear();
      gl.autoClear = false;
      composer.render();
    }
  });
}
