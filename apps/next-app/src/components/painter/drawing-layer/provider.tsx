"use client";

import { createContext, useContext } from "react";
import { DrawingLayer } from "./drawing-layer";

/**
 * Context for the current drawing layer.
 */
export const DrawingLayerContext = createContext<DrawingLayer | null>(null);

/**
 * Get the current drawing layer. Must be used within a DrawingLayerContext.
 */
export function useDrawingLayer(): DrawingLayer {
  const drawingLayer = useContext(DrawingLayerContext);

  if (!drawingLayer) {
    throw new Error(
      "useDrawingLayer must be used within a DrawingLayerContext"
    );
  }

  return drawingLayer;
}
