"use client";

import * as THREE from "three";
import { useContext } from "react";
import { TexturePainterActionDispatchContext } from "../context";
import { SetToolColorAction } from "../state";

export function ColorButton(props: { color: string }): JSX.Element {
  const painterDispatch = useContext(TexturePainterActionDispatchContext);
  if (!painterDispatch) {
    throw new Error("No painter dispatch found");
  }

  return (
    <button
      className={`rounded pl-2 pr-2 mt-1 mb-1 w-8 h-8 border-black border-2`}
      style={{
        backgroundColor: `#${props.color}`,
      }}
      key={props.color}
      onClick={() => {
        painterDispatch(
          new SetToolColorAction(new THREE.Color(`#${props.color}`))
        );
      }}
    />
  );
}
