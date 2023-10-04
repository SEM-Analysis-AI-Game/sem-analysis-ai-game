"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { PainterRenderer } from "./renderer";
import { useBackground } from "./background-loader";
import { DrawingLayer, DrawingLayerContext } from "./drawing-layer";
import { useActionHistory } from "./action-history";
import { PainterController, PainterControls } from "./controls";

export function PainterCanvas(): JSX.Element {
  const [background] = useBackground();

  if (!background) {
    throw new Error("No background found");
  }

  const history = useActionHistory();

  const [screenSize, drawingLayer] = useMemo(() => {
    history.clear();
    const backgroundResolution = new THREE.Vector2(
      background.image.width,
      background.image.height
    );

    const maxDim = Math.max(
      background.image.width / window.innerWidth,
      background.image.height / window.innerHeight
    );
    const inverse = Math.min(1.0 / maxDim, 1.0);
    const canvasSize = backgroundResolution
      .clone()
      .multiplyScalar(inverse)
      .floor();

    return [canvasSize, new DrawingLayer(backgroundResolution)];
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
