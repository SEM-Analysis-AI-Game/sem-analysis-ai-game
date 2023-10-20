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

function scale(image: StaticImageData): number {
  return Math.min(
    window.innerWidth / image.width,
    window.innerHeight / image.height
  );
}

const kMaxZoom = 10.0;

export function Painter(props: {
  imageIndex: number;
  initialState: DrawEvent[];
}): JSX.Element {
  const image = useMemo(() => kImages[props.imageIndex], []);
  const [segmentBuffer, segmentData, resolution, drawing] = useMemo(() => {
    const texture = new THREE.DataTexture(
      new Uint8Array(image.width * image.height * 4),
      image.width,
      image.height
    );
    const buffer = new Int32Array(image.width * image.height).fill(-1);
    const data: { color: THREE.Color }[] = [];

    for (const event of props.initialState) {
      smoothPaint(event, buffer, data, texture, [image.width, image.height]);
    }

    texture.premultiplyAlpha = true;
    texture.needsUpdate = true;
    return [buffer, data, [image.width, image.height] as const, texture];
  }, [image, props.initialState]);

  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setZoom(scale(image));
  }, [image]);

  const [pan, setPan] = useState<readonly [number, number]>([0, 0]);

  const [lastCursor, setLastCursor] = useState<
    readonly [number, number] | null
  >(null);

  usePinch(
    (e) => {
      const cursor = [
        e.origin[0] - window.innerWidth / 2,
        e.origin[1] - window.innerHeight / 2,
      ];

      const previousZoom = zoom;

      const size = [
        (resolution[0] * e.offset[0]) / 2,
        (resolution[1] * e.offset[0]) / 2,
      ] as const;

      setPan((pan) => {
        const cursorPosition = (axis: 0 | 1) => {
          return clamp(
            pan[axis] -
              ((cursor[axis] - pan[axis]) * (e.offset[0] - previousZoom)) /
                previousZoom,
            -size[axis],
            size[axis]
          );
        };
        return [cursorPosition(0), cursorPosition(1)];
      });
      setZoom(e.offset[0]);
    },
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

  const [cursorDown, setCursorDown] = useState(false);

  const socket = useSocket();

  useDrag(
    (e) => {
      if ((e.down && e.shiftKey) || e.touches > 1) {
        setLastCursor((lastCursor) => {
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
        if (socket) {
          setCursorDown(e.down);
        }
        setLastCursor(null);
      }
    },
    {
      pointer: {
        touch: true,
      },
      target: typeof window !== "undefined" ? document : undefined,
    }
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
