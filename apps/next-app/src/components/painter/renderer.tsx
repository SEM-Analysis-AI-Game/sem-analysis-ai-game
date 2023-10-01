import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { EffectComposer, ShaderPass } from "three-stdlib";
import { useControls } from "./controls";
import { useBackground } from "./background-loader";
import {
  backgroundFragmentShader,
  buildFragmentShader,
  vertexShader,
} from "./shaders";
import { useDrawingLayer } from "./drawing-layer";

export const kSubdivisionSize = 512;

export function PainterRenderer(): null {
  const { gl } = useThree();

  const [background] = useBackground();

  if (!background) {
    throw new Error("Background not loaded");
  }

  const [controls] = useControls();

  const drawingLayer = useDrawingLayer();

  const [backgroundComposer, drawingComposers, zoomUniform, panUniform] =
    useMemo(() => {
      const zoom = new THREE.Uniform(controls.zoom);
      const pan = new THREE.Uniform(controls.pan);

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

      const drawingComps: EffectComposer[] = [];
      for (let i = 0; i < drawingLayer.numSections.y + 1; i++) {
        for (let j = 0; j < drawingLayer.numSections.x + 1; j++) {
          const sectionSize = drawingLayer.sectionSize(j, i);
          if (sectionSize.x > 0 && sectionSize.y > 0) {
            const drawing = new THREE.WebGLRenderTarget(
              sectionSize.x,
              sectionSize.y,
              {
                stencilBuffer: true,
              }
            );

            const drawingComposer = new EffectComposer(gl, drawing);

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
                    inputDiffuse: drawingLayer.uniform(j, i),
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
    }, [background]);

  useEffect(() => {
    panUniform.value = controls.pan;
    zoomUniform.value = controls.zoom;
  }, [controls]);

  return useFrame(() => {
    gl.clear();
    gl.autoClear = false;

    backgroundComposer.render();

    for (let i = 0; i < drawingLayer.numSections.y + 1; i++) {
      for (let j = 0; j < drawingLayer.numSections.x + 1; j++) {
        if (
          j === drawingLayer.numSections.x &&
          drawingLayer.trailing.width === 0
        ) {
          continue;
        }
        if (
          i === drawingLayer.numSections.y &&
          drawingLayer.trailing.height === 0
        ) {
          continue;
        }

        drawingComposers[i * (drawingLayer.numSections.x + 1) + j].render();
      }
    }
  });
}
