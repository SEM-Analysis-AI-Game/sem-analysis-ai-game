import React, { useEffect, useState } from 'react';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import { Tool } from './tools';

export const kInitialControlState: TexturePainterControlState = {
  cursorDown: false,
};

export type TexturePainterControlState = {
  cursorDown: boolean;
};

export function TexturePainterControls(props: {
  initialTool: Tool;
  registerCursorDownHandler: (handler: React.MouseEventHandler) => void;
  registerCursorUpHandler: (handler: React.MouseEventHandler) => void;
  updateTool: (tool: Tool) => void;
  updateControls: (controls: Partial<TexturePainterControlState>) => void;
}): JSX.Element {
  const [tool] = useState(props.initialTool);

  useEffect(() => {
    props.updateTool(tool);
  }, [tool]);

  useEffect(() => {
    props.registerCursorDownHandler(() => (e: React.MouseEvent) => {
      if (e.button === 0) {
        props.updateControls({ cursorDown: true });
      }
    });
    props.registerCursorUpHandler(() => () => {
      props.updateControls({ cursorDown: false });
    });
  }, []);

  return (
    <>
      <OrbitControls />
      <OrthographicCamera makeDefault />
    </>
  );
}
