"use client";

import * as THREE from "three";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { useDrag, usePinch } from "@use-gesture/react";
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
  const { gl, size } = useThree();

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
  }, []);

  // handle each canvas frame
  useDrag(
    (e) => {
      const cursor = new THREE.Vector2(
        (e.xy[0] - size.left) / size.width,
        (e.xy[1] - size.top) / size.height
      )
        .clone()
        .subScalar(0.5)
        .multiply(new THREE.Vector2(2.0, -2.0))
        .divideScalar(Math.sqrt(controls.zoom))
        .add(controls.pan)
        .divideScalar(2.0)
        .addScalar(0.5)
        .multiply(rendererState.pixelSize)
        .floor();

      const updatedControls = {
        ...controls,
        shiftDown: e.shiftKey,
        cursorDown: e.down,
      };

      updateControls({
        type: "cursor",
        ...updatedControls,
      });

      // use the secondary pan tool if shift is held. we should
      // try to also implement two-finger drag here on mobile.
      if (
        e.shiftKey ||
        e.touches > 1 ||
        controls.zooming ||
        tool.name === "Pan"
      ) {
        secondaryTool.handleFrame(
          secondaryTool,
          cursor,
          updatedControls,
          rendererState.pixelSize,
          updateControls
        );
      } else {
        tool.handleFrame(
          tool,
          cursor,
          updatedControls,
          drawingLayer,
          updateHistory
        );
      }
    },
    {
      target: gl.domElement,
      pointer: {
        touch: true,
      },
    }
  );

  return null;
}
