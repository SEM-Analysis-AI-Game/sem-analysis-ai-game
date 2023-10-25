import * as THREE from "three";
import { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { clamp } from "three/src/math/MathUtils.js";
import { DrawEvent, getSegment, kImages, smoothPaintClient } from "@/util";
import { useSocket } from "../socket-connection";

/**
 * processes user input, updates the drawing texture uniforms and
 * emits draw events to the server.
 */
export function PainterController(props: {
  historyIndex: number;
  imageIndex: number;
  zoom: number;
  pan: readonly [number, number];
  cursorDown: boolean;
  resolution: readonly [number, number];
  drawing: THREE.DataTexture;
  segmentBuffer: Int32Array;
  segmentData: { color: THREE.Color }[];
}): null {
  // current mouse position in screen coordinate system ([-1, -1] to [1, 1] with the origin
  // at the center of the screen)
  const { mouse } = useThree();

  // the last cursor position in texture coordinates ([0, 0] at the bottom left corner and,
  // and [resolution[0], resolution[1]] at the top right corner), or null if the cursor is
  // not down.
  const [, setLastCursorPos] = useState<readonly [number, number] | null>(null);

  // the socket connection to the server, or null if the connection has not been established.
  const socket = useSocket();

  // controls whether or not reconcilliation of our local state with the server state is complete.
  // user input should be disabled until this is true.
  const [reconciling, setReconciling] = useState(false);
  const [reconciled, setReconciled] = useState(false);

  // listen for draw events from the server
  useEffect((): any => {
    if (socket && socket.connected) {
      socket.on("draw", (data: DrawEvent) => {
        smoothPaintClient(
          props.segmentBuffer,
          kImages[props.imageIndex].image,
          props.drawing,
          props.segmentData,
          data,
          data.splitInfo.map((info) => ({
            color: new THREE.Color(`#${info.color}`),
            newSegment: info.newSegment,
            oldSegment: info.oldSegment,
            pos: info.pos,
          }))
        );
      });
      socket.emit("join", {
        room: props.imageIndex.toString(),
      });
      setReconciling(true);
      return () => socket.off("draw");
    }
  }, [
    socket,
    props.segmentBuffer,
    props.segmentData,
    props.drawing,
    props.resolution,
    props.imageIndex,
    setReconciling,
  ]);

  useEffect(() => {
    if (socket && socket.connected && reconciling && !reconciled) {
      fetch(
        `/api/state?imageIndex=${props.imageIndex}&historyIndex=${props.historyIndex}`,
        { method: "GET" }
      )
        .then((res) => res.json())
        .then((res) => {
          for (const event of res.events as DrawEvent[]) {
            smoothPaintClient(
              props.segmentBuffer,
              kImages[props.imageIndex].image,
              props.drawing,
              props.segmentData,
              event,
              event.splitInfo.map((info) => ({
                color: new THREE.Color(`#${info.color}`),
                newSegment: info.newSegment,
                oldSegment: info.oldSegment,
                pos: info.pos,
              }))
            );
          }
          setReconciled(true);
          setReconciling(false);
        });
    }
  }, [
    socket,
    props.historyIndex,
    reconciling,
    setReconciling,
    setReconciled,
    reconciled,
  ]);

  // handle updates on each frame
  return useFrame(() => {
    // if the cursor is down and reconcilliation is done, allow drawing
    if (props.cursorDown && socket && reconciled) {
      // gets the pixel position of the cursor in texture coordinates ([0, 0] at the bottom left corner and,
      // and [resolution[0], resolution[1]] at the top right corner)
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

      // the pixel position of the cursor in texture coordinates
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

      // update the last cursor position
      setLastCursorPos((lastCursor) => {
        if (lastCursor) {
          if (lastCursor[0] === pixelPos[0] && lastCursor[1] === pixelPos[1]) {
            // if the cursor has not moved, do nothing
            return lastCursor;
          }
        }

        // get the segment that the cursor is in
        const segment = getSegment(
          props.segmentBuffer,
          props.resolution,
          lastCursor ?? pixelPos
        );

        // color can be undefined if the segment the user is drawing already exists. if
        // they are creating a new segment (I.E. the cursor is not in any segment), then
        // emit the new color to the server.
        const color: THREE.Color | undefined =
          segment === -1
            ? new THREE.Color(Math.random(), Math.random(), Math.random())
            : props.segmentData[segment]!.color;

        // representation used for the smoothPaint method, and for emitting to the server.
        const drawEvent: DrawEvent = {
          from: lastCursor ?? pixelPos,
          to: pixelPos,
          size: 10,
          segment: segment === -1 ? props.segmentData.length : segment,
          segmentColor: color.getHexString(),
          splitInfo: [],
        };

        // paint locally
        drawEvent.splitInfo = smoothPaintClient(
          props.segmentBuffer,
          kImages[props.imageIndex].image,
          props.drawing,
          props.segmentData,
          drawEvent,
          null
        )!.map((info) => ({
          color: info.color.getHexString(),
          newSegment: info.newSegment,
          oldSegment: info.oldSegment,
          pos: info.pos,
        }));

        // emit the draw event to the server
        socket.emit("draw", drawEvent);

        // update the last cursor position
        return pixelPos;
      });
    } else {
      // if the cursor is not down, set the last cursor position to null
      setLastCursorPos(null);
    }
  });
}
