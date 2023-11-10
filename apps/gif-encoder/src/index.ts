import * as THREE from "three";
import {
  ClientState,
  DrawResponse,
  FloodFillResponse,
  applyDrawEventClient,
  floodFillClient,
} from "drawing";
import SocketIOClient from "socket.io-client";
import sharp from "sharp";
// @ts-ignore
import GIFEncoder from "gif-encoder-2";

const kImageResolutions: readonly (readonly [number, number])[] = [
  [732, 732],
  [732, 732],
  [732, 732],
  [512, 347],
  [511, 347],
  [1510, 896],
  [1600, 978],
  [1459, 1044],
];

const state: (ClientState & {
  gifEncoder: GIFEncoder;
})[] = [];

for (let i = 0; i < kImageResolutions.length; i++) {
  const background = new Uint8ClampedArray(
    await sharp(`./sem-images/${i}.png`)
      .extract({
        left: 0,
        top: 0,
        width: kImageResolutions[i][0],
        height: kImageResolutions[i][1],
      })
      .ensureAlpha()
      .raw()
      .toBuffer()
  );
  const gifEncoder = new GIFEncoder(
    kImageResolutions[i][0],
    kImageResolutions[i][1],
    "octree"
  );
  gifEncoder.setRepeat(0);
  gifEncoder.setFrameRate(20);
  gifEncoder.start();
  state.push({
    gifEncoder,
    background,
    canvas: new Array(kImageResolutions[i][0] * kImageResolutions[i][1]),
    resolution: kImageResolutions[i],
    imageIndex: i,
    nextSegmentIndex: 0,
    drawing: new THREE.DataTexture(
      new Uint8Array(background),
      kImageResolutions[i][0],
      kImageResolutions[i][1]
    ),
    flipY: true,
  });
}

Bun.serve({
  port: 3001,
  fetch(request) {
    const imageIndex = parseInt(request.url.split("/").pop()!);
    const data = new Uint8Array(state[imageIndex].gifEncoder.out.getData());
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Content-Disposition": "attachment; filename=animation.gif",
        "Content-Length": data.length.toString(),
      },
    });
  },
});

const socket = SocketIOClient("http://localhost:3000", {
  path: "/api/socketio",
  addTrailingSlash: false,
});

socket.on("connect", () => {
  for (let i = 0; i < state.length; i++) {
    socket.emit("join", { room: i.toString() });
  }

  socket.on(
    "draw",
    (data: {
      imageIndex: number;
      draw: Omit<DrawResponse, "historyIndex">;
      fills: FloodFillResponse[];
    }) => {
      const imageState = state[data.imageIndex];
      imageState.nextSegmentIndex = Math.max(
        imageState.nextSegmentIndex,
        data.draw.segment + 1
      );
      applyDrawEventClient(imageState, data.draw, true);

      for (const fill of data.fills) {
        imageState.nextSegmentIndex = Math.max(
          imageState.nextSegmentIndex,
          fill.segment + 1
        );
      }
      floodFillClient(imageState, data.fills, true);
      imageState.gifEncoder.addFrame(imageState.drawing.image.data);
    }
  );
});
