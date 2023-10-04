"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { PainterRenderer } from "./renderer";
import { useBackground } from "./background-loader";
import { DrawingLayerProvider } from "./drawing-layer";
import { PainterController, PainterControls } from "./controls";

/**
 * Responsible for sizing the canvas and initializing the controls and
 * renderer.
 */
export function PainterCanvas(): JSX.Element {
  const [background] = useBackground();

  if (!background) {
    throw new Error("No background found");
  }

  // Whenever the background changes we need to resize the canvas
  const screenSize = useMemo(() => {
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

    return canvasSize;
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
          <DrawingLayerProvider>
            <PainterController />
            <PainterRenderer />
          </DrawingLayerProvider>
        </PainterControls>
      </Canvas>
    </div>
  );
}
