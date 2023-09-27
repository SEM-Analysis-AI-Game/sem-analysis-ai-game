"use client";

import * as THREE from "three";
import { useDrag, usePinch } from "@use-gesture/react";
import { useCallback, useContext, useEffect, useMemo } from "react";
import { EffectComposer, ShaderPass } from "three-stdlib";
import { useFrame, useThree } from "@react-three/fiber";
import { fragmentShader, kSubdivisions, vertexShader } from "./shaders";
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
  drawings: Uint8Array[];

  /**
   * The current state of the controls.
   */
  controls: ControlsState;
};

/**
 * A function that is called every frame to update the renderer state.
 * Returns true if the drawing layer should be re-rendered.
 */
export type FrameCallback = (params: FrameCallbackParams) => Set<number>;

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
    const zoomUniform = new THREE.Uniform(1.0);
    const panUniform = new THREE.Uniform(new THREE.Vector2(0.0, 0.0));

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

  const panBounds = useCallback((zoom: number) => {
    return new THREE.Vector2(1.0, 1.0).subScalar(1.0 / Math.sqrt(zoom));
  }, []);

  useDrag(
    (drag) => {
      if (painterState.tool.panning) {
        const max = panBounds(uniforms.zoom.value);
        const zoomFactor = Math.sqrt(uniforms.zoom.value / 4.0);
        uniforms.pan.value = uniforms.pan.value
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
      uniforms.zoom.value = pinch.offset[0];
      const max = panBounds(uniforms.zoom.value);
      uniforms.pan.value = mouse
        .clone()
        .divideScalar(uniforms.zoom.value)
        .multiplyScalar(Math.max(pinch.delta[0] * 0.5, 0))
        .add(uniforms.pan.value)
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
      .divideScalar(Math.sqrt(uniforms.zoom.value))
      .add(uniforms.pan.value)
      .clampScalar(-0.999999999, 0.999999999);
    const dirty = painterState.tool.frameHandler({
      delta,
      resolution,
      controls: props.controls,
      drawings: painterState.drawings,
      cursor: {
        previous: uniforms.cursorPos.value,
        current: currentMouse,
      },
    });

    uniforms.cursorPos.value = currentMouse;

    dirty.forEach((index) => {
      uniforms[`drawing${index}`].value = new THREE.DataTexture(
        painterState.drawings[index],
        resolution.width / (kSubdivisions + 1),
        resolution.height / (kSubdivisions + 1)
      );
      uniforms[`drawing${index}`].value.needsUpdate = true;
    });

    gl.clear();
    gl.autoClear = false;

    composer.render();
  });
}
