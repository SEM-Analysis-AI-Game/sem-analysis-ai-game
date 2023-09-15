import * as THREE from 'three';
import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { TexturePainterRenderer } from './renderer';
import { Tool } from './tools';
import { TexturePainterOverlay } from './overlay';
import { TexturePainterControls, kInitialControlState } from './controls';

export * from './tools';

/**
 * A component that renders a canvas that can be used to paint on a texture.
 */
export function TexturePainter(props: { initialTool: Tool }): JSX.Element {
  // These handlers are used to register the cursor events with the canvas.
  // If the handlers are not registered, then the cursor events will not be
  // captured by the canvas. These are registered in the TexturePainterControls
  // component.
  const [cursorUpHandler, setCursorUpHandler] = useState<React.MouseEventHandler>();
  const [cursorDownHandler, setCursorDownHandler] = useState<React.MouseEventHandler>();
  const [cursorLeaveHandler, setCursorLeaveHandler] = useState<React.MouseEventHandler>();
  const [cursorEnterHandler, setCursorEnterHandler] = useState<React.MouseEventHandler>();

  // The background image texture.
  const [texture, setTexture] = useState<THREE.Texture>();

  // The currently selected tool.
  const [tool, setTool] = useState(props.initialTool);

  // The current state of the controls.
  const [controls, setControls] = useState(kInitialControlState);

  // This is used to hide the cursor overlay when the cursor leaves the canvas.
  const [hideCursorOverlay, setHideCursorOverlay] = useState(false);

  // Updating this state should not trigger a rebuild by React.
  // This is not used for updating React components, but instead
  // is used by the three.js render loop to update the shader uniform.
  const drawingPoints = useMemo(() => {
    return new Uint8Array(texture ? texture.image.width * texture.image.height * 4 : 0);
  }, [texture]);

  return (
    <>
      <TexturePainterOverlay updateTool={setTool} />
      <div
        className="texture-painter-container"
        style={{
          width: texture?.image.width,
          height: texture?.image.height,
        }}
      >
        <Canvas
          className="texture-painter-canvas"
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
            updateControls={e => setControls({ ...controls, ...e })}
          />
          <TexturePainterRenderer
            frameHandler={tool.frameHandler}
            cursorOverlay={tool.cursorOverlay}
            drawingPoints={drawingPoints}
            controls={controls}
            hideCursorOverlay={hideCursorOverlay}
            texture={texture}
            setTexture={setTexture}
          />
        </Canvas>
      </div>
    </>
  );
}
