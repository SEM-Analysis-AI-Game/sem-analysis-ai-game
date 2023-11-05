"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import Image, { StaticImageData } from "next/image";
import { useDrag, usePinch } from "@use-gesture/react";
import { Canvas } from "@react-three/fiber";
import { clamp } from "three/src/math/MathUtils.js";
import { PainterRenderer } from "./renderer";
import { PainterController } from "./controller";
import { DrawEvent, StateResponse, kImages } from "@/common";
import { ClientState, applyDrawEventClient, fillCutsClient } from "@/client";
import { Downloader } from "./downloader";

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
  initialState: StateResponse;
}): JSX.Element {
  // the image to draw on
  const image = useMemo(() => kImages[props.imageIndex], [props.imageIndex]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
  }, []);

  // initialize client-side state
  const state: ClientState = useMemo(() => {
    // the texture to use for drawing
    const textureData = new Uint8Array(image.width * image.height * 4);
    const texture = new THREE.DataTexture(
      textureData,
      image.width,
      image.height
    );

    // this is necessary for the texture to use transparency
    texture.premultiplyAlpha = true;

    const state = {
      background: image,
      drawing: texture,
      segmentBuffer: new Array(image.width * image.height),
      nextSegmentIndex: 0,
      imageIndex: props.imageIndex,
      resolution: [image.width, image.height] as const,
    };

    for (const eventData of props.initialState.draws) {
      state.nextSegmentIndex = Math.max(
        state.nextSegmentIndex,
        eventData.segment + 1
      );
      applyDrawEventClient(state, eventData.segment, eventData.event);
    }

    const cuts = props.initialState.cuts.map((cut) => {
      state.nextSegmentIndex = Math.max(
        state.nextSegmentIndex,
        cut.segment + 1
      );
      return {
        ...cut,
        points: new Set(cut.points),
      };
    });

    fillCutsClient(state, cuts, false, null);

    return state;
  }, [image, props.initialState, props.imageIndex]);

  // on the server render initialize a zoom of 1, which will render the image
  // at its native resolution
  const [zoom, setZoom] = useState(1);

  // once the client loads, set the zoom to fit the image to the screen
  useEffect(() => {
    setZoom(scale(image));
  }, [image]);

  // the pan offset in screen pixels. the image is centered on [0, 0]. Moving 1 pixel in any
  // direction will result in the image moving 1 pixel in that direction on the screen. this
  // means that this offset needs to be transformed when the user zooms in/out in order to
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
        (image.width * e.offset[0]) / 2,
        (image.height * e.offset[0]) / 2,
      ] as const;

      // copies the previous zoom level so the previous zoom level is referenced when the
      // callback in setPan is triggered.
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

  // handle cursor down/up. this is used solely for controlling when the user is drawing
  // segments. this is set to false if the user is panning (despite the fact that the cursor
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
      // if the shift + mouse are down, or if the user is touching with multiple fingers, then the
      // image should pan.
      if ((e.down && e.shiftKey) || e.touches > 1) {
        setPanAnchor((lastCursor) => {
          if (lastCursor) {
            const currentSize = [
              (image.width * zoom) / 2,
              (image.height * zoom) / 2,
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
        // if the user is not panning  update the cursor down state to
        // start/stop drawing in the controller frame loop.
        setCursorDown(e.down);
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

  const downloadOverlayRef = useRef<HTMLAnchorElement>(null);
  const downloadFullImageRef = useRef<HTMLAnchorElement>(null);

  const [clickDownloadOverlay, setClickDownloadOverlay] = useState(
    () => () => {}
  );

  const [clickDownloadFullImage, setClickDownloadFullImage] = useState(
    () => () => {}
  );

  const [downloadAnimation, setDownloadAnimation] = useState(
    () => (log: { initialState: DrawEvent[] }) => {}
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
      <Canvas gl={{ preserveDrawingBuffer: true }}>
        <PainterController
          historyIndex={
            props.initialState.draws.length > 0
              ? props.initialState.draws[props.initialState.draws.length - 1]
                  .historyIndex
              : -1
          }
          imageIndex={props.imageIndex}
          zoom={zoom}
          pan={pan}
          cursorDown={cursorDown}
          state={state}
        />
        <PainterRenderer
          canvasSize={[image.width * zoom, image.height * zoom]}
          drawing={state.drawing}
          pan={pan}
        />
        <Downloader
          state={state}
          currentPan={pan}
          downloadOverlayRef={downloadOverlayRef}
          downloadFullImageRef={downloadFullImageRef}
          setClickDownloadFullImage={setClickDownloadFullImage}
          setClickDownloadOverlay={setClickDownloadOverlay}
          setDownloadAnimation={setDownloadAnimation}
        />
      </Canvas>
      <div className="flex flex-col absolute right-5 top-5 gap-y-8">
        <button
          onClick={() => {
            clickDownloadOverlay();
          }}
        >
          <a ref={downloadOverlayRef} download={"overlay.png"}>
            Download Overlay
          </a>
        </button>
        <button
          onClick={() => {
            clickDownloadFullImage();
          }}
        >
          <a ref={downloadFullImageRef} download={"full-image.png"}>
            Download Full Image
          </a>
        </button>
        <button
          onClick={async () => {
            const log = await fetch(
              `/api/log?imageIndex=${props.imageIndex}&historyIndex=-1`,
              {
                cache: "no-cache",
              }
            ).then((res) => res.json());
            downloadAnimation(log);
          }}
        >
          Download Animation
        </button>
      </div>
    </div>
  );
}
