"use client";

import * as THREE from "three";
import { useEffect, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { usePinch } from "@use-gesture/react";
import { useCursorDown, usePan, useZoom } from "./provider";
import { PanTool, useTool } from "../tools";
import { useDrawingLayer } from "../drawing-layer";
import { useActionHistory } from "../action-history";
import { useBackground } from "../background-loader";
import { useStatistics } from "../statistics";

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

  const [shiftDown, setShiftDown] = useState(false);
  const [cursorDown, setCursorDown] = useCursorDown();
  const [cursorPreviouslyDown, setCursorPreviouslyDown] = useState(false);

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

      const panBounds = new THREE.Vector2(1.0, 1.0).subScalar(
        1.0 / Math.sqrt(newZoom)
      );
      setPan(pan.clamp(panBounds.clone().negate(), panBounds));
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

  // used for updating the statistics information after
  // each draw action.
  const [, updateStatistics] = useStatistics();

  // handle cursor up/down event and cursor leave canvas event.
  useEffect(() => {
    gl.domElement.addEventListener("pointerdown", (e) => {
      setCursorDown(true);
      setShiftDown(e.shiftKey);
    });
    gl.domElement.addEventListener("pointerup", () => {
      setCursorDown(false);
    });
    gl.domElement.addEventListener("pointerleave", (e) => {
      setCursorDown(false);
    });
  }, []);

  // handle each canvas frame
  useFrame(() => {
    const cursor = mouse
      .clone()
      .divideScalar(Math.sqrt(zoom))
      .add(pan)
      .multiplyScalar(0.5)
      .addScalar(0.5)
      .multiply(drawingLayer.pixelSize)
      .floor();

    let currentSegment = activeSegment;

    // if the cursor was not previously down
    if (!cursorPreviouslyDown && cursorDown) {
      // get the segment at the cursor position
      const segment = drawingLayer.segment(cursor.x, cursor.y);

      // if no segment is found at the cursor position, increment the
      // number of segments and use the new segment, otherwise use the found
      // segment.
      if (segment === -1) {
        drawingLayer.incrementSegments();
      }
      currentSegment = segment === -1 ? drawingLayer.getNumSegments() : segment;
      setActiveSegment(currentSegment);
      setCursorPreviouslyDown(true);
    }

    if (!cursorDown && cursorPreviouslyDown) {
      setCursorPreviouslyDown(false);
    }

    // use the secondary pan tool if shift is held. we should
    // try to also implement two-finger drag here on mobile.
    (shiftDown ? panTool : tool).frameCallback(
      cursorDown,
      zooming,
      cursor,
      zoom,
      pan,
      setZoom,
      setPan,
      updateStatistics,
      drawingLayer,
      history,
      currentSegment
    );
  });

  return null;
}
