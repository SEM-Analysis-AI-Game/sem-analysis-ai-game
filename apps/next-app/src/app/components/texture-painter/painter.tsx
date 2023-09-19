import * as THREE from "three";
import { useReducer } from "react";
import { TexturePainterCanvas } from "./canvas";
import { texturePainterReducer } from "./state";
import { CircleBrush } from "./tools";
import {
  TexturePainterActionDispatchContext,
  TexturePainterStateContext,
} from "./context";
import { TexturePainterOverlay } from "./overlay";

/**
 * A component that renders a canvas that can be used to paint on a texture.
 */
export function TexturePainter(props: {
  background: THREE.Texture;
}): JSX.Element {
  const [state, dispatch] = useReducer(
    texturePainterReducer,
    {
      toolSize: 20,
      toolColor: new THREE.Color(0xff0000),
      drawingPoints: new Uint8Array(
        props.background.image.width * props.background.image.height * 4
      ),
    },
    (state: {
      toolSize: number;
      toolColor: THREE.Color;
      drawingPoints: Uint8Array;
    }) => {
      return {
        ...state,
        tool: new CircleBrush(state.toolSize, state.toolColor),
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
