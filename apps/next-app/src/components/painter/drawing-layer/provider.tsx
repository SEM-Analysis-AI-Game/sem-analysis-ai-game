"use client";

import {
  Dispatch,
  PropsWithChildren,
  createContext,
  useContext,
  useReducer,
} from "react";
import {
  DrawingLayer,
  DrawingLayerEvent,
  drawingLayerReducer,
  initialState,
} from "./drawing-layer";
import { useStatistics } from "../statistics";
import { useRendererState } from "../renderer-state";

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
  // the drawing layer needs a reference to the renderer state to update
  // uniforms
  const rendererState = useRendererState();

  // the drawing layer needs to update the statistics
  const [, updateStatistics] = useStatistics();

  const drawingLayer = useReducer(
    drawingLayerReducer,
    initialState(rendererState, updateStatistics)
  );

  return (
    <DrawingLayerContext.Provider value={drawingLayer}>
      {props.children}
    </DrawingLayerContext.Provider>
  );
}
