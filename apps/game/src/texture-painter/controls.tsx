import * as THREE from 'three';
import React, { useEffect } from 'react';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import { FrameCallback } from './renderer';
import { drawCircle, cursorToPixel } from './utils';
import { Size } from '@react-three/fiber';

const kBrushSmoothingThreshold = 0.01;

export const kInitialControlState: TexturePainterControlState = {
  cursorDown: false,
};

export type TexturePainterControlState = {
  cursorDown: boolean;
};

export function TexturePainterControls(props: {
  registerCursorDownHandler: (handler: React.MouseEventHandler) => void;
  registerCursorUpHandler: (handler: React.MouseEventHandler) => void;
  registerFrameHandler: (callback: FrameCallback) => void;
  updateControlState: (state: TexturePainterControlState) => void;
  updateCursorOverlay: (overlay: THREE.Texture) => void;
}): JSX.Element {
  useEffect(() => {
    const cursorOverlayTextureData = new Uint8Array(39 * 39 * 4).fill(1.0);
    drawCircle(cursorOverlayTextureData, {
      pos: new THREE.Vector2(19, 19),
      resolution: { width: 39, height: 39, top: 0, left: 0 },
      radius: 20,
      fillColor: new THREE.Color(1.0, 0.0, 0.0),
      alpha: 1.0,
    });
    const cursorOverlayTexture = new THREE.DataTexture(cursorOverlayTextureData, 39, 39);
    cursorOverlayTexture.needsUpdate = true;
    props.updateCursorOverlay(cursorOverlayTexture);
    props.registerCursorDownHandler(() => (e: React.MouseEvent) => {
      if (e.button === 0) {
        props.updateControlState({ cursorDown: true });
      }
    });
    props.registerCursorUpHandler(() => () => {
      props.updateControlState({ cursorDown: false });
    });
    props.registerFrameHandler(
      () =>
        (params: {
          delta: number;
          drawingPoints: Uint8Array;
          resolution: Size;
          cursor: {
            current: THREE.Vector2;
            previous: THREE.Vector2;
          };
          controls: TexturePainterControlState;
        }) => {
          if (params.controls.cursorDown) {
            drawCircle(params.drawingPoints, {
              pos: cursorToPixel(params.cursor.previous, params.resolution),
              resolution: params.resolution,
              radius: 20.0,
              fillColor: new THREE.Color(1.0, 0.0, 0.0),
              alpha: 1.0,
            });
            const movement = params.cursor.current.clone().sub(params.cursor.previous);
            const movementLength = movement.length();
            const strides = movementLength / kBrushSmoothingThreshold;
            const step = movement.divideScalar(strides);
            for (let i = 0; i < strides; i++) {
              params.cursor.previous.add(step);
              drawCircle(params.drawingPoints, {
                pos: cursorToPixel(params.cursor.previous, params.resolution),
                resolution: params.resolution,
                radius: 20.0,
                fillColor: new THREE.Color(1.0, 0.0, 0.0),
                alpha: 1.0,
              });
            }
          }
        }
    );
  }, []);

  return (
    <>
      <OrbitControls />
      <OrthographicCamera makeDefault />
    </>
  );
}
