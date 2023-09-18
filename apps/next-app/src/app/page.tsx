"use client";

import { TexturePainter, circleBrush } from "./components/texture-painter";
import * as THREE from "three";

export default function Home() {
  return (
    <TexturePainter
      initialTool={circleBrush(20.0, new THREE.Color(0xff0000), 1.0)}
    />
  );
}
