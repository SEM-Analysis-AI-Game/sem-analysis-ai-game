"use client";

import * as THREE from "three";
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";

const kInitialPan = new THREE.Vector2();
const kInitialZoom = 1.0;

export const PanContext = createContext<
  [THREE.Vector2, Dispatch<SetStateAction<THREE.Vector2>>] | null
>(null);

export const ZoomContext = createContext<
  [number, Dispatch<SetStateAction<number>>] | null
>(null);

export function usePan(): [
  THREE.Vector2,
  Dispatch<SetStateAction<THREE.Vector2>>
] {
  const pan = useContext(PanContext);

  if (!pan) {
    throw new Error("usePan must be used within a PanContext");
  }

  return pan;
}

export function useZoom(): [number, Dispatch<SetStateAction<number>>] {
  const zoom = useContext(ZoomContext);

  if (!zoom) {
    throw new Error("useZoom must be used within a ZoomContext");
  }

  return zoom;
}

export function PainterControls(props: PropsWithChildren): JSX.Element {
  const panState = useState(kInitialPan);
  const zoomState = useState(kInitialZoom);

  return (
    <PanContext.Provider value={panState}>
      <ZoomContext.Provider value={zoomState}>
        {props.children}
      </ZoomContext.Provider>
    </PanContext.Provider>
  );
}
