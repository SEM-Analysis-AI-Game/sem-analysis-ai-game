import * as THREE from "three";
import React, { useEffect, useMemo, useState } from "react";
import { Tool } from "./tools";
import { TexturePainterOverlay } from "./overlay";
import { TexturePainterCanvas } from "./canvas";

export * from "./tools";

/**
 * A component that renders a canvas that can be used to paint on a texture.
 */
export function TexturePainter(props: { initialTool: Tool }): JSX.Element {
  // The background image texture.
  const [texture, setTexture] = useState<THREE.Texture>();

  // temporary
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load("/the_texture.jpg", setTexture);
  }, []);

  // The currently selected tool.
  const [tool, setTool] = useState(props.initialTool);

  // Updating this state should not trigger a rebuild by React.
  // This is not used for updating React components, but instead
  // is used by the three.js render loop to update the shader uniform.
  const drawingPoints = useMemo(() => {
    return new Uint8Array(
      texture ? texture.image.width * texture.image.height * 4 : 0
    );
  }, [texture]);

  return (
    <>
      <TexturePainterOverlay updateTool={setTool} />
      {texture ? (
        <TexturePainterCanvas
          tool={tool}
          drawingPoints={drawingPoints}
          hideCursorOverlay={false}
          texture={texture}
        />
      ) : null}
    </>
  );
}
