import * as THREE from "three";
import { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { clamp } from "three/src/math/MathUtils.js";
import { DrawEvent, getSegment, smoothPaint } from "@/util";
import { useSocket } from "../socket-connection";

export function PainterController(props: {
  zoom: number;
  pan: readonly [number, number];
  cursorDown: boolean;
  resolution: readonly [number, number];
  drawing: THREE.DataTexture;
  segmentBuffer: Int32Array;
  segmentData: { color: THREE.Color }[];
}): null {
  const { mouse } = useThree();

  const [, setCurrentAction] = useState<{
    lastCursorPos: readonly [number, number];
    color: THREE.Color | undefined;
  } | null>(null);

  const socket = useSocket();

  useEffect((): any => {
    if (socket) {
      socket.on("draw", (data: DrawEvent) =>
        smoothPaint(
          data,
          props.segmentBuffer,
          props.segmentData,
          props.drawing,
          props.resolution
        )
      );
      return () => socket.off("draw");
    }
  }, [
    socket,
    props.segmentBuffer,
    props.segmentData,
    props.resolution,
    props.drawing,
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
              props.segmentBuffer,
              props.resolution,
              pixelPos
            );
            if (segment !== -1) {
              return {
                lastCursorPos: pixelPos,
                color: undefined,
              };
            } else {
              return {
                lastCursorPos: pixelPos,
                color: new THREE.Color(
                  Math.random(),
                  Math.random(),
                  Math.random()
                ),
              };
            }
          })();

        const drawEvent: DrawEvent = {
          from: action.lastCursorPos,
          to: pixelPos,
          color: action?.color?.getHexString(),
        };
        socket.emit("draw", drawEvent);

        smoothPaint(
          drawEvent,
          props.segmentBuffer,
          props.segmentData,
          props.drawing,
          props.resolution
        );

        action.lastCursorPos = pixelPos;
        return action;
      });
    } else {
      setCurrentAction(null);
    }
  });
}
