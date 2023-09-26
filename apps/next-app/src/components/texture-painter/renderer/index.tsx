import * as THREE from "three";
import { useDrag, usePinch } from "@use-gesture/react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EffectComposer, ShaderPass } from "three-stdlib";
import { useFrame, useThree } from "@react-three/fiber";
import { fragmentShader, vertexShader } from "./shaders";
import { TexturePainterStateContext } from "../context";
import { fillPixel } from "../tools/utils";

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
   * The current drawing data. Modifying this directly will
   * update the drawing but it will not trigger a re-render.
   */
  data: Uint8Array;

  /**
   * Use this to draw a point on the canvas.
   */
  drawPoint: (pos: THREE.Vector2, color: THREE.Color, alpha: number) => void;

  /**
   * The current state of the controls.
   */
  controls: ControlsState;
};

/**
 * A function that is called every frame to update the renderer state.
 */
export type FrameCallback = (params: FrameCallbackParams) => void;

const kMaxZoom = 6.5;
const kMinZoom = 1.0;

export function TexturePainterRenderer(props: {
  controls: ControlsState;
  background: THREE.Texture;
}): null {
  const { gl, mouse } = useThree();

  const painterState = useContext(TexturePainterStateContext);

  if (!painterState) {
    throw new Error("No painter state found");
  }

  const [resolution, composer, uniforms] = useMemo(() => {
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
            background: { value: props.background },
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
    return new THREE.Vector2(1.0, 1.0).multiplyScalar(
      1 - 1.0 / Math.sqrt(zoom)
    );
  }, []);

  useDrag(
    (drag) => {
      if (painterState.tool.panning) {
        const max = panBounds(uniforms.zoomUniform.value);
        const zoomFactor = Math.sqrt(uniforms.zoomUniform.value * 0.25);
        uniforms.panUniform.value = uniforms.panUniform.value
          .clone()
          .add(
            new THREE.Vector2(
              -drag.delta[0] / (props.background.image.width * zoomFactor),
              drag.delta[1] / (props.background.image.height * zoomFactor)
            )
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

  const [dirty, setDirty] = useState(false);

  return useFrame((_, delta) => {
    const currentMouse = mouse
      .clone()
      .divideScalar(Math.sqrt(uniforms.zoomUniform.value))
      .add(uniforms.panUniform.value);
    painterState.tool.frameHandler({
      delta,
      resolution,
      controls: props.controls,
      data: painterState.drawingPoints,
      drawPoint: (pos, color, alpha) => {
        if (!dirty) {
          setDirty(true);
        }
        fillPixel(painterState.drawingPoints, {
          resolution,
          pos,
          alpha,
          fillColor: color,
        });
      },
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
      setDirty(false);
    }

    gl.clear();
    gl.autoClear = false;

    composer.render();
  });
}
