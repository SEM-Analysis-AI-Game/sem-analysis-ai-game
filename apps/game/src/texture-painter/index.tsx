import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { TexturePainterRenderer } from './renderer';
import { Tool } from './tools';
import { TexturePainterOverlay } from './overlay';

export * from './tools';

export function TexturePainter(props: { initialTool: Tool }): JSX.Element {
  const [cursorUpHandler, setCursorUpHandler] = useState<React.MouseEventHandler>();
  const [cursorDownHandler, setCursorDownHandler] = useState<React.MouseEventHandler>();
  const [cursorLeaveHandler, setCursorLeaveHandler] = useState<React.MouseEventHandler>();
  const [cursorEnterHandler, setCursorEnterHandler] = useState<React.MouseEventHandler>();
  const [resolution, setResolution] = useState<THREE.Vector2>();

  return (
    <>
      <TexturePainterOverlay />
      <div
        style={{
          position: 'absolute',
          width: resolution?.width,
          height: resolution?.height,
        }}
      >
        <Canvas
          className="texture-painter-canvas"
          onPointerEnter={cursorEnterHandler}
          onPointerLeave={cursorLeaveHandler}
          onPointerDown={cursorDownHandler}
          onPointerUp={cursorUpHandler}
        >
          <TexturePainterRenderer
            initialTool={props.initialTool}
            setResolution={setResolution}
            registerCursorEnterHandler={cursorEnterHandler ? () => {} : setCursorEnterHandler}
            registerCursorLeaveHandler={cursorLeaveHandler ? () => {} : setCursorLeaveHandler}
            registerCursorDownHandler={cursorDownHandler ? () => {} : setCursorDownHandler}
            registerCursorUpHandler={cursorUpHandler ? () => {} : setCursorUpHandler}
          />
        </Canvas>
      </div>
    </>
  );
}
