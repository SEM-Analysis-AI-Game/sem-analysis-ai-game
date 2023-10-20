"use client";

import * as THREE from "three";
import { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { useBackground } from "../background-loader";
import { RendererState, calculateSectionSize } from "./renderer-state";
import { kSubdivisionSize } from "../renderer";

/**
 * Context for the current renderer state.
 */
export const RendererStateContext = createContext<RendererState | null>(null);

/**
 * Get the current renderer state. Must be used within a RendererStateContext.
 */
export function useRendererState(): RendererState {
  const rendererState = useContext(RendererStateContext);

  if (!rendererState) {
    throw new Error(
      "useRendererState must be used within a RendererStateContext"
    );
  }

  return rendererState;
}

/**
 * Provides a renderer state context.
 */
export function RendererStateProvider(props: PropsWithChildren): JSX.Element {
  // the drawing layer needs to know the background size
  const [background] = useBackground();

  // the renderer state is a memoized object that is mutated by children. Mutations
  // are not tracked by React, but instead they are tracked by WebGL via shader uniforms.
  const rendererState = useMemo(() => {
    const pixelSize = new THREE.Vector2(
      background.image.width,
      background.image.height
    );
    const numSections = pixelSize
      .clone()
      .divideScalar(kSubdivisionSize)
      .floor();

    const trailing = pixelSize
      .clone()
      .sub(numSections.clone().multiplyScalar(kSubdivisionSize));

    const drawingUniforms = [];

    for (let i = 0; i < numSections.y + 1; i++) {
      for (let j = 0; j < numSections.x + 1; j++) {
        const sectionSize = calculateSectionSize(numSections, trailing, j, i);
        const drawingUniform = new THREE.Uniform(
          new THREE.DataTexture(
            new Uint8Array(sectionSize.x * sectionSize.y * 4),
            sectionSize.x,
            sectionSize.y
          )
        );
        drawingUniforms.push(drawingUniform);
      }
    }

    return {
      pixelSize,
      drawingUniforms,
      trailing,
      numSections,
      activeSegment: 0,
    };
  }, [background]);

  return (
    <RendererStateContext.Provider value={rendererState}>
      {props.children}
    </RendererStateContext.Provider>
  );
}
