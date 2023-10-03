"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import { ControlsContext, PainterControls } from "./controls";
import { PainterRenderer } from "./renderer";
import { DrawingLayer, DrawingLayerContext } from "./drawing-layer";
import { useBackground } from "./background-loader";
import { useActionHistory } from "./action-history";
import { PainterOverlay } from "./overlay";


const kInitialControls = {
  zoom: 1.0,
  pan: new THREE.Vector2(),
};

export function PainterCanvas(): JSX.Element {
  const controls = useState(kInitialControls);

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
      <DrawingLayerContext.Provider value={drawingLayer}>
        <PainterOverlay />
        <Canvas>
            <ControlsContext.Provider value={controls}>
              <PainterControls />
              <PainterRenderer />
            </ControlsContext.Provider>
        </Canvas>
      </DrawingLayerContext.Provider>
    </div>
  );
}
