import { ClientState } from "@/client";
import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Dispatch, RefObject, useEffect } from "react";
import { Vector2 } from "three";
import { EffectComposer, ShaderPass, TexturePass } from "three-stdlib";

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

  const backgroundTexture = useTexture(props.state.background.src);

  useEffect(() => {
    props.setClickDownloadOverlay(() => () => {
      if (props.downloadOverlayRef.current) {
        const composer = new EffectComposer(gl);
        composer.addPass(new TexturePass(props.state.drawing));
        gl.clear();
        const oldSize = new Vector2();
        gl.getSize(oldSize);
        gl.setSize(props.state.resolution[0], props.state.resolution[1]);
        composer.render();
        props.downloadOverlayRef.current.href = gl.domElement.toDataURL();
        gl.setSize(oldSize.x, oldSize.y);
      }
    });

    props.setClickDownloadFullImage(() => () => {
      if (props.downloadFullImageRef.current && backgroundTexture) {
        const composer = new EffectComposer(gl);
        composer.addPass(
          new ShaderPass({
            vertexShader,
            fragmentShader: premultiplyAlphaShader,
            uniforms: {
              background: { value: backgroundTexture },
              overlay: { value: props.state.drawing },
            },
          })
        );
        gl.clear();
        const oldSize = new Vector2();
        gl.getSize(oldSize);
        gl.setSize(props.state.resolution[0], props.state.resolution[1]);
        composer.render();
        props.downloadFullImageRef.current.href = gl.domElement.toDataURL();
        gl.setSize(oldSize.x, oldSize.y);
      }
    });
  }, [props, gl, backgroundTexture]);

  return null;
}
