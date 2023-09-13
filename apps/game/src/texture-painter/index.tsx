import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { TexturePainterRenderer } from './renderer';

export function TexturePainter(): JSX.Element {
  const [mouseUpHandler, setMouseUpHandler] = useState<React.MouseEventHandler>();
  const [mouseDownHandler, setMouseDownHandler] = useState<React.MouseEventHandler>();

  return (
    <Canvas onPointerDown={mouseDownHandler} onPointerUp={mouseUpHandler}>
      <TexturePainterRenderer
        registerCursorDownHandler={mouseDownHandler ? () => {} : setMouseDownHandler}
        registerCursorUpHandler={mouseUpHandler ? () => {} : setMouseUpHandler}
      />
    </Canvas>
  );
}
