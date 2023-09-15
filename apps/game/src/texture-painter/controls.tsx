import React, { useEffect } from 'react';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';

export const kInitialControlState: TexturePainterControlState = {
  cursorDown: false,
};

export type TexturePainterControlState = {
  cursorDown: boolean;
};

export function TexturePainterControls(props: {
  registerCursorDownHandler: (handler: React.MouseEventHandler) => void;
  registerCursorUpHandler: (handler: React.MouseEventHandler) => void;
  registerCursorEnterHandler: (handler: React.MouseEventHandler) => void;
  registerCursorLeaveHandler: (handler: React.MouseEventHandler) => void;
  hideCursorOverlay: (hide: boolean) => void;
  updateControls: (controls: Partial<TexturePainterControlState>) => void;
}): JSX.Element {
  useEffect(() => {
    props.registerCursorDownHandler(() => (e: React.MouseEvent) => {
      if (e.button === 0) {
        props.updateControls({ cursorDown: true });
      }
    });
    props.registerCursorUpHandler(() => () => {
      props.updateControls({ cursorDown: false });
    });
    props.registerCursorLeaveHandler(() => () => {
      props.updateControls({ cursorDown: false });
      props.hideCursorOverlay(true);
    });
    props.registerCursorEnterHandler(() => () => {
      props.hideCursorOverlay(false);
    });
  }, []);

  return (
    <>
      <OrbitControls />
      <OrthographicCamera makeDefault />
    </>
  );
}
