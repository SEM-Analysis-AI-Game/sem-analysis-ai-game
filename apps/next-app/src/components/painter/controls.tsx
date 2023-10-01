import * as THREE from "three";
import { useThree } from "@react-three/fiber";
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
  zoom: number;
  pan: THREE.Vector2;
};

export function PainterControls(): null {
  const { mouse, gl, size } = useThree();

  const [controls, setControls] = useControls();

  const [zooming, setZooming] = useState(false);

  const [cursorDown, setCursorDown] = useState(false);

  const [tool] = useTool();

  const drawingLayer = useDrawingLayer();

  usePinch(
    (e) => {
      const zoom = e.offset[0];
      const origin = new THREE.Vector2(
        e.origin[0] - size.left,
        e.origin[1] - size.top
      )
        .divide(new THREE.Vector2(size.width, size.height))
        .subScalar(0.5)
        .multiplyScalar(2.0);
      origin.setY(-origin.y);
      const panBounds = new THREE.Vector2(1.0, 1.0).subScalar(
        1.0 / Math.sqrt(zoom)
      );
      setZooming(e.pinching || false);
      setControls((controls) => ({
        zoom,
        pan: origin
          .clone()
          .divideScalar(zoom)
          .multiplyScalar(Math.max((zoom - controls.zoom) * 0.5, 0))
          .add(controls.pan)
          .clamp(panBounds.clone().negate(), panBounds),
      }));
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

  useDrag(
    (e) => {
      setCursorDown(e.down);
      const mousePos = mouse
        .clone()
        .divideScalar(Math.sqrt(controls.zoom))
        .add(controls.pan)
        .multiplyScalar(0.5)
        .addScalar(0.5)
        .multiply(drawingLayer.pixelSize)
        .floor();
      tool.frameCallback(
        cursorDown,
        zooming,
        mousePos,
        setControls,
        drawingLayer
      );
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
