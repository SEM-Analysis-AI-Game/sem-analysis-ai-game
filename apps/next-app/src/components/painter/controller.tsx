"use client";

import * as THREE from "three";
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { usePinch } from "@use-gesture/react";
import { panTool, useTool } from "./tools";
import { useDrawingLayer } from "./drawing-layer";
import { useActionHistory } from "./action-history";
import { useControls } from "./controls";
import { useRendererState } from "./renderer-state";

/**
 * Listens for input events and updates pan, zoom, and the
 * drawing layer.
 */
export function PainterController(): null {
  // these are provided by the canvas
  const { mouse, gl, size } = useThree();

  // this is a secondary tool for panning that can be
  // used by holding shift, and maybe eventually we can
  // use it for two-finger drag on mobile too.
  const secondaryTool = useMemo(() => {
    return panTool(0);
  }, []);

  const [tool] = useTool();
  const [drawingLayer] = useDrawingLayer();
  const [, updateHistory] = useActionHistory();
  const [controls, updateControls] = useControls();
  const rendererState = useRendererState();

  // this handles pinch + mouse wheel zooming
  usePinch(
    (e) => {
      const origin = new THREE.Vector2(
        (e.origin[0] - size.left) / size.width,
        (e.origin[1] - size.top) / size.height
      )
        .multiplyScalar(2.0)
        .subScalar(1.0)
        .multiply(new THREE.Vector2(1, -1))
        .divideScalar(Math.sqrt(controls.zoom))
        .add(controls.pan);

      updateControls({
        type: "zoom",
        newZoom: e.offset[0],
        zooming: e.pinching || false,
        origin,
      });
    },
    {
      pinchOnWheel: true,
      modifierKey: null,
      pointer: {
        touch: true,
      },
      scaleBounds: {
        min: 1.0,
      },
      target: gl.domElement,
    }
  );

  // handle undo/redo, cursor up/down, and cursor leave canvas event.
  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey) {
        if (e.code === "KeyZ") {
          updateHistory({ type: "undo" });
        }
        if (e.code === "KeyY") {
          updateHistory({ type: "redo" });
        }
      }
    });
    gl.domElement.addEventListener("pointerdown", (e) => {
      updateControls({
        type: "cursor",
        cursorDown: true,
        shiftDown: e.shiftKey,
      });
    });
    gl.domElement.addEventListener("pointerup", (e) => {
      updateControls({
        type: "cursor",
        cursorDown: false,
        shiftDown: e.shiftKey,
      });
    });
    gl.domElement.addEventListener("pointerleave", (e) => {
      updateControls({
        type: "cursor",
        cursorDown: false,
        shiftDown: e.shiftKey,
      });
    });
  }, []);

  // handle each canvas frame
  useFrame(() => {
    const cursor = mouse
      .clone()
      .divideScalar(Math.sqrt(controls.zoom))
      .add(controls.pan)
      .multiplyScalar(0.5)
      .addScalar(0.5)
      .multiply(rendererState.pixelSize)
      .floor();

    // use the secondary pan tool if shift is held. we should
    // try to also implement two-finger drag here on mobile.
    if (controls.shiftDown || controls.zooming || tool.name === "Pan") {
      secondaryTool.handleFrame(
        secondaryTool,
        cursor,
        controls,
        rendererState.pixelSize,
        updateControls
      );
    } else {
      tool.handleFrame(tool, cursor, controls, drawingLayer, updateHistory);
    }
  });

  return null;
}
