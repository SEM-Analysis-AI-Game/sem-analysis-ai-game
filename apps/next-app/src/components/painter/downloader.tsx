import { useThree } from "@react-three/fiber";
import { Dispatch, RefObject, useEffect, useState } from "react";
import { Vector2, Texture } from "three";
import { EffectComposer, ShaderPass, TexturePass } from "three-stdlib";
import { getImage } from "@/common";
import { ClientState } from "drawing";

export const vertexShader = `
varying vec3 vUv;

void main() {
    vUv = position;
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition; 
}`;

const premultiplyAlphaShader = `
varying vec3 vUv;

uniform sampler2D background;
uniform sampler2D overlay;

void main() {
    vec4 overlay = texture2D(overlay, vUv.xy * 0.5 + 0.5);
    gl_FragColor = overlay + vec4(texture2D(background, vUv.xy * 0.5 + 0.5).rgb * (1.0 - overlay.a), 1.0);
}
`;

export function Downloader(props: {
  state: ClientState;
  currentPan: readonly [number, number];
  downloadOverlayRef: RefObject<HTMLAnchorElement>;
  downloadFullImageRef: RefObject<HTMLAnchorElement>;
  setClickDownloadOverlay: Dispatch<() => void>;
  setClickDownloadFullImage: Dispatch<() => void>;
}): null {
  const { gl } = useThree();

  const [backgroundImage, setBackgroundImage] =
    useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = new Image(
      props.state.resolution[0],
      props.state.resolution[1]
    );
    image.src = getImage(props.state.imageIndex).src;
    image.onload = () => {
      setBackgroundImage(image);
    };
  }, [props.state.imageIndex, props.state.resolution]);

  useEffect(() => {
    function updateAnchorHrefs(
      anchor: HTMLAnchorElement,
      composer: EffectComposer
    ) {
      gl.clear();
      const oldSize = new Vector2();
      gl.getSize(oldSize);
      gl.setSize(props.state.resolution[0], props.state.resolution[1]);
      composer.render();
      anchor.href = gl.domElement.toDataURL();
      anchor.click();
      gl.setSize(oldSize.x, oldSize.y);
    }

    props.setClickDownloadOverlay(() => () => {
      if (props.downloadOverlayRef.current) {
        const composer = new EffectComposer(gl);
        composer.addPass(new TexturePass(props.state.drawing));
        updateAnchorHrefs(props.downloadOverlayRef.current, composer);
      }
    });

    props.setClickDownloadFullImage(() => () => {
      if (props.downloadFullImageRef.current && backgroundImage) {
        const composer = new EffectComposer(gl);
        composer.addPass(
          new ShaderPass({
            vertexShader,
            fragmentShader: premultiplyAlphaShader,
            uniforms: {
              background: { value: new Texture(backgroundImage) },
              overlay: { value: props.state.drawing },
            },
          })
        );
        updateAnchorHrefs(props.downloadFullImageRef.current, composer);
      }
    });
  }, [props, gl, backgroundImage]);

  return null;
}
