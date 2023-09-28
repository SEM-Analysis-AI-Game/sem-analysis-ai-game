"use client";

import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { useDrag, usePinch } from "@use-gesture/react";
import { useContext, useMemo } from "react";
import {
  ApplyPanAction,
  HideCursorAction,
  SetCursorDownAction,
  SetZoomAction,
  TexturePainterLoadedState,
} from "./state";
import {
  TexturePainterActionDispatchContext,
  TexturePainterStateContext,
} from "./context";
import { TexturePainterRenderer } from "./renderer";

const kCanvasWidth = 2 / 3;
const kCanvasHeight = 9 / 10;

export function TexturePainterCanvas(): JSX.Element {
  const painterDispatch = useContext(TexturePainterActionDispatchContext);
  const painterState = useContext(TexturePainterStateContext);

  if (!painterDispatch) {
    throw new Error("No painter dispatch found");
  }

  if (!painterState) {
    throw new Error("No painter state found");
  }

  const scale = useMemo(() => {
    if (painterState instanceof TexturePainterLoadedState) {
      const maxDim = Math.max(
        painterState.background.image.width /
          (window.innerWidth * kCanvasWidth),
        painterState.background.image.height /
          (window.innerHeight * kCanvasHeight)
      );
      return Math.min(1.0 / maxDim, 1.0);
    }
  }, []);

  return painterState instanceof TexturePainterLoadedState ? (
    <div
      className="block m-auto touch-none text-center"
      style={{
        width: painterState.background.image.width * (scale ? scale : 1),
        height: painterState.background.image.height * (scale ? scale : 1),
      }}
    >
      <Canvas
        className="m-0 p-0 w-full h-full overflow-hidden bg-black touch-none"
        onPointerEnter={() => {
          painterDispatch(new HideCursorAction(false));
        }}
        onPointerLeave={() => {
          painterDispatch(new HideCursorAction(true));
        }}
        onPointerDown={(e: React.MouseEvent) => {
          painterDispatch(new SetCursorDownAction(true));
        }}
        onPointerUp={() => {
          painterDispatch(new SetCursorDownAction(false));
        }}
      >
        <TexturePainterCanvasInternal />
      </Canvas>
    </div>
  ) : (
    <>Loading...</>
  );
}

const kMaxZoom = 6.5;
const kMinZoom = 1.0;

function TexturePainterCanvasInternal(): JSX.Element {
  const painterDispatch = useContext(TexturePainterActionDispatchContext);
  const painterState = useContext(TexturePainterStateContext);

  if (!painterDispatch) {
    throw new Error("No painter dispatch found");
  }

  if (!painterState) {
    throw new Error("No painter state found");
  }

  const { gl, mouse } = useThree();

  useDrag(
    (drag) => {
      if (painterState.tool.panning) {
        painterDispatch(
          new ApplyPanAction(new THREE.Vector2(-drag.delta[0], drag.delta[1]))
        );
      }
    },
    {
      pointer: {
        touch: true,
      },
      target: gl.domElement,
    }
  );

  usePinch(
    (pinch) => {
      painterDispatch(new SetZoomAction(pinch.offset[0], mouse));
    },
    {
      pinchOnWheel: true,
      modifierKey: null,
      pointer: {
        touch: true,
      },
      scaleBounds: {
        min: kMinZoom,
        max: kMaxZoom,
      },
      target: gl.domElement,
    }
  );

  return <TexturePainterRenderer />;
}
