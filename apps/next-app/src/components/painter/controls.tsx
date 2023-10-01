import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePinch } from "@use-gesture/react";
import { useDrawingLayer } from "./drawing-layer";
import { useTool } from "./tools";
import { PanTool, kPanMultiplier } from "./tools/pan";
import { useActionHistory } from "./action-history";

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
  const [shiftDown, setShiftDown] = useState(false);

  const [tool] = useTool();

  const panTool = useMemo(() => {
    return new PanTool(0);
  }, []);

  const drawingLayer = useDrawingLayer();

  const history = useActionHistory();

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
      const panBounds = new THREE.Vector2(1.0, 1.0)
        .subScalar(1.0 / Math.sqrt(zoom))
        .divideScalar(kPanMultiplier);
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

  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey) {
        if (e.code === "KeyZ") {
          history.undo();
        }
        if (e.code === "KeyY") {
          history.redo();
        }
      }
    });
    gl.domElement.addEventListener("pointerdown", (e) => {
      const toolMouse = mouse
        .clone()
        .divideScalar(Math.sqrt(controls.zoom))
        .add(controls.pan.clone().multiplyScalar(kPanMultiplier))
        .multiplyScalar(0.5)
        .addScalar(0.5)
        .multiply(drawingLayer.pixelSize)
        .floor();
      if (!cursorDown) {
        drawingLayer.updateActiveSegment(toolMouse.x, toolMouse.y);
      }
      setCursorDown(true);
      setShiftDown(e.shiftKey);
    });
    gl.domElement.addEventListener("pointerup", () => {
      setCursorDown(false);
    });
    gl.domElement.addEventListener("pointerleave", (e) => {
      setCursorDown(false);
    });
  }, []);

  useFrame(() => {
    const panMouse = mouse
      .clone()
      .divideScalar(Math.sqrt(controls.zoom))
      .add(controls.pan)
      .multiplyScalar(0.5)
      .addScalar(0.5)
      .multiply(drawingLayer.pixelSize)
      .floor();
    const toolMouse = mouse
      .clone()
      .divideScalar(Math.sqrt(controls.zoom))
      .add(controls.pan.clone().multiplyScalar(kPanMultiplier))
      .multiplyScalar(0.5)
      .addScalar(0.5)
      .multiply(drawingLayer.pixelSize)
      .floor();
    if (shiftDown) {
      panTool.frameCallback(
        cursorDown,
        zooming,
        panMouse,
        controls,
        setControls,
        drawingLayer,
        history
      );
    } else {
      tool.frameCallback(
        cursorDown,
        zooming,
        tool.name === "Pan" ? panMouse : toolMouse,
        controls,
        setControls,
        drawingLayer,
        history
      );
    }
  });

  return null;
}
