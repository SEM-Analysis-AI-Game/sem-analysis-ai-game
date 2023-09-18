import * as THREE from "three";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { Tool } from "./tools";
import { TexturePainterRenderer } from "./renderer";

const kInitialControlState: TexturePainterControlState = {
  cursorDown: false,
};

export type TexturePainterControlState = {
  cursorDown: boolean;
};

export function TexturePainterCanvas(props: {
  tool: Tool;
  drawingPoints: Uint8Array;
  hideCursorOverlay: boolean;
  background: THREE.Texture;
}): JSX.Element {
  // The current state of the controls.
  const [controls, setControls] = useState(kInitialControlState);

  // This is used to hide the cursor overlay when the cursor leaves the canvas.
  const [hideCursorOverlay, setHideCursorOverlay] = useState(false);

  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{
        width: props.background.image.width,
        height: props.background.image.height,
      }}
    >
      <Canvas
        onPointerEnter={() => {
          setHideCursorOverlay(false);
        }}
        onPointerLeave={() => {
          setControls({ cursorDown: false });
          setHideCursorOverlay(true);
        }}
        onPointerDown={(e: React.MouseEvent) => {
          if (e.button === 0) {
            setControls({ cursorDown: true });
          }
        }}
        onPointerUp={() => {
          setControls({ cursorDown: false });
        }}
      >
        <OrbitControls
          enablePan
          enableDamping={false}
          minZoom={1.0}
          maxZoom={3.0}
        />
        <OrthographicCamera makeDefault />
        <TexturePainterRenderer
          frameHandler={props.tool.frameHandler}
          cursorOverlay={props.tool.cursorOverlay}
          drawingPoints={props.drawingPoints}
          controls={controls}
          hideCursorOverlay={hideCursorOverlay}
          background={props.background}
        />
      </Canvas>
    </div>
  );
}
