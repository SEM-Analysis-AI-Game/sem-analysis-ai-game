"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { PainterRenderer } from "./renderer";
import { PainterControls } from "./controls";
import { SegmentInfoOverlay, useStatistics } from "./statistics";
import { PainterController } from "./controller";
import { useRendererState } from "./renderer-state";
import { useDrawingLayer } from "./drawing-layer";
import { useActionHistory } from "./action-history";

/**
 * Responsible for sizing the canvas and initializing the controls and
 * renderer.
 */
export function PainterCanvas(): JSX.Element {
  const rendererState = useRendererState();
  const [drawingLayer, updateDrawingLayer] = useDrawingLayer();
  const [, updateActionHistory] = useActionHistory();
  const [, updateStatistics] = useStatistics();

  // Whenever the background changes we need to resize the canvas
  const [canvasSize] = useMemo(() => {
    // This is used to constrain the size of the canvas
    // while preserving the aspect ratio.
    const inverse = Math.min(
      window.innerWidth / rendererState.pixelSize.x,
      window.innerHeight / rendererState.pixelSize.y,
      1.0
    );

    const canvasSize = rendererState.pixelSize
      .clone()
      .multiplyScalar(inverse)
      .floor();

    return [canvasSize];
  }, [rendererState]);

  useEffect(() => {
    updateDrawingLayer({ type: "reset", rendererState });
    updateStatistics({ type: "clear" });
  }, [rendererState]);

  useEffect(() => {
    updateActionHistory({ type: "reset", drawingLayer });
  }, [drawingLayer]);

  return (
    <div
      className="block m-auto overflow-hidden"
      style={{
        width: canvasSize.x,
        height: canvasSize.y,
      }}
    >
      <PainterControls>
        <SegmentInfoOverlay
          canvasSize={canvasSize}
          backgroundResolution={rendererState.pixelSize}
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
    </div>
  );
}
