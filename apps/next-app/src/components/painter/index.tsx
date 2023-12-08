"use client";

import * as THREE from "three";
import { useEffect, useMemo, useState } from "react";
import useWebSocket from "react-use-websocket";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";
import { useDrag, usePinch } from "@use-gesture/react";
import {
  StateResponse,
  ClientState,
  applyDrawEventClient,
  drawImage,
  floodFillClient,
  DrawType,
} from "drawing";
import { Canvas } from "@react-three/fiber";
import { clamp } from "three/src/math/MathUtils.js";
import { PainterRenderer } from "./renderer";
import { PainterController } from "./controller";
import { getImage } from "@/common";
import { Downloader } from "./downloader";
import { Collapsible } from "./collapsible";

/**
 * The max zoom multiplier
 */
const kMaxZoom = 5.0;

const kBaseUrl = `http://${process.env.API_HOST ?? "localhost"}`;

const kGifEncoderPort = 4001;

const kScoringPort = 4002;

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
  const image = useMemo(() => getImage(props.imageIndex), [props.imageIndex]);

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
      drawing: texture,
      canvas: new Array(image.width * image.height),
      nextSegmentIndex: 0,
      imageIndex: props.imageIndex,
      resolution: [image.width, image.height] as const,
      flipY: false,
      background: null,
    };

    for (const eventData of props.initialState.draws) {
      state.nextSegmentIndex = Math.max(
        state.nextSegmentIndex,
        eventData.segment + 1
      );
      applyDrawEventClient(state, eventData, false);
    }

    for (const fill of props.initialState.fills) {
      state.nextSegmentIndex = Math.max(
        state.nextSegmentIndex,
        fill.segment + 1
      );
    }

    floodFillClient(state, props.initialState.fills, false);

    drawImage(state);

    return state;
  }, [image, props]);

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

  const [numFingers, setNumFingers] = useState(0);

  // handle zooming
  usePinch(
    (e) => {
      setNumFingers(e.touches);
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
      if ((e.down && e.shiftKey) || numFingers > 1) {
        setCursorDown(false);
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

  const [clickDownloadOverlay, setClickDownloadOverlay] = useState(
    () => () => {}
  );

  const [clickDownloadFullImage, setClickDownloadFullImage] = useState(
    () => () => {}
  );

  useWebSocket(`ws://${process.env.API_HOST ?? "localhost"}:${kScoringPort}`, {
    onOpen: () => {},
    share: true,
    filter: () => true,
    retryOnError: true,
    shouldReconnect: () => true,
    onMessage: (event: MessageEvent<string>) => {
      console.log(event);
      setScore(JSON.parse(event.data).scores[props.imageIndex]);
    },
  });

  const [score, setScore] = useState<number>(0);

  const [brushType, setBrushType] = useState<DrawType>("brush");

  const [brushSize, setBrushSize] = useState(10);

  return (
    <div className="flex h-[calc(100dvh)] justify-center items-center bg-neutral-800">
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
          drawType={brushType}
          brushSize={brushSize}
          numFingers={numFingers}
        />
        <PainterRenderer
          canvasSize={[image.width * zoom, image.height * zoom]}
          drawing={state.drawing}
          pan={pan}
        />
        <Downloader
          state={state}
          currentPan={pan}
          setClickDownloadFullImage={setClickDownloadFullImage}
          setClickDownloadOverlay={setClickDownloadOverlay}
        />
      </Canvas>
      <div className="flex flex-col absolute left-0 top-0 gap-y-2 bg-neutral-700 rounded-br p-4 border-r border-b border-gray-400">
        <div className="w-full">
          <Link href="/">
            <button className="toolbar-button py-1 w-full">
              <Image
                className="ml-2 mr-1"
                src="/home.png"
                alt=""
                width={25}
                height={25}
              />
              <p>Home</p>
            </button>
          </Link>
        </div>
        <hr />

        <div className="flex justify-center">
          <button
            className={`rounded hover:${
              brushType === "brush" ? "bg-cyan-200" : "bg-gray-400"
            } p-1 mx-2 transition border border-white ${
              brushType === "brush" ? "bg-cyan-400" : "bg-gray-200"
            }`}
            onClick={() => {
              setBrushType("brush");
            }}
          >
            <Image src="/circle_brush.png" alt="" width={25} height={25} />
          </button>

          <button
            className={`rounded hover:${
              brushType === "eraser" ? "bg-cyan-200" : "bg-gray-400"
            } p-1 mx-2 transition border border-white ${
              brushType === "eraser" ? "bg-cyan-400" : "bg-gray-200"
            }`}
            onClick={() => {
              setBrushType("eraser");
            }}
          >
            <Image src="/circle_eraser.png" alt="" width={25} height={25} />
          </button>
        </div>

        <p className="font-bold text-neutral-200">Brush Size:</p>

        <input
          type="range"
          min={5}
          max={100}
          step={5}
          className="accent-neutral-200"
          onChange={(e) => {
            setBrushSize(parseInt(e.target.value));
          }}
        />

        <hr />
        <p className="text-neutral-100">
          Score: <span className="font-bold">{Math.round(score * 100)}%</span>
        </p>
        <hr />

        <Collapsible title="Export">
          <button
            className="toolbar-button"
            onClick={() => {
              clickDownloadOverlay();
            }}
          >
            <Image src="/download.png" alt="" width={30} height={30} />
            <p>Overlay</p>
          </button>
          <button
            className="toolbar-button"
            onClick={() => {
              clickDownloadFullImage();
            }}
          >
            <Image src="/download.png" alt="" width={30} height={30} />
            <p>Full Image</p>
          </button>
          <div className="w-full">
            <a
              href={`${kBaseUrl}:${kGifEncoderPort}/${props.imageIndex}`}
              download="animation.gif"
            >
              <button className="toolbar-button w-full">
                <Image src="/download.png" alt="" width={30} height={30} />
                <p>Animation</p>
              </button>
            </a>
          </div>
          <button
            className="toolbar-button"
            onClick={() => {
              const anchor = document.createElement("a");
              const data = [];
              for (let i = 0; i < state.canvas.length; i++) {
                const segment = state.canvas[i];
                if (segment) {
                  data.push(segment.segment);
                } else {
                  data.push(-1);
                }
              }
              const url = URL.createObjectURL(
                new Blob([JSON.stringify({ segments: data })], {
                  type: "application/json",
                })
              );
              anchor.href = url;
              anchor.download = "segments.json";
              anchor.click();
              anchor.remove();
              URL.revokeObjectURL(url);
            }}
          >
            <Image src="/download.png" alt="" width={30} height={30} />
            <p>JSON</p>
          </button>
        </Collapsible>
      </div>
    </div>
  );
}
