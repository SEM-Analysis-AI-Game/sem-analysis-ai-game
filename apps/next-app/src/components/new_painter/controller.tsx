import * as THREE from "three";
import { useEffect, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { clamp } from "three/src/math/MathUtils.js";
import { useSocket } from "../socket-connection";

export type MemoizedPoints = readonly {
  pos: readonly [number, number];
  boundaryEdges: readonly (readonly [number, number])[];
}[];

const kDrawingSmoothStep = 8;

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

  const [, setCurrentAction] = useState<{
    lastCursorPos: readonly [number, number];
    activeSegment: number;
  } | null>(null);

  const socket = useSocket();

  useEffect((): any => {
    if (socket) {
      socket.on(
        "draw",
        (data: {
          from: readonly [number, number];
          to: readonly [number, number];
        }) => {
          let segment = getSegment(segmentBuffer, props.resolution, data.from);
          if (segment === -1) {
            segmentData.push({
              color: new THREE.Color(
                Math.random(),
                Math.random(),
                Math.random()
              ),
            });
            segment = segmentData.length - 1;
          }
          smoothPaint(
            segmentBuffer,
            segment,
            segmentData,
            props.drawing,
            data.to,
            data.from,
            props.resolution,
            props.brushPoints
          );
        }
      );
      return () => socket.off("draw");
    }
  }, [
    socket,
    segmentBuffer,
    segmentData,
    props.resolution,
    props.drawing,
    props.brushPoints,
  ]);

  return useFrame(() => {
    if (props.cursorDown && socket) {
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

      setCurrentAction((currentAction) => {
        const action =
          currentAction ??
          (() => {
            const segment = getSegment(
              segmentBuffer,
              props.resolution,
              pixelPos
            );
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

        socket.emit("draw", { from: action.lastCursorPos, to: pixelPos });
        smoothPaint(
          segmentBuffer,
          action.activeSegment,
          segmentData,
          props.drawing,
          pixelPos,
          action.lastCursorPos,
          props.resolution,
          props.brushPoints
        );

        action.lastCursorPos = pixelPos;
        return action;
      });
    } else {
      setCurrentAction(null);
    }
  });
}

function smoothPaint(
  segmentBuffer: Int32Array,
  activeSegment: number,
  segmentData: {
    color: THREE.Color;
  }[],
  drawing: THREE.DataTexture,
  currentPos: readonly [number, number],
  lastPos: readonly [number, number],
  resolution: readonly [number, number],
  brushPoints: MemoizedPoints
): void {
  draw(
    segmentBuffer,
    activeSegment,
    segmentData,
    drawing,
    currentPos,
    resolution,
    brushPoints
  );

  const current: [number, number] = [currentPos[0], currentPos[1]];

  const length = Math.sqrt(
    Math.pow(current[0] - lastPos[0], 2) + Math.pow(current[1] - lastPos[1], 2)
  );

  const step = [
    (kDrawingSmoothStep * (lastPos[0] - current[0])) / length,
    (kDrawingSmoothStep * (lastPos[1] - current[1])) / length,
  ];

  while (
    step[0] * (lastPos[0] - current[0]) + step[1] * (lastPos[1] - current[1]) >
    0
  ) {
    const currentPos = [
      Math.floor(current[0]),
      Math.floor(current[1]),
    ] as const;

    draw(
      segmentBuffer,
      activeSegment,
      segmentData,
      drawing,
      currentPos,
      resolution,
      brushPoints
    );

    current[0] += step[0];
    current[1] += step[1];
  }
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
