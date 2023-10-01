import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import { useDrag, usePinch } from "@use-gesture/react";
import { useDrawingLayer } from "./drawing-layer";
import { useTool } from "./tools";

export const ControlsContext = createContext<
  [Controls, Dispatch<SetStateAction<Controls>>] | null
>(null);

export function useControls(): [Controls, Dispatch<SetStateAction<Controls>>] {
  const controls = useContext(ControlsContext);

  if (!controls) {
    throw new Error("useControls must be used within a ControlsContext");
  }

  return controls;
}

export type Controls = {
  mousePos: THREE.Vector2;
  previousMousePos: THREE.Vector2;
  zoom: number;
  pan: THREE.Vector2;
};

export function PainterControls(): null {
  const { mouse, gl } = useThree();

  const [controls, setControls] = useControls();

  const [cursorDown, setCursorDown] = useState(false);

  const [tool] = useTool();

  const drawingLayer = useDrawingLayer();

  usePinch(
    (e) => {
      const zoom = e.offset[0];
      const panBounds = new THREE.Vector2(1.0, 1.0).subScalar(
        1.0 / Math.sqrt(zoom)
      );
      setControls({
        ...controls,
        zoom,
        pan: mouse
          .clone()
          .divideScalar(zoom)
          .multiplyScalar(Math.max((zoom - controls.zoom) * 0.5, 0))
          .add(controls.pan)
          .clamp(panBounds.clone().negate(), panBounds),
      });
    },
    {
      pinchOnWheel: true,
      modifierKey: null,
      pointer: {
        touch: true,
      },
      scaleBounds: {
        min: 1.0,
      },
      target: gl.domElement,
    }
  );

  useFrame(() => {
    const newControls = {
      ...controls,
      previousMousePos: controls.mousePos.clone(),
      mousePos: mouse
        .clone()
        .divideScalar(Math.sqrt(controls.zoom))
        .add(controls.pan)
        .multiplyScalar(0.5)
        .addScalar(0.5)
        .multiply(drawingLayer.pixelSize)
        .floor(),
    };

    tool.frameCallback(cursorDown, newControls, drawingLayer);

    setControls(newControls);
  });

  useDrag(
    (e) => {
      setCursorDown(e.down);
    },
    {
      pointer: {
        touch: true,
      },
      target: gl.domElement,
    }
  );

  return null;
}
