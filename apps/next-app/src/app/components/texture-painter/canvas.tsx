import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useContext, useState } from "react";
import { TexturePainterRenderer } from "./renderer";
import { TexturePainterActionDispatchContext } from "./context";
import { HideCursorAction } from "./state";

export type ControlsState = {
  cursorDown: boolean;
};

export function TexturePainterCanvas(props: {
  background: THREE.Texture;
}): JSX.Element {
  const painterDispatch = useContext(TexturePainterActionDispatchContext);

  if (!painterDispatch) {
    throw new Error("No painter dispatch found");
  }

  const [controls, setControls] = useState({
    cursorDown: false,
  });

  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 touch-none"
      style={{
        width: props.background.image.width,
        height: props.background.image.height,
      }}
    >
      <Canvas
        className="m-0 p-0 w-full h-full overflow-hidden bg-black"
        onPointerEnter={() => {
          painterDispatch(new HideCursorAction(false));
        }}
        onPointerLeave={() => {
          painterDispatch(new HideCursorAction(true));
          setControls({ ...controls, cursorDown: false });
        }}
        onPointerDown={(e: React.MouseEvent) => {
          setControls({ ...controls, cursorDown: true });
        }}
        onPointerUp={() => {
          setControls({ ...controls, cursorDown: false });
        }}
      >
        <TexturePainterRenderer
          controls={controls}
          background={props.background}
        />
      </Canvas>
    </div>
  );
}
