"use client";

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
  // the renderer state updates whenever the background changes
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
      window.innerHeight / rendererState.pixelSize.y
    );

    const canvasSize = rendererState.pixelSize
      .clone()
      .multiplyScalar(inverse)
      .floor();

    return [canvasSize];
  }, [rendererState]);

  // clear drawing layer and statistics when the renderer state changes.
  useEffect(() => {
    updateDrawingLayer({ type: "reset", rendererState });
    updateStatistics({ type: "clear" });
  }, [rendererState]);

  // reset the action history when the drawing layer changes.
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
        />
        <Canvas>
          <PainterController />
          <PainterRenderer />
        </Canvas>
      </PainterControls>
    </div>
  );
}
