"use client";

import * as THREE from "three";
import {
  Dispatch,
  PropsWithChildren,
  createContext,
  useContext,
  useReducer,
} from "react";
import { Controls, ControlsEvent, controlsReducer } from "./controls";

const kInitialPan = new THREE.Vector2();
const kInitialZoom = 1.0;

/**
 * Context for the controls
 */
export const ControlsContext = createContext<
  [Controls, Dispatch<ControlsEvent>] | null
>(null);

/**
 * Hook to get/update the current controls. Must be used within a ControlsContext.
 */
export function useControls(): [Controls, Dispatch<ControlsEvent>] {
  const controls = useContext(ControlsContext);

  if (!controls) {
    throw new Error("useControls must be used within a ControlsContext");
  }

  return controls;
}

/**
 * Provider for the current controls.
 */
export function PainterControls(props: PropsWithChildren): JSX.Element {
  const controls = useReducer(controlsReducer, {
    cursorDown: false,
    shiftDown: false,
    pan: kInitialPan,
    numFingers: 0,
    zoom: kInitialZoom,
    zooming: false,
  });

  return (
    <ControlsContext.Provider value={controls}>
      {props.children}
    </ControlsContext.Provider>
  );
}
