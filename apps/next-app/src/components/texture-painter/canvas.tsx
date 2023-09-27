"use client";

import { Canvas } from "@react-three/fiber";
import { useContext, useMemo } from "react";
import {
  HideCursorAction,
  SetCursorDownAction,
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
        <TexturePainterRenderer />
      </Canvas>
    </div>
  ) : (
    <>Loading...</>
  );
}
