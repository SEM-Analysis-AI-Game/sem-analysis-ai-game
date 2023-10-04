"use client";

import * as THREE from "three";
import { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { DrawingLayer } from "./drawing-layer";
import { useBackground } from "../background-loader";

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

export function DrawingLayerProvider(props: PropsWithChildren): JSX.Element {
  const [background] = useBackground();

  if (!background) {
    throw new Error("No background found");
  }

  const drawingLayer = useMemo(() => {
    return new DrawingLayer(
      new THREE.Vector2(background.image.width, background.image.height)
    );
  }, [background]);

  return (
    <DrawingLayerContext.Provider value={drawingLayer}>
      {props.children}
    </DrawingLayerContext.Provider>
  );
}
