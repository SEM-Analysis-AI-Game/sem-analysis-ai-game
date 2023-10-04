"use client";

import * as THREE from "three";
import { useEffect, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { usePinch } from "@use-gesture/react";
import { usePan, useZoom } from "./provider";
import { PanTool, kPanMultiplier, useTool } from "../tools";
import { useDrawingLayer } from "../drawing-layer";
import { useActionHistory } from "../action-history";
import { useBackground } from "../background-loader";

/**
 * Listens for input events and updates pan, zoom, and the
 * drawing layer.
 */
export function PainterController(): null {
  // these are provided by the canvas
  const { mouse, gl, size } = useThree();

  const [background] = useBackground();

  if (!background) {
    throw new Error("Background not loaded");
  }

  // these are updated here, while the renderer listens for
  // changes to these values.
  const [zoom, setZoom] = useZoom();
  const [pan, setPan] = usePan();

  // this is used to track whether we are currently zooming
  // so that we can disable drawing tools while zooming.
  const [zooming, setZooming] = useState(false);

  const [cursorDown, setCursorDown] = useState(false);
  const [shiftDown, setShiftDown] = useState(false);

  const [tool] = useTool();

  // this is a secondary tool for panning that can be
  // used by holding shift, and maybe eventually we can
  // use it for two-finger drag on mobile too.
  const panTool = useMemo(() => {
    return new PanTool(0);
  }, []);

  // these are passed to the tool to be modified.
  const drawingLayer = useDrawingLayer();
  const history = useActionHistory();

  // this handles pinch + mouse wheel zooming
  usePinch(
    (e) => {
      const newZoom = e.offset[0];
      setZooming(e.pinching || false);

      // center point (screen coordinates with flipped Y-axis) of the pinching
      // motion, or current mouse position if we are using the mouse wheel.
      const origin = new THREE.Vector2(
        e.origin[0] - size.left,
        e.origin[1] - size.top
      )
        .divide(new THREE.Vector2(size.width, size.height))
        .subScalar(0.5)
        .multiplyScalar(2.0);
      origin.setY(-origin.y);

      // we want to pan along with the zoom in the direction of the origin.
      // TODO: we need a smoother way of doing this, this is not the typical
      // zooming behavior.
      const panBounds = new THREE.Vector2(1.0, 1.0)
        .subScalar(1.0 / Math.sqrt(newZoom))
        .divideScalar(kPanMultiplier);
      setPan(
        origin
          .clone()
          .divideScalar(newZoom)
          .multiplyScalar(Math.max((newZoom - zoom) * 0.5, 0))
          .add(pan)
          .clamp(panBounds.clone().negate(), panBounds)
      );
      setZoom(newZoom);
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

  // this is used to track the current segment that we are drawing on.
  // it is updated when the user clicks on the canvas.
  const [activeSegment, setActiveSegment] = useState(0);

  // keybinds for undo/redo
  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey) {
        if (e.code === "KeyZ") {
          history.undo();
        }
        if (e.code === "KeyY") {
          history.redo();
        }
      }
    });
  }, [history]);

  // clear the history when the background changes
  useEffect(() => {
    history.clear();
  }, [background]);

  // handle cursor down events
  useEffect(() => {
    gl.domElement.addEventListener("pointerdown", (e) => {
      // the cursor position used for the tool
      const toolCursor = mouse
        .clone()
        .divideScalar(Math.sqrt(zoom))
        .add(pan.clone().multiplyScalar(kPanMultiplier))
        .multiplyScalar(0.5)
        .addScalar(0.5)
        .multiply(drawingLayer.pixelSize)
        .floor();
      // if the cursor was not previously down
      if (!cursorDown) {
        // get the segment at the cursor position
        const segment = drawingLayer.segment(toolCursor.x, toolCursor.y);

        // if no segment is found at the cursor position, increment the
        // number of segments and use the new segment, otherwise use the found
        // segment.
        if (segment === -1) {
          drawingLayer.incrementSegments();
        }
        setActiveSegment(
          segment === -1 ? drawingLayer.getNumSegments() : segment
        );
      }
      setCursorDown(true);
      setShiftDown(e.shiftKey);
    });
  }, [drawingLayer, pan, zoom]);

  // handle cursor up event and cursor leave canvas event.
  useEffect(() => {
    gl.domElement.addEventListener("pointerup", () => {
      setCursorDown(false);
    });
    gl.domElement.addEventListener("pointerleave", (e) => {
      setCursorDown(false);
    });
  }, []);

  // handle each canvas frame
  useFrame(() => {
    // TODO: there are two different positions used for the cursor position.
    // this is a hack allowing us to use kPanMultiplier. We should figure
    // out a different way to accomplish this.
    const panCursor = mouse
      .clone()
      .divideScalar(Math.sqrt(zoom))
      .add(pan)
      .multiplyScalar(0.5)
      .addScalar(0.5)
      .multiply(drawingLayer.pixelSize)
      .floor();
    const toolCursor = mouse
      .clone()
      .divideScalar(Math.sqrt(zoom))
      .add(pan.clone().multiplyScalar(kPanMultiplier))
      .multiplyScalar(0.5)
      .addScalar(0.5)
      .multiply(drawingLayer.pixelSize)
      .floor();
    // use the secondary pan tool if shift is held. we should
    // try to also implement two-finger drag here on mobile.
    if (shiftDown) {
      panTool.frameCallback(
        cursorDown,
        zooming,
        panCursor,
        zoom,
        pan,
        setZoom,
        setPan,
        drawingLayer,
        history,
        activeSegment
      );
    } else {
      tool.frameCallback(
        cursorDown,
        zooming,
        tool.name === "Pan" ? panCursor : toolCursor,
        zoom,
        pan,
        setZoom,
        setPan,
        drawingLayer,
        history,
        activeSegment
      );
    }
  });

  return null;
}
