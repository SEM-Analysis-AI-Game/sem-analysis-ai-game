import * as THREE from "three";
import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, TexturePass } from "three-stdlib";

/**
 * Renders the drawing texture to the screen.
 */
export function PainterRenderer(props: {
  drawing: THREE.DataTexture;
  canvasSize: readonly [number, number];
  pan: readonly [number, number];
}): null {
  const { gl } = useThree();

  const composer = useMemo(() => {
    gl.autoClear = false;
    const drawingComposer = new EffectComposer(gl);
    drawingComposer.addPass(new TexturePass(props.drawing));
    return drawingComposer;
  }, []);

  return useFrame(() => {
    gl.clear();
    // apply the pan offset to the viewport. the canvasSize prop has the
    // zoom level applied to it, so no need to multiply by any zoom factor.
    gl.setViewport(
      (window.innerWidth - props.canvasSize[0]) / 2 + props.pan[0],
      (window.innerHeight - props.canvasSize[1]) / 2 - props.pan[1],
      props.canvasSize[0],
      props.canvasSize[1]
    );
    composer.render();
  });
}
