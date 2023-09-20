"use client";

import { useEffect, useState } from "react";
import { TexturePainter } from "./components/texture-painter";
import { Canvas } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

function TextureLoading(props: {
  setBackground: (background: THREE.Texture) => void;
}) {
  const background = useTexture("/example.png");

  useEffect(() => {
    props.setBackground(background);
  }, [background, props.setBackground]);

  return null;
}

export default function Home() {
  const [background, setBackground] = useState<THREE.Texture>();

  return (
    <>
      <Canvas>
        <TextureLoading setBackground={setBackground} />
      </Canvas>
      {background ? <TexturePainter background={background} /> : null}
    </>
  );
}
