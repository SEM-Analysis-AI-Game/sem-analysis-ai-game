import * as THREE from "three";
import { useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { clamp } from "three/src/math/MathUtils.js";

export type MemoizedPoints = readonly {
  pos: readonly [number, number];
  boundaryEdges: readonly (readonly [number, number])[];
}[];

const kDrawingSmoothStep = 10;

export function PainterController(props: {
  zoom: number;
  pan: readonly [number, number];
  cursorDown: boolean;
  resolution: readonly [number, number];
  drawing: THREE.DataTexture;
  brushPoints: MemoizedPoints;
}): null {
  const { mouse } = useThree();

  const [segmentBuffer, segmentData] = useMemo(() => {
    const buffer = new Int32Array(
      props.resolution[0] * props.resolution[1]
    ).fill(-1);
    const data = new Array<{ color: THREE.Color }>();
    return [buffer, data];
  }, [props.resolution]);

  const [currentAction, setCurrentAction] = useState<{
    lastCursorPos: readonly [number, number];
    activeSegment: number;
  } | null>(null);

  return useFrame(() => {
    if (props.cursorDown) {
      const getPixelPos = (
        mousePos: number,
        pan: number,
        resolutionDim: number,
        windowDim: number
      ) =>
        Math.floor(
          clamp(
            ((mousePos * windowDim) / 2 - pan) / props.zoom + resolutionDim / 2,
            0,
            resolutionDim - 1
          )
        );

      const pixelPos = [
        getPixelPos(
          mouse.x,
          props.pan[0],
          props.resolution[0],
          window.innerWidth
        ),
        getPixelPos(
          mouse.y,
          -props.pan[1],
          props.resolution[1],
          window.innerHeight
        ),
      ] as const;

      const action =
        currentAction ??
        (() => {
          const segment = getSegment(segmentBuffer, props.resolution, pixelPos);
          if (segment !== -1) {
            return {
              lastCursorPos: pixelPos,
              activeSegment: segment,
            };
          } else {
            segmentData.push({
              color: new THREE.Color(
                Math.random(),
                Math.random(),
                Math.random()
              ),
            });
            return {
              lastCursorPos: pixelPos,
              activeSegment: segmentData.length - 1,
            };
          }
        })();

      draw(
        segmentBuffer,
        action.activeSegment,
        segmentData,
        props.drawing,
        pixelPos,
        props.resolution,
        props.brushPoints
      );

      if (currentAction) {
        const current: [number, number] = [pixelPos[0], pixelPos[1]];

        const length = Math.sqrt(
          Math.pow(current[0] - currentAction.lastCursorPos[0], 2) +
            Math.pow(current[1] - currentAction.lastCursorPos[1], 2)
        );

        const step = [
          (kDrawingSmoothStep * (currentAction.lastCursorPos[0] - current[0])) /
            length,
          (kDrawingSmoothStep * (currentAction.lastCursorPos[1] - current[1])) /
            length,
        ];

        while (
          step[0] * (currentAction.lastCursorPos[0] - current[0]) +
            step[1] * (currentAction.lastCursorPos[1] - current[1]) >
          0
        ) {
          const currentPos = [
            Math.floor(current[0]),
            Math.floor(current[1]),
          ] as const;

          draw(
            segmentBuffer,
            action.activeSegment,
            segmentData,
            props.drawing,
            currentPos,
            props.resolution,
            props.brushPoints
          );

          current[0] += step[0];
          current[1] += step[1];
        }
      }

      action.lastCursorPos = pixelPos;
      setCurrentAction(action);
    } else {
      setCurrentAction(null);
    }
  });
}

function getSegment(
  segmentBuffer: Int32Array,
  resolution: readonly [number, number],
  pos: readonly [number, number]
): number {
  return segmentBuffer[pos[1] * resolution[0] + pos[0]];
}

const kDrawAlpha = 0.5;
const kBorderAlphaBoost = 0.5;

function draw(
  segmentBuffer: Int32Array,
  activeSegment: number,
  segmentData: readonly { color: THREE.Color }[],
  drawing: THREE.DataTexture,
  pos: readonly [number, number],
  resolution: readonly [number, number],
  points: MemoizedPoints
): void {
  for (const point of points) {
    const pixelPos = [pos[0] + point.pos[0], pos[1] + point.pos[1]] as const;
    if (
      pixelPos[0] >= 0 &&
      pixelPos[1] >= 0 &&
      pixelPos[0] < resolution[0] &&
      pixelPos[1] < resolution[1]
    ) {
      segmentBuffer[pixelPos[1] * resolution[0] + pixelPos[0]] = activeSegment;

      const isBoundary =
        point.boundaryEdges.filter((offset) => {
          const pos = [
            offset[0] + pixelPos[0],
            offset[1] + pixelPos[1],
          ] as const;
          if (
            pos[0] < 0 ||
            pos[1] < 0 ||
            pos[0] >= resolution[0] ||
            pos[1] >= resolution[1]
          ) {
            return true;
          } else {
            const segment = getSegment(segmentBuffer, resolution, pos);
            if (segment !== activeSegment) {
              if (segment !== -1) {
                fillPixel(
                  drawing,
                  pos,
                  resolution,
                  kDrawAlpha + kBorderAlphaBoost,
                  segmentData[segment].color
                );
              }
              return true;
            }
          }
          return false;
        }).length > 0 ||
        pixelPos[0] === 0 ||
        pixelPos[1] === 0 ||
        pixelPos[0] === resolution[0] - 1 ||
        pixelPos[1] === resolution[1] - 1;

      fillPixel(
        drawing,
        pixelPos,
        resolution,
        kDrawAlpha + (isBoundary ? kBorderAlphaBoost : 0),
        segmentData[activeSegment].color
      );
    }
  }
}

function fillPixel(
  drawing: THREE.DataTexture,
  pos: readonly [number, number],
  resolution: readonly [number, number],
  alpha: number,
  color: THREE.Color
): void {
  const pixelIndex = (pos[1] * resolution[0] + pos[0]) * 4;
  const data = drawing.image.data;
  data[pixelIndex] = color.r * 255;
  data[pixelIndex + 1] = color.g * 255;
  data[pixelIndex + 2] = color.b * 255;
  data[pixelIndex + 3] = alpha * 255;
  drawing.needsUpdate = true;
}
