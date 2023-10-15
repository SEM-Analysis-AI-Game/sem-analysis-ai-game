"use client";

import { PropsWithChildren, useEffect } from "react";
import { useTool } from "../tools/provider";
import { ToolName, kToolFactory } from "../tools";
import { useState } from "react";

/**
 * Client-side interactive tool selection menu
 * 
 * Searches project directory for an icon that matches the toolName,
 * otherwise displays the text of the toolName
 */
export function ToolbarButton(
  props: PropsWithChildren<{ toolName: ToolName, selected: boolean}>
): JSX.Element {
  const [tool, setTool] = useTool();

  const [imageURL, setImageURL] = useState<null | string>(null);

  useEffect(() => {
    const url = `/${props.toolName.toLowerCase().replace(" ", "_")}.png`
    const img = new Image();
    img.src = url;

    if (img.complete) {
      setImageURL(url);
    }
    else {
      img.onload = () => {
        setImageURL(url);
      }
    }
  }, [props.toolName]);

  return (
    <button
      className="text-[#333] rounded p-1 m-1 transition border-black hover:border-blue-800 border-2"
      style={{
        backgroundColor: props.selected ? "#a8c6ff" : "#f1f5f9"
      }}
      key={props.toolName}
      onClick={() => setTool(kToolFactory[props.toolName](tool.size))}
    >
      {
        imageURL ?
          <img src={imageURL} className="w-5 rounded"/>
        :
          props.children
      }
    </button>
  );
}
