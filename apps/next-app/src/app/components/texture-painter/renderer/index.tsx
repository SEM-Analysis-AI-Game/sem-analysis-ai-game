import * as THREE from "three";
import { useContext, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { fragmentShader, vertexShader } from "./shaders";
import { EffectComposer, ShaderPass } from "three-stdlib";
import { ControlsState } from "../canvas";
import { TexturePainterStateContext } from "../context";

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
  controls: ControlsState;
};

/**
 * A function that is called every frame to update the renderer state.
 */
export type FrameCallback = (params: FrameCallbackParams) => void;

export function TexturePainterRenderer(props: {
  controls: ControlsState;
  background: THREE.Texture;
}): null {
  const { gl, mouse } = useThree();

  const painterState = useContext(TexturePainterStateContext);

  if (!painterState) {
    throw new Error("No painter state found");
  }

  const state = useMemo(() => {
    gl.setClearAlpha(0.0);
    const resolution = new THREE.Vector2(
      Math.round(props.background.image.width),
      Math.round(props.background.image.height)
    );
    const cursorPosUniform = new THREE.Uniform(
      new THREE.Vector2(mouse.x, mouse.y)
    );
    const drawingUniform = new THREE.Uniform(
      new THREE.DataTexture(
        painterState.drawingPoints,
        resolution.width,
        resolution.height
      )
    );
    const cursorOverlayUniform = new THREE.Uniform(
      painterState.tool.cursorOverlay()
    );

    const composer = new EffectComposer(gl);
    composer.addPass(
      new ShaderPass(
        new THREE.ShaderMaterial({
          transparent: true,
          vertexShader,
          fragmentShader,
          uniforms: {
            cursorOverlay: cursorOverlayUniform,
            drawing: drawingUniform,
            cursorPos: cursorPosUniform,
            background: { value: props.background },
          },
        })
      )
    );
    return [
      resolution,
      composer,
      { cursorPosUniform, drawingUniform },
    ] as const;
  }, [
    gl,
    mouse,
    painterState.drawingPoints,
    painterState.tool,
    props.background,
  ]);

  return useFrame((_, delta) => {
    const [resolution, composer, uniforms] = state;
    painterState.tool.frameHandler({
      delta,
      resolution,
      controls: props.controls,
      drawingPoints: painterState.drawingPoints,
      cursor: {
        previous: uniforms.cursorPosUniform.value,
        current: mouse,
      },
    });

    uniforms.cursorPosUniform.value.copy(mouse);
    uniforms.drawingUniform.value = new THREE.DataTexture(
      painterState.drawingPoints,
      resolution.width,
      resolution.height
    );
    uniforms.drawingUniform.value.needsUpdate = true;

    gl.clear();
    gl.autoClear = false;

    composer.render();
  });
}
