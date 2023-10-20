import * as THREE from "three";
import { useEffect, useMemo, useState } from "react";
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
      socket.on("draw", (data: DrawEvent) => {
        let segment = getSegment(segmentBuffer, props.resolution, data.from);
        if (segment === -1) {
          if (!data.color) {
            throw new Error(
              "Received draw event with a new segment but without color"
            );
          }
          segmentData.push({
            color: new THREE.Color(`#${data.color}`),
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
          props.resolution
        );
      });
      return () => socket.off("draw");
    }
  }, [socket, segmentBuffer, segmentData, props.resolution, props.drawing]);

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

        const drawEvent: DrawEvent = {
          from: action.lastCursorPos,
          to: pixelPos,
          color: currentAction
            ? undefined
            : segmentData[action.activeSegment].color.getHexString(),
        };
        socket.emit("draw", drawEvent);

        smoothPaint(
          segmentBuffer,
          action.activeSegment,
          segmentData,
          props.drawing,
          pixelPos,
          action.lastCursorPos,
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
