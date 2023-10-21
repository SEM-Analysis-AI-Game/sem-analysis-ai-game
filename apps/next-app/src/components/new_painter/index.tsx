"use client";

import * as THREE from "three";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useDrag, usePinch } from "@use-gesture/react";
import { Canvas } from "@react-three/fiber";
import { DrawEvent, kImages, smoothPaint } from "@/util";
import { PainterRenderer } from "./renderer";
import { StaticImageData } from "next/image";
import { PainterController } from "./controller";
import { clamp } from "three/src/math/MathUtils.js";
import { useSocket } from "../socket-connection";

/**
 * The max zoom multiplier
 */
const kMaxZoom = 10.0;

/**
 * Finds the scale factor to fit the image to the screen.
 */
function scale(image: StaticImageData): number {
  return Math.min(
    window.innerWidth / image.width,
    window.innerHeight / image.height
  );
}

export function Painter(props: {
  imageIndex: number;
  initialState: DrawEvent[];
}): JSX.Element {
  // the image to draw on
  const image = useMemo(() => kImages[props.imageIndex], [props.imageIndex]);

  // initialize client-side state
  const [segmentBuffer, segmentData, resolution, drawing] = useMemo(() => {
    // the texture we will use for drawing
    const texture = new THREE.DataTexture(
      new Uint8Array(image.width * image.height * 4),
      image.width,
      image.height
    );

    // this is necessary for the texture to use transparency
    texture.premultiplyAlpha = true;

    // a 2D array where each element denotes the segment index of a pixel
    const buffer = new Int32Array(image.width * image.height).fill(-1);

    // stores information about each segment
    const data: { color: THREE.Color }[] = [];

    // draw the initial state
    for (const event of props.initialState) {
      smoothPaint(event, buffer, data, texture, [image.width, image.height]);
    }

    return [buffer, data, [image.width, image.height] as const, texture];
  }, [image, props.initialState]);

  // on the server render we can initialize a zoom of 1, which will render the image
  // at its native resolution
  const [zoom, setZoom] = useState(1);

  // once the client loads, we can set the zoom to fit the image to the screen
  useEffect(() => {
    setZoom(scale(image));
  }, [image]);

  // the pan offset in screen pixels. [0, 0] means the image is centered. Moving 1 pixel
  // in any direction will result in the image moving 1 pixel in that direction on the screen.
  // this means that we will need to transform this offset when we zoom in/out in order to
  // maintain a smooth zoom towards the pixel at the cursor location.
  //
  // this is also clamped to the image bounds such that the center of the screen is always
  // within the image.
  const [pan, setPan] = useState<readonly [number, number]>([0, 0]);

  // handle zooming
  usePinch(
    (e) => {
      // the cursor position in screen pixel coordinates, centered so that [0, 0]
      // is the center of the screen and [window.innerWidth / 2, window.innerHeight / 2]
      // is the top right corner. this is going to be used to calculate the new pan offset.
      const cursor = [
        e.origin[0] - window.innerWidth / 2,
        e.origin[1] - window.innerHeight / 2,
      ];

      const size = [
        (resolution[0] * e.offset[0]) / 2,
        (resolution[1] * e.offset[0]) / 2,
      ] as const;

      // copies the previous zoom level so we don't reference the updated zoom level
      // when the callback in setPan is triggered.
      const previousZoom = zoom;

      // update the pan so that the cursor position stays fixed on the same image pixel
      setPan((pan) => {
        // calculate the new pan for a given axis
        const newPan = (axis: 0 | 1) => {
          return clamp(
            pan[axis] -
              ((cursor[axis] - pan[axis]) * (e.offset[0] - previousZoom)) /
                previousZoom,
            -size[axis],
            size[axis]
          );
        };
        return [newPan(0), newPan(1)];
      });

      // update the zoom
      setZoom(e.offset[0]);
    },
    // only enable pinch to zoom on the client
    typeof window !== "undefined"
      ? {
          pinchOnWheel: true,
          modifierKey: null,
          pointer: {
            touch: true,
          },
          scaleBounds: {
            min: scale(image),
            max: kMaxZoom,
          },
          target: document,
        }
      : undefined
  );

  // the socket connection, or null if we are not connected to the server.
  const socket = useSocket();

  // handle cursor down/up. this is used solely for controlling when the user is drawing
  // segments. this is set to false if we are panning (despite the fact that the cursor
  // would technically be down).
  const [cursorDown, setCursorDown] = useState(false);

  // the last cursor position in screen pixel coordinates, or null if the cursor is not down.
  // this is not clamped, and it is centered at the bottom left corner of the screen. I.E,
  // [0, 0] is the bottom left corner, and [window.innerWidth, window.innerHeight] is the top
  // right corner. this is used solely for panning.
  const [, setPanAnchor] = useState<readonly [number, number] | null>(null);

  // this triggers when the mouse is pressed/released and when the number
  // of fingers touching the screen changes.
  useDrag(
    (e) => {
      // if the shift + mouse are down, or if we are touching with multiple fingers, then we
      // should pan the image.
      if ((e.down && e.shiftKey) || e.touches > 1) {
        setPanAnchor((lastCursor) => {
          if (lastCursor) {
            const currentSize = [
              (resolution[0] * zoom) / 2,
              (resolution[1] * zoom) / 2,
            ];
            setPan((pan) => {
              const delta = [e.xy[0] - lastCursor[0], e.xy[1] - lastCursor[1]];
              const cursorPos = (axis: 0 | 1) => {
                return clamp(
                  pan[axis] + delta[axis],
                  -currentSize[axis],
                  currentSize[axis]
                );
              };
              return [cursorPos(0), cursorPos(1)];
            });
          }
          setCursorDown(false);
          return e.xy;
        });
      } else {
        // if we are not panning and we are connected to the websocket, then
        // update the cursor down state so we start/stop drawing
        if (socket) {
          setCursorDown(e.down);
        }
        setPanAnchor(null);
      }
    },
    // only enable drag on the client
    typeof window !== "undefined"
      ? {
          pointer: {
            touch: true,
          },
          target: document,
        }
      : undefined
  );

  return (
    <div className="flex h-screen justify-center items-center">
      <div
        className="absolute"
        style={{
          width: `${image.width * zoom}px`,
          height: `${image.height * zoom}px`,
          transform: `translate(${pan[0]}px, ${pan[1]}px)`,
        }}
      >
        <Image
          className="touch-none pointer-events-none"
          src={image}
          alt="SEM image"
          fill
        />
      </div>
      <Canvas>
        <PainterController
          resolution={resolution}
          zoom={zoom}
          pan={pan}
          cursorDown={cursorDown}
          drawing={drawing}
          segmentBuffer={segmentBuffer}
          segmentData={segmentData}
        />
        <PainterRenderer
          canvasSize={[resolution[0] * zoom, resolution[1] * zoom]}
          drawing={drawing}
          pan={pan}
        />
      </Canvas>
    </div>
  );
}
