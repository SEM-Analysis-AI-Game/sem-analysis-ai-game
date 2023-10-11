"use client";

import * as THREE from "three";
import {
  Dispatch,
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";
import {
  DrawingLayer,
  DrawingLayerEvent,
  drawingLayerReducer,
  initialState,
} from "./drawing-layer";
import { useBackground } from "../background-loader";
import { useStatistics } from "../statistics";

/**
 * Context for the current drawing layer.
 */
export const DrawingLayerContext = createContext<
  [DrawingLayer, Dispatch<DrawingLayerEvent>] | null
>(null);

/**
 * Get the current drawing layer. Must be used within a DrawingLayerContext.
 */
export function useDrawingLayer(): [DrawingLayer, Dispatch<DrawingLayerEvent>] {
  const drawingLayer = useContext(DrawingLayerContext);

  if (!drawingLayer) {
    throw new Error(
      "useDrawingLayer must be used within a DrawingLayerContext"
    );
  }

  return drawingLayer;
}

/**
 * Provides a drawing layer context.
 */
export function DrawingLayerProvider(props: PropsWithChildren): JSX.Element {
  // the drawing layer needs to know the background size
  const [background] = useBackground();

  if (!background) {
    throw new Error("No background found");
  }

  // the drawing layer needs to update the statistics
  const [, updateStatistics] = useStatistics();

  const drawingLayer = useReducer(
    drawingLayerReducer,
    new THREE.Vector2(background.image.width, background.image.height),
    (pixelSize) => initialState(pixelSize, updateStatistics)
  );

  // reset the drawing layer when the background changes
  useEffect(() => {
    drawingLayer[1]({
      type: "reset",
      pixelSize: new THREE.Vector2(
        background.image.width,
        background.image.height
      ),
    });
  }, [background]);

  return (
    <DrawingLayerContext.Provider value={drawingLayer}>
      {props.children}
    </DrawingLayerContext.Provider>
  );
}
