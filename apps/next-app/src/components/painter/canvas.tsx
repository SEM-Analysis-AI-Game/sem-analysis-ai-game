"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { PainterRenderer } from "./renderer";
import { useBackground } from "./background-loader";
import { DrawingLayer, DrawingLayerContext } from "./drawing-layer";
import { PainterController, PainterControls } from "./controls";

/**
 * Responsible for sizing the canvas and setting up the drawing layer.
 */
export function PainterCanvas(): JSX.Element {
  const [background] = useBackground();

  if (!background) {
    throw new Error("No background found");
  }

  /**
   * Whenever the background changes we need to resize the canvas and
   * create a new drawing layer.
   */
  const [screenSize, drawingLayer] = useMemo(() => {
    const backgroundResolution = new THREE.Vector2(
      background.image.width,
      background.image.height
    );

    // This is used to constrain the size of the canvas
    // while preserving the aspect ratio.
    const inverse = Math.min(
      window.innerWidth / background.image.width,
      window.innerHeight / background.image.height,
      1.0
    );

    const canvasSize = backgroundResolution
      .clone()
      .multiplyScalar(inverse)
      .floor();

    // this is the component responsible for tracking segments,
    // and filling pixels on the canvas.
    const drawing = new DrawingLayer(backgroundResolution);

    return [canvasSize, drawing];
  }, [background]);

  return (
    <div
      className="block m-auto overflow-hidden"
      style={{
        width: screenSize.x,
        height: screenSize.y,
      }}
    >
      <Canvas>
        <PainterControls>
          <DrawingLayerContext.Provider value={drawingLayer}>
            <PainterController />
            <PainterRenderer />
          </DrawingLayerContext.Provider>
        </PainterControls>
      </Canvas>
    </div>
  );
}
