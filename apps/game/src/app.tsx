import React from "react";
import { Canvas } from "@react-three/fiber";
import { Box, PerspectiveCamera } from "@react-three/drei";

export function App(): JSX.Element {
  return (
    <>
      <Canvas>
        <PerspectiveCamera makeDefault />
        <Box position={[0, 0, -2]} />
      </Canvas>
      <h1>Hello World</h1>
    </>
  );
}
