import { ClientState, smoothDrawClient } from "@/client";
import { DrawEvent } from "@/common";
import { useThree } from "@react-three/fiber";
import { Dispatch, RefObject, useEffect, useState } from "react";
import { DataTexture, Vector2, Texture } from "three";
import { EffectComposer, ShaderPass, TexturePass } from "three-stdlib";
// @ts-ignore
import GIFEncoder from "gif-encoder-2";

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
  setDownloadAnimation: Dispatch<(log: { initialState: DrawEvent[] }) => void>;
}): null {
  const { gl } = useThree();

  const [backgroundImage, setBackgroundImage] =
    useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = new Image(
      props.state.resolution[0],
      props.state.resolution[1]
    );
    image.src = props.state.background.src;
    image.onload = () => {
      setBackgroundImage(image);
    };
  }, [props.state.background, props.state.resolution]);

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

    props.setDownloadAnimation(() => (log: { initialState: DrawEvent[] }) => {
      if (backgroundImage) {
        const canvas = document.createElement("canvas");
        canvas.width = props.state.resolution[0];
        canvas.height = props.state.resolution[1];
        const context = canvas.getContext("2d")!;
        context.drawImage(backgroundImage, 0, 0);
        const backgroundData = context.getImageData(
          0,
          0,
          props.state.resolution[0],
          props.state.resolution[1]
        ).data;
        canvas.remove();
        const animationState: ClientState = {
          nextSegmentIndex: 0,
          segmentBuffer: new Array(props.state.segmentBuffer.length),
          resolution: props.state.resolution,
          drawing: new DataTexture(
            new Uint8Array(backgroundData),
            props.state.drawing.image.width,
            props.state.drawing.image.height
          ),
          background: props.state.background,
          imageIndex: props.state.imageIndex,
        };
        const encoder = new GIFEncoder(
          props.state.resolution[0],
          props.state.resolution[1],
          "octree"
        );
        encoder.setRepeat(1);
        encoder.setFrameRate(20);
        encoder.start();
        for (const event of log.initialState) {
          smoothDrawClient(animationState, event, true, backgroundData);
          encoder.addFrame(animationState.drawing.image.data);
        }
        encoder.finish();
        const anchor = document.createElement("a");
        const blobUrl = URL.createObjectURL(
          new Blob([new Uint8Array(encoder.out.getData())], {
            type: "image/gif",
          })
        );
        anchor.href = blobUrl;
        anchor.download = "animation.gif";
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(blobUrl);
      }
    });
  }, [props, gl, backgroundImage]);

  return null;
}
