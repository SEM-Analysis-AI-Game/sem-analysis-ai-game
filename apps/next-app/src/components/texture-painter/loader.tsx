"use client";

import * as THREE from "three";
import { PropsWithChildren, useContext, useEffect, useState } from "react";
import { TexturePainterActionDispatchContext } from "./context";
import { LoadedBackgroundAction } from "./state";

export function Loader(props: PropsWithChildren): JSX.Element {
  const painterDispatch = useContext(TexturePainterActionDispatchContext);
  if (!painterDispatch) {
    throw new Error("No painter dispatch found");
  }

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = localStorage.getItem("background");
    if (img) {
      const loader = new THREE.TextureLoader();
      loader.load(img, (texture) => {
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        painterDispatch(new LoadedBackgroundAction(texture));
        setLoaded(true);
      });
    } else {
      throw new Error("No background image found");
    }
  }, []);

  return loaded ? <>{props.children}</> : <></>;
}
