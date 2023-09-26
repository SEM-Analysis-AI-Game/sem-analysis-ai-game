"use client";

import * as THREE from "three";
import { useDrag, usePinch } from "@use-gesture/react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EffectComposer, ShaderPass } from "three-stdlib";
import { useFrame, useThree } from "@react-three/fiber";
import { fragmentShader, vertexShader } from "./shaders";
import { TexturePainterStateContext } from "./context";
import { TexturePainterLoadedState } from "./state";

type ControlsState = {
  cursorDown: boolean;
};

/**
 * The parameters passed to the three.js render loop callback.
 */
export type FrameCallbackParams = {
  /**
   * The time in seconds since the last frame.
   */
  delta: number;

  /**
   * The resolution of the canvas.
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
   * The current drawing data. Modify this to draw on the canvas.
   */
  data: Uint8Array;

  /**
   * The current state of the controls.
   */
  controls: ControlsState;
};

/**
 * A function that is called every frame to update the renderer state.
 * Returns true if the drawing layer should be re-rendered.
 */
export type FrameCallback = (params: FrameCallbackParams) => boolean;

const kMaxZoom = 6.5;
const kMinZoom = 1.0;

export function TexturePainterRenderer(props: {
  controls: ControlsState;
}): null {
  const { gl, mouse } = useThree();

  const painterState = useContext(TexturePainterStateContext);

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
    const hideCursorUniform = new THREE.Uniform(painterState.hideCursor);
    const zoomUniform = new THREE.Uniform(1.0);
    const panUniform = new THREE.Uniform(new THREE.Vector2(0.0, 0.0));

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
            hideCursorOverlay: hideCursorUniform,
            zoom: zoomUniform,
            pan: panUniform,
            background: { value: painterState.background },
          },
        })
      )
    );
    return [
      resolution,
      composer,
      {
        cursorPosUniform,
        drawingUniform,
        cursorOverlayUniform,
        hideCursorUniform,
        panUniform,
        zoomUniform,
      },
    ] as const;
  }, []);

  useEffect(() => {
    uniforms.hideCursorUniform.value = painterState.hideCursor;
  }, [painterState.hideCursor]);

  useEffect(() => {
    uniforms.cursorOverlayUniform.value = painterState.tool.cursorOverlay();
  }, [painterState.tool]);

  const panBounds = useCallback((zoom: number) => {
    return new THREE.Vector2(1.0, 1.0).subScalar(1.0 / Math.sqrt(zoom));
  }, []);

  useDrag(
    (drag) => {
      if (painterState.tool.panning) {
        const max = panBounds(uniforms.zoomUniform.value);
        const zoomFactor = Math.sqrt(uniforms.zoomUniform.value / 4.0);
        uniforms.panUniform.value = uniforms.panUniform.value
          .clone()
          .add(
            new THREE.Vector2(-drag.delta[0], drag.delta[1])
              .divide(resolution)
              .divideScalar(zoomFactor)
          )
          .clamp(max.clone().negate(), max);
      }
    },
    {
      pointer: {
        touch: true,
      },
      target: gl.domElement,
    }
  );

  usePinch(
    (pinch) => {
      uniforms.zoomUniform.value = pinch.offset[0];
      const max = panBounds(uniforms.zoomUniform.value);
      uniforms.panUniform.value = mouse
        .clone()
        .divideScalar(uniforms.zoomUniform.value)
        .multiplyScalar(Math.max(pinch.delta[0] * 0.5, 0))
        .add(uniforms.panUniform.value)
        .clamp(max.clone().negate(), max);
    },
    {
      pinchOnWheel: true,
      modifierKey: null,
      pointer: {
        touch: true,
      },
      scaleBounds: {
        min: kMinZoom,
        max: kMaxZoom,
      },
      target: gl.domElement,
    }
  );

  return useFrame((_, delta) => {
    const currentMouse = mouse
      .clone()
      .divideScalar(Math.sqrt(uniforms.zoomUniform.value))
      .add(uniforms.panUniform.value)
      .clampScalar(-1.0, 1.0);
    const dirty = painterState.tool.frameHandler({
      delta,
      resolution,
      controls: props.controls,
      data: painterState.drawingPoints,
      cursor: {
        previous: uniforms.cursorPosUniform.value,
        current: currentMouse,
      },
    });

    uniforms.cursorPosUniform.value = currentMouse;

    if (dirty) {
      uniforms.drawingUniform.value = new THREE.DataTexture(
        painterState.drawingPoints,
        resolution.width,
        resolution.height
      );
      uniforms.drawingUniform.value.needsUpdate = true;
    }

    gl.clear();
    gl.autoClear = false;

    composer.render();
  });
}
