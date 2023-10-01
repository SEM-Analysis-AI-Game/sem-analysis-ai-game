"use client";

import * as THREE from "three";
import {
  Dispatch,
  PropsWithChildren,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export const BackgroundContext = createContext<
  | [
      THREE.Texture | undefined,
      Dispatch<SetStateAction<THREE.Texture | undefined>>
    ]
  | null
>(null);

export function useBackground(): [
  THREE.Texture | undefined,
  Dispatch<SetStateAction<THREE.Texture | undefined>>
] {
  const state = useContext(BackgroundContext);

  if (!state) {
    throw new Error("useBackground must be used within a BackgroundContext");
  }

  return state;
}

export function loadBackground(
  dataUri: string,
  onLoaded: (texture: THREE.Texture) => void
): void {
  const loader = new THREE.TextureLoader();
  loader.load(dataUri, (texture) => {
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    onLoaded(texture);
  });
}

export function BackgroundLoader(
  props: PropsWithChildren<{ fallback: ReactNode; overlay: ReactNode }>
): JSX.Element {
  const backgroundState = useState<THREE.Texture>();

  useEffect(() => {
    const img = localStorage.getItem("background");
    if (img) {
      loadBackground(img, (texture) => {
        backgroundState[1](texture);
      });
    } else {
      throw new Error("No background image found");
    }
  }, []);

  return (
    <BackgroundContext.Provider value={backgroundState}>
      {props.overlay}
      {backgroundState[0] ? props.children : props.fallback}
    </BackgroundContext.Provider>
  );
}
