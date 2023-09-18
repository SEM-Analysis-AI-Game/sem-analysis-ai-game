import * as THREE from "three";
import { draw, drawSquare } from "./utils";
import { Tool } from "../tool";
import { pixelToIndex } from "../utils";
import { FrameCallbackParams } from "../../renderer";

export function squareEraser(
  length: number,
  strength: number
): Tool<"Square Eraser"> {
  const cursorOverlayTextureData = new Uint8Array(length * length * 4).fill(
    1.0
  );
  // TODO: FIX CURSOR OVERLAY
  drawSquare(cursorOverlayTextureData, {
    length,
    pos: new THREE.Vector2(length / 2, length / 2),
    resolution: new THREE.Vector2(length, length),
    fillPoint: () => ({ color: new THREE.Color(0, 0, 0), alpha: 1.0 }),
  });
  drawSquare(cursorOverlayTextureData, {
    pos: new THREE.Vector2(length / 2, length / 2),
    resolution: new THREE.Vector2(length, length),
    length: length - 2,
    fillPoint: () => ({ color: new THREE.Color(0, 0, 0), alpha: 0.0 }),
  });
  const cursorOverlayTexture = new THREE.DataTexture(
    cursorOverlayTextureData,
    length,
    length
  );
  cursorOverlayTexture.needsUpdate = true;
  return {
    name: "Square Eraser" as const,
    cursorOverlay: cursorOverlayTexture,
    frameHandler: (params: FrameCallbackParams) => {
      draw({ ...params }, (pos) => {
        drawSquare(params.drawingPoints, {
          length,
          pos,
          resolution: params.resolution,
          fillPoint: (pos) => {
            const index = pixelToIndex(pos, params.resolution);
            const newAlpha = Math.max(
              params.drawingPoints[index + 3] / 255.0 - strength * params.delta,
              0.0
            );
            if (newAlpha === 0.0) {
              return { color: new THREE.Color(0, 0, 0), alpha: 0.0 };
            } else {
              return {
                color: new THREE.Color(
                  params.drawingPoints[index] / 255.0,
                  params.drawingPoints[index + 1] / 255.0,
                  params.drawingPoints[index + 2] / 255.0
                ),
                alpha: newAlpha,
              };
            }
          },
        });
      });
    },
  };
}
