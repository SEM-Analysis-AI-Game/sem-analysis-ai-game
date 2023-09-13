import * as THREE from 'three';
import React, { useEffect } from 'react';
import { OrbitControls, OrthographicCamera } from '@react-three/drei';
import { FrameCallback } from './renderer';
import { drawCircle, mouseToPixel } from './utils';
import { Size } from '@react-three/fiber';

const kBrushSmoothingThreshold = 0.01;

export type TexturePainterControlState = {
  cursorDown: boolean;
};

export function TexturePainterControls(props: {
  registerCursorDownHandler: (handler: React.MouseEventHandler) => void;
  registerCursorUpHandler: (handler: React.MouseEventHandler) => void;
  registerFrameHandler: (callback: FrameCallback) => void;
  updateControlState: (state: TexturePainterControlState) => void;
  updateMouseOverlay: (overlay: THREE.Texture) => void;
}): JSX.Element {
  useEffect(() => {
    const mouseOverlayTextureData = new Uint8Array(39 * 39 * 4).fill(1.0);
    drawCircle(mouseOverlayTextureData, {
      pos: new THREE.Vector2(19, 19),
      resolution: { width: 39, height: 39, top: 0, left: 0 },
      radius: 20,
      fillColor: new THREE.Color(1.0, 0.0, 0.0),
      alpha: 1.0,
    });
    const mouseOverlayTexture = new THREE.DataTexture(mouseOverlayTextureData, 39, 39);
    mouseOverlayTexture.needsUpdate = true;
    props.updateMouseOverlay(mouseOverlayTexture);
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
          previousMousePosition: THREE.Vector2;
          currentMousePosition: THREE.Vector2;
          resolution: Size;
          controls: TexturePainterControlState;
        }) => {
          if (params.controls.cursorDown) {
            drawCircle(params.drawingPoints, {
              pos: mouseToPixel(params.previousMousePosition, params.resolution),
              resolution: params.resolution,
              radius: 20.0,
              fillColor: new THREE.Color(1.0, 0.0, 0.0),
              alpha: 1.0,
            });
            const movement = params.currentMousePosition.clone().sub(params.previousMousePosition);
            const movementLength = movement.length();
            const strides = movementLength / kBrushSmoothingThreshold;
            const step = movement.divideScalar(strides);
            for (let i = 0; i < strides; i++) {
              params.previousMousePosition.add(step);
              drawCircle(params.drawingPoints, {
                pos: mouseToPixel(params.previousMousePosition, params.resolution),
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
