import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { TexturePainterRenderer } from './renderer';
import { Tool } from './tools';

export * from './tools';

export function TexturePainter(props: { initialTool: Tool }): JSX.Element {
  const [cursorUpHandler, setCursorUpHandler] = useState<React.MouseEventHandler>();
  const [cursorDownHandler, setCursorDownHandler] = useState<React.MouseEventHandler>();

  return (
    <Canvas onPointerDown={cursorDownHandler} onPointerUp={cursorUpHandler}>
      <TexturePainterRenderer
        initialTool={props.initialTool}
        registerCursorDownHandler={cursorDownHandler ? () => {} : setCursorDownHandler}
        registerCursorUpHandler={cursorUpHandler ? () => {} : setCursorUpHandler}
      />
    </Canvas>
  );
}
