"use client";

import * as THREE from "three";
import { kToolFactory, useTool } from "../tools";

export function ColorButton(props: { color: string }): JSX.Element {
  const [tool, setTool] = useTool();

  return (
    <button
      className={`rounded pl-2 pr-2 mt-1 mb-1 w-8 h-8 border-black border-2`}
      style={{
        backgroundColor: `#${props.color}`,
      }}
      key={props.color}
      onClick={() => {
        setTool(
          new kToolFactory[tool.name](
            new THREE.Color(`#${props.color}`),
            tool.size
          )
        );
      }}
    />
  );
}
