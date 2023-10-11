"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { PainterRenderer } from "./renderer";
import { useBackground } from "./background-loader";
import { PainterController, PainterControls } from "./controls";
import { SegmentInfoOverlay, StatisticsProvider } from "./statistics";
import { ActionHistoryProvider } from "./action-history";
import { DrawingLayerProvider } from "./drawing-layer";

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
  const [canvasSize, backgroundResolution] = useMemo(() => {
    const resolution = new THREE.Vector2(
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

    const canvasSize = resolution.clone().multiplyScalar(inverse).floor();

    return [canvasSize, resolution];
  }, [background]);

  return (
    <div
      className="block m-auto overflow-hidden"
      style={{
        width: canvasSize.x,
        height: canvasSize.y,
      }}
    >
      <StatisticsProvider>
        <DrawingLayerProvider>
          <ActionHistoryProvider>
            <PainterControls>
              <SegmentInfoOverlay
                canvasSize={canvasSize}
                backgroundResolution={backgroundResolution}
                padding={
                  new THREE.Vector2(
                    (window.innerWidth - canvasSize.x) / 2,
                    (window.innerHeight - canvasSize.y) / 2
                  )
                }
              />
              <Canvas>
                <PainterController />
                <PainterRenderer />
              </Canvas>
            </PainterControls>
          </ActionHistoryProvider>
        </DrawingLayerProvider>
      </StatisticsProvider>
    </div>
  );
}
