import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { EffectComposer, TexturePass } from "three-stdlib";

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
    gl.setViewport(
      (window.innerWidth - props.canvasSize[0]) / 2 + props.pan[0],
      (window.innerHeight - props.canvasSize[1]) / 2 - props.pan[1],
      props.canvasSize[0],
      props.canvasSize[1]
    );
    composer.render();
  });
}
