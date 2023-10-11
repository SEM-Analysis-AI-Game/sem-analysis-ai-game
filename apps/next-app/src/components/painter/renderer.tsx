"use client";

import * as THREE from "three";
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, ShaderPass } from "three-stdlib";
import { useBackground } from "./background-loader";
import {
  backgroundFragmentShader,
  buildFragmentShader,
  vertexShader,
} from "./shaders";
import { useDrawingLayer } from "./drawing-layer";
import { useControls } from "./controls";

/**
 * The canvas is subdivided into sections of this size.
 * This is to optimize updates to the drawing layer.
 */
export const kSubdivisionSize = 256;

/**
 * Renders the background and drawing layer.
 */
export function PainterRenderer(): null {
  const { gl } = useThree();

  const [background] = useBackground();

  if (!background) {
    throw new Error("Background not loaded");
  }

  // This is used to update the background and drawing layer uniforms.
  const [controls] = useControls();

  const [drawingLayer] = useDrawingLayer();

  // creates composers and uniforms on mount.
  const [backgroundComposer, drawingComposers, zoomUniform, panUniform] =
    useMemo(() => {
      const zoom = new THREE.Uniform(controls.zoom);
      const pan = new THREE.Uniform(controls.pan);

      // renders the background with pan and zoom applied.
      const bgComposer = new EffectComposer(gl);
      bgComposer.addPass(
        new ShaderPass(
          new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: backgroundFragmentShader,
            uniforms: {
              pan,
              zoom,
              background: new THREE.Uniform(background),
            },
          })
        )
      );

      // renders each section of the drawing layer.
      const drawingComps: EffectComposer[] = [];
      for (let i = 0; i < drawingLayer.uniforms.numSections.y + 1; i++) {
        for (let j = 0; j < drawingLayer.uniforms.numSections.x + 1; j++) {
          const sectionSize = drawingLayer.uniforms.sectionSize(j, i);
          if (sectionSize.x > 0 && sectionSize.y > 0) {
            const drawing = new THREE.WebGLRenderTarget(
              sectionSize.x,
              sectionSize.y,
              {
                stencilBuffer: true,
              }
            );

            const drawingComposer = new EffectComposer(gl, drawing);

            // build the shader for this section
            const drawingShader = buildFragmentShader(
              sectionSize.clone().divide(drawingLayer.pixelSize),
              new THREE.Vector2(j, i)
                .multiplyScalar(kSubdivisionSize)
                .divide(drawingLayer.pixelSize)
            );

            drawingComposer.addPass(
              new ShaderPass(
                new THREE.ShaderMaterial({
                  vertexShader,
                  fragmentShader: drawingShader,
                  uniforms: {
                    inputDiffuse: drawingLayer.uniforms.uniform(j, i),
                    pan,
                    zoom,
                  },
                  transparent: true,
                })
              )
            );

            drawingComps.push(drawingComposer);
          } else {
            drawingComps.push(new EffectComposer(gl));
          }
        }
      }
      return [bgComposer, drawingComps, zoom, pan];
    }, [drawingLayer]);

  // update the uniforms when the pan or zoom changes.
  useEffect(() => {
    panUniform.value = controls.pan;
    zoomUniform.value = controls.zoom;
  }, [controls]);

  // render the composers on each frame
  return useFrame(() => {
    gl.clear();
    gl.autoClear = false;

    backgroundComposer.render();

    for (let i = 0; i < drawingLayer.uniforms.numSections.y + 1; i++) {
      for (let j = 0; j < drawingLayer.uniforms.numSections.x + 1; j++) {
        if (
          drawingLayer.uniforms.sectionSize(j, i).x !== 0 &&
          drawingLayer.uniforms.sectionSize(j, i).y !== 0
        ) {
          drawingComposers[
            i * (drawingLayer.uniforms.numSections.x + 1) + j
          ].render();
        }
      }
    }
  });
}
