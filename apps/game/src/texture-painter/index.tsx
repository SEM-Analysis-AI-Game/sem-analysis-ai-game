import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { TexturePainterRenderer } from './renderer';

export function TexturePainter(): JSX.Element {
  const [cursorUpHandler, setCursorUpHandler] = useState<React.MouseEventHandler>();
  const [cursorDownHandler, setCursorDownHandler] = useState<React.MouseEventHandler>();

  return (
    <Canvas onPointerDown={cursorDownHandler} onPointerUp={cursorUpHandler}>
      <TexturePainterRenderer
        registerCursorDownHandler={cursorDownHandler ? () => {} : setCursorDownHandler}
        registerCursorUpHandler={cursorUpHandler ? () => {} : setCursorUpHandler}
      />
    </Canvas>
  );
}
