import { Canvas } from "@react-three/fiber";
import { TexturePainterControls, kInitialControlState } from "./controls";
import { TexturePainterRenderer } from "./renderer";
import { useState } from "react";
import { Tool } from "./tools";

export function TexturePainterCanvas(props: {
  tool: Tool;
  drawingPoints: Uint8Array;
  hideCursorOverlay: boolean;
  texture: THREE.Texture;
}): JSX.Element {
  // These handlers are used to register the cursor events with the canvas.
  // If the handlers are not registered, then the cursor events will not be
  // captured by the canvas. These are registered in the TexturePainterControls
  // component.
  const [cursorUpHandler, setCursorUpHandler] =
    useState<React.MouseEventHandler>();
  const [cursorDownHandler, setCursorDownHandler] =
    useState<React.MouseEventHandler>();
  const [cursorLeaveHandler, setCursorLeaveHandler] =
    useState<React.MouseEventHandler>();
  const [cursorEnterHandler, setCursorEnterHandler] =
    useState<React.MouseEventHandler>();

  // The current state of the controls.
  const [controls, setControls] = useState(kInitialControlState);

  // This is used to hide the cursor overlay when the cursor leaves the canvas.
  const [hideCursorOverlay, setHideCursorOverlay] = useState(false);

  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{
        width: props.texture.image.width,
        height: props.texture.image.height,
      }}
    >
      <Canvas
        onPointerEnter={cursorEnterHandler}
        onPointerLeave={cursorLeaveHandler}
        onPointerDown={cursorDownHandler}
        onPointerUp={cursorUpHandler}
      >
        <TexturePainterControls
          registerCursorDownHandler={setCursorDownHandler}
          registerCursorUpHandler={setCursorUpHandler}
          registerCursorEnterHandler={setCursorEnterHandler}
          registerCursorLeaveHandler={setCursorLeaveHandler}
          hideCursorOverlay={setHideCursorOverlay}
          updateControls={(e) => setControls({ ...controls, ...e })}
        />
        <TexturePainterRenderer
          frameHandler={props.tool.frameHandler}
          cursorOverlay={props.tool.cursorOverlay}
          drawingPoints={props.drawingPoints}
          controls={controls}
          hideCursorOverlay={hideCursorOverlay}
          texture={props.texture}
        />
      </Canvas>
    </div>
  );
}
