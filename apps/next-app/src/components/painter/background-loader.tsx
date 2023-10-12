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

/**
 * Context for the current background image.
 */
export const BackgroundContext = createContext<
  | [
      THREE.Texture | undefined,
      Dispatch<SetStateAction<THREE.Texture | undefined>>
    ]
  | null
>(null);

/**
 * Hook to get/set the current background image. Must be used within a BackgroundContext.
 */
export function useBackground(): [
  THREE.Texture,
  Dispatch<SetStateAction<THREE.Texture | undefined>>
] {
  const state = useContext(BackgroundContext);

  if (!state) {
    throw new Error("useBackground must be used within a BackgroundContext");
  }

  if (!state[0]) {
    throw new Error("No background found");
  }

  return state as [
    THREE.Texture,
    Dispatch<SetStateAction<THREE.Texture | undefined>>
  ];
}

/**
 * Load a background image from a data URI.
 */
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

/**
 * Provider for the current background image. Loads the background image
 * from localStorage upon mounting. The overlay can be server-side rendered.
 * The fallback is rendered while the background image is loading, and the
 * children are rendered once the background image is loaded.
 */
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
