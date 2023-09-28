"use client";

import * as THREE from "three";
import { useContext, useEffect, useMemo } from "react";
import { EffectComposer, ShaderPass } from "three-stdlib";
import { useFrame, useThree } from "@react-three/fiber";
import { fragmentShader, kSubdivisions, vertexShader } from "./shaders";
import {
  TexturePainterActionDispatchContext,
  TexturePainterStateContext,
} from "./context";
import { TexturePainterLoadedState } from "./state";

/**
 * The parameters passed to the three.js render loop callback.
 */
export type FrameCallbackParams = {
  /**
   * The time in seconds since the last frame.
   */
  delta: number;

  /**
   * The cursor position in screen coordinates at the end of
   * the previous frame and at the start of the current frame.
   */
  cursor: {
    previous: THREE.Vector2;
    current: THREE.Vector2;
  };

  painterState: TexturePainterLoadedState;
};

/**
 * A function that is called every frame to update the renderer state.
 * Returns true if the drawing layer should be re-rendered.
 */
export type FrameCallback = (params: FrameCallbackParams) => Set<number>;

export function TexturePainterRenderer(): null {
  const { gl, mouse } = useThree();

  const painterDispatch = useContext(TexturePainterActionDispatchContext);
  const painterState = useContext(TexturePainterStateContext);

  if (!painterDispatch) {
    throw new Error("No painter dispatch found");
  }

  if (!painterState) {
    throw new Error("No painter state found");
  }

  if (!(painterState instanceof TexturePainterLoadedState)) {
    throw new Error("Painter state not loaded");
  }

  const [resolution, composer, uniforms] = useMemo(() => {
    gl.setClearAlpha(0.0);
    const resolution = new THREE.Vector2(
      painterState.background.image.width,
      painterState.background.image.height
    ).round();
    const cursorPosUniform = new THREE.Uniform(
      new THREE.Vector2(mouse.x, mouse.y)
    );
    const drawingResolution = resolution
      .clone()
      .divideScalar(painterState.drawings.length);
    const drawingUniforms = painterState.drawings.map(
      (drawing) =>
        new THREE.Uniform(
          new THREE.DataTexture(
            drawing,
            drawingResolution.x,
            drawingResolution.y
          )
        )
    );
    const cursorOverlayUniform = new THREE.Uniform(
      painterState.tool.cursorOverlay()
    );
    const hideCursorUniform = new THREE.Uniform(painterState.hideCursor);
    const zoomUniform = new THREE.Uniform(painterState.zoom);
    const panUniform = new THREE.Uniform(painterState.pan);

    const uniforms: Record<string, THREE.Uniform> = {
      cursorOverlay: cursorOverlayUniform,
      cursorPos: cursorPosUniform,
      hideCursorOverlay: hideCursorUniform,
      zoom: zoomUniform,
      pan: panUniform,
      background: new THREE.Uniform(painterState.background),
    };

    for (let i = 0; i < drawingUniforms.length; i++) {
      uniforms[`drawing${i}`] = drawingUniforms[i];
    }

    const composer = new EffectComposer(gl);
    composer.addPass(
      new ShaderPass(
        new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms,
          transparent: true,
        })
      )
    );
    return [resolution, composer, uniforms] as const;
  }, []);

  useEffect(() => {
    uniforms.hideCursorOverlay.value = painterState.hideCursor;
  }, [painterState.hideCursor]);

  useEffect(() => {
    uniforms.cursorOverlay.value = painterState.tool.cursorOverlay();
  }, [painterState.tool]);

  useEffect(() => {
    uniforms.zoom.value = painterState.zoom;
  }, [painterState.zoom]);

  useEffect(() => {
    uniforms.pan.value = painterState.pan;
  }, [painterState.pan]);

  return useFrame((_, delta) => {
    const currentMouse = mouse
      .clone()
      .divideScalar(Math.sqrt(uniforms.zoom.value))
      .add(uniforms.pan.value)
      .clampScalar(-0.999999999, 0.999999999);
    const dirty = painterState.tool.frameHandler({
      delta,
      painterState,
      cursor: {
        previous: uniforms.cursorPos.value,
        current: currentMouse,
      },
    });

    uniforms.cursorPos.value = currentMouse;

    dirty.forEach((index) => {
      uniforms[`drawing${index}`].value = new THREE.DataTexture(
        painterState.drawings[index],
        Math.floor(resolution.width / (kSubdivisions + 1)),
        Math.floor(resolution.height / (kSubdivisions + 1))
      );
      uniforms[`drawing${index}`].value.needsUpdate = true;
    });

    gl.clear();
    gl.autoClear = false;

    composer.render();
  });
}
