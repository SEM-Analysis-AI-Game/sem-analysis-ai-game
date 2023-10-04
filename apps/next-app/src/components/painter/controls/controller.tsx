"use client";

import * as THREE from "three";
import { useEffect, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { usePinch } from "@use-gesture/react";
import { usePan, useZoom } from "./provider";
import { PanTool, kPanMultiplier, useTool } from "../tools";
import { useDrawingLayer } from "../drawing-layer";
import { useActionHistory } from "../action-history";

export function PainterController(): null {
  const { mouse, gl, size } = useThree();

  const [zoom, setZoom] = useZoom();
  const [pan, setPan] = usePan();

  const [zooming, setZooming] = useState(false);

  const [cursorDown, setCursorDown] = useState(false);
  const [shiftDown, setShiftDown] = useState(false);

  const [tool] = useTool();

  const panTool = useMemo(() => {
    return new PanTool(0);
  }, []);

  const drawingLayer = useDrawingLayer();

  const history = useActionHistory();

  usePinch(
    (e) => {
      const newZoom = e.offset[0];
      const origin = new THREE.Vector2(
        e.origin[0] - size.left,
        e.origin[1] - size.top
      )
        .divide(new THREE.Vector2(size.width, size.height))
        .subScalar(0.5)
        .multiplyScalar(2.0);
      origin.setY(-origin.y);
      const panBounds = new THREE.Vector2(1.0, 1.0)
        .subScalar(1.0 / Math.sqrt(newZoom))
        .divideScalar(kPanMultiplier);
      setZooming(e.pinching || false);
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

  const [activeSegment, setActiveSegment] = useState(0);

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

  useEffect(() => {
    gl.domElement.addEventListener("pointerdown", (e) => {
      const toolMouse = mouse
        .clone()
        .divideScalar(Math.sqrt(zoom))
        .add(pan.clone().multiplyScalar(kPanMultiplier))
        .multiplyScalar(0.5)
        .addScalar(0.5)
        .multiply(drawingLayer.pixelSize)
        .floor();
      if (!cursorDown) {
        const segment = drawingLayer.segment(toolMouse.x, toolMouse.y);
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

  useEffect(() => {
    gl.domElement.addEventListener("pointerup", () => {
      setCursorDown(false);
    });
    gl.domElement.addEventListener("pointerleave", (e) => {
      setCursorDown(false);
    });
  }, []);

  useFrame(() => {
    const panMouse = mouse
      .clone()
      .divideScalar(Math.sqrt(zoom))
      .add(pan)
      .multiplyScalar(0.5)
      .addScalar(0.5)
      .multiply(drawingLayer.pixelSize)
      .floor();
    const toolMouse = mouse
      .clone()
      .divideScalar(Math.sqrt(zoom))
      .add(pan.clone().multiplyScalar(kPanMultiplier))
      .multiplyScalar(0.5)
      .addScalar(0.5)
      .multiply(drawingLayer.pixelSize)
      .floor();
    if (shiftDown) {
      panTool.frameCallback(
        cursorDown,
        zooming,
        panMouse,
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
        tool.name === "Pan" ? panMouse : toolMouse,
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
