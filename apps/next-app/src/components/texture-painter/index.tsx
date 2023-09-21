"use client";

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { useContext, useEffect, useMemo, useReducer, useState } from "react";
import { HideCursorAction, texturePainterReducer } from "./state";
import { CircleBrush } from "./tools";
import {
  TexturePainterActionDispatchContext,
  TexturePainterStateContext,
} from "./context";
import { TexturePainterOverlay } from "./overlay";
import { TexturePainterRenderer } from "./renderer";

/**
 * A component that renders a canvas that can be used to paint on a texture.
 */
export function TexturePainter(): JSX.Element {
  const [background, setBackground] = useState<THREE.Texture>();

  useEffect(() => {
    const img = localStorage.getItem("background");
    if (img) {
      new THREE.TextureLoader().load(img, (loaded) => {
        loaded.magFilter = THREE.LinearFilter;
        loaded.minFilter = THREE.LinearFilter;
        setBackground(loaded);
      });
    } else {
      throw new Error("No background image found");
    }
  }, []);

  return background ? (
    <TexturePainterInternal background={background} />
  ) : (
    <></>
  );
}

function TexturePainterInternal(props: {
  background: THREE.Texture;
}): JSX.Element {
  const [state, dispatch] = useReducer(
    texturePainterReducer,
    { toolSize: 20, toolColor: new THREE.Color(0xff0000) },
    (params) => {
      return {
        toolSize: params.toolSize,
        toolColor: params.toolColor,
        drawingPoints: new Uint8Array(
          props.background.image.width * props.background.image.height * 4
        ),
        hideCursor: false,
        tool: new CircleBrush(params.toolSize, params.toolColor),
      };
    }
  );

  return (
    <TexturePainterStateContext.Provider value={state}>
      <TexturePainterActionDispatchContext.Provider value={dispatch}>
        <TexturePainterOverlay />
        <TexturePainterCanvas background={props.background} />
      </TexturePainterActionDispatchContext.Provider>
    </TexturePainterStateContext.Provider>
  );
}

function TexturePainterCanvas(props: {
  background: THREE.Texture;
}): JSX.Element {
  const painterDispatch = useContext(TexturePainterActionDispatchContext);

  if (!painterDispatch) {
    throw new Error("No painter dispatch found");
  }

  const [controls, setControls] = useState({
    cursorDown: false,
  });

  const scale = useMemo(() => {
    const maxDim = Math.max(
      props.background.image.width / window.innerWidth,
      props.background.image.height / window.innerHeight
    );
    return Math.min(1.0 / maxDim, 1.0);
  }, [props.background]);

  return (
    <div
      className="block m-auto touch-none"
      style={{
        width: props.background.image.width * scale,
        height: props.background.image.height * scale,
      }}
    >
      <Canvas
        className="m-0 p-0 w-full h-full overflow-hidden bg-black touch-none"
        onPointerEnter={() => {
          painterDispatch(new HideCursorAction(false));
        }}
        onPointerLeave={() => {
          painterDispatch(new HideCursorAction(true));
          setControls({ ...controls, cursorDown: false });
        }}
        onPointerDown={(e: React.MouseEvent) => {
          setControls({ ...controls, cursorDown: true });
        }}
        onPointerUp={() => {
          setControls({ ...controls, cursorDown: false });
        }}
      >
        <TexturePainterRenderer
          controls={controls}
          background={props.background}
        />
      </Canvas>
    </div>
  );
}
