import * as THREE from "three";
import ExportedImage from "next-image-export-optimizer";
import { useEffect, useMemo, useState } from "react";
import { useDrag, usePinch } from "@use-gesture/react";
import { Canvas } from "@react-three/fiber";
import { kImages } from "@/util";
import { PainterRenderer } from "./renderer";
import { StaticImageData } from "next/image";
import { MemoizedPoints, PainterController } from "./controller";
import { clamp } from "three/src/math/MathUtils.js";

function scale(image: StaticImageData): number {
  return Math.min(
    window.innerWidth / image.width,
    window.innerHeight / image.height
  );
}

const kMaxZoom = 10.0;

export function Painter(props: { imageIndex: number }): JSX.Element {
  const image = useMemo(() => kImages[props.imageIndex], []);
  const [resolution, drawing] = useMemo(() => {
    const texture = new THREE.DataTexture(
      new Uint8Array(image.width * image.height * 4),
      image.width,
      image.height
    );
    texture.premultiplyAlpha = true;
    return [[image.width, image.height] as const, texture];
  }, [image]);

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

  useDrag(
    (e) => {
      if ((e.down && e.shiftKey) || e.touches > 1) {
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
        setLastCursor(e.xy);
      } else {
        setCursorDown(e.down);
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

  const [brushPoints] = useState(createCirclePoints(20));

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
        <ExportedImage
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
          brushPoints={brushPoints}
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

export function createCirclePoints(diameter: number): MemoizedPoints {
  const points: {
    pos: readonly [number, number];
    boundaryEdges: readonly (readonly [number, number])[];
  }[] = [];
  const radius = Math.ceil(diameter / 2);
  for (let x = -radius; x < radius; x++) {
    for (let y = -radius; y < radius; y++) {
      const lengthSquared = x * x + y * y;
      const radiusSquared = radius * radius;
      if (lengthSquared < radiusSquared) {
        const boundaryEdges: (readonly [number, number])[] = [];

        function checkOffset(offset: readonly [number, number]) {
          const lengthSquared =
            (offset[0] + x) * (offset[0] + x) +
            (offset[1] + y) * (offset[1] + y);
          if (lengthSquared >= radiusSquared) {
            boundaryEdges.push(offset);
          }
        }
        if (x < 0) {
          checkOffset([-1, 0]);
        } else if (x > 0) {
          checkOffset([1, 0]);
        }

        if (y < 0) {
          checkOffset([0, -1]);
        } else if (y > 0) {
          checkOffset([0, 1]);
        }

        points.push({
          boundaryEdges,
          pos: [x, y],
        });
      }
    }
  }
  return points;
}
