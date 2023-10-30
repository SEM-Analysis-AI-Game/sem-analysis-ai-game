import { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { clamp } from "three/src/math/MathUtils.js";
import { useSocket } from "../socket-connection";
import { DrawEvent, kImages } from "@/common";
import {
  ClientState,
  fillUpdatedSegment,
  recomputeSegmentsClient,
  smoothPaintClient,
} from "@/client";

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
  state: ClientState;
}): null {
  // current pointer position in screen coordinate system ([-1, -1] to [1, 1] with the origin
  // at the center of the screen)
  const { pointer } = useThree();

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
      socket.on(
        "draw",
        (data: {
          draw: DrawEvent;
          fill: {
            boundary: [number, number][];
            fillStart: [number, number] | undefined;
          }[];
        }) => {
          smoothPaintClient(props.state, data.draw, false);
          for (const fill of data.fill) {
            fillUpdatedSegment(props.state, fill, [
              kImages[props.imageIndex].width,
              kImages[props.imageIndex].height,
            ]);
          }
        }
      );
      socket.emit("join", {
        room: props.imageIndex.toString(),
      });
      setReconciling(true);
      return () => socket.off("draw");
    }
  }, [socket, props.state, props.imageIndex, setReconciling]);

  useEffect(() => {
    if (socket && socket.connected && reconciling && !reconciled) {
      fetch(
        `/api/state?imageIndex=${props.imageIndex}&historyIndex=${props.historyIndex}`
      )
        .then((res) => res.json())
        .then((res) => {
          for (const eventData of res.initialState) {
            if (eventData.type === "DrawNode") {
              smoothPaintClient(props.state, eventData.event, false);
            } else {
              fillUpdatedSegment(props.state, eventData.event, [
                kImages[props.imageIndex].width,
                kImages[props.imageIndex].height,
              ]);
            }
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
        pointerPos: number,
        pan: number,
        resolutionDim: number,
        windowDim: number
      ) =>
        Math.floor(
          clamp(
            ((pointerPos * windowDim) / 2 - pan) / props.zoom +
              resolutionDim / 2,
            0,
            resolutionDim - 1
          )
        );

      // the pixel position of the cursor in texture coordinates
      const pixelPos = [
        getPixelPos(
          pointer.x,
          props.pan[0],
          kImages[props.imageIndex].width,
          window.innerWidth
        ),
        getPixelPos(
          pointer.y,
          -props.pan[1],
          kImages[props.imageIndex].height,
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

        const drawEvent: DrawEvent = {
          from: lastCursor ?? pixelPos,
          to: pixelPos,
          size: 10,
        };

        const effectedSegments = smoothPaintClient(
          props.state,
          drawEvent,
          true
        );
        recomputeSegmentsClient(props.state, effectedSegments);

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
