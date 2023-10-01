"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import { ControlsContext, PainterControls } from "./controls";
import { PainterRenderer } from "./renderer";
import { useBackground } from "./background-loader";
import { DrawingLayer, DrawingLayerContext } from "./drawing-layer";

const kInitialControls = {
  zoom: 1.0,
  pan: new THREE.Vector2(),
};

export function PainterCanvas(): JSX.Element {
  const [background] = useBackground();

  if (!background) {
    throw new Error("No background found");
  }

  const [screenSize, drawingLayer] = useMemo(() => {
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

  const controls = useState(kInitialControls);

  return (
    <div
      className="block m-auto overflow-hidden"
      style={{
        width: screenSize.x,
        height: screenSize.y,
      }}
    >
      <Canvas>
        <ControlsContext.Provider value={controls}>
          <DrawingLayerContext.Provider value={drawingLayer}>
            <PainterControls />
            <PainterRenderer />
          </DrawingLayerContext.Provider>
        </ControlsContext.Provider>
      </Canvas>
    </div>
  );
}
