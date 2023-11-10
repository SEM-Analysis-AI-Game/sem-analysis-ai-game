import * as THREE from "three";
import {
  ClientState,
  DrawResponse,
  FloodFillResponse,
  applyDrawEventClient,
  floodFillClient,
} from "drawing";
import SocketIOClient from "socket.io-client";

const kImageResolutions: readonly (readonly [number, number])[] = [
  [732, 732],
  [732, 732],
  [732, 732],
  [1024, 768],
  [1024, 768],
  [1024, 1144],
  [1024, 1144],
  [1024, 1144],
];

const state: ClientState[] = [];

for (let i = 0; i < kImageResolutions.length; i++) {
  state.push({
    background: null,
    canvas: new Array(kImageResolutions[i][0] * kImageResolutions[i][1]),
    resolution: kImageResolutions[i],
    imageIndex: i,
    nextSegmentIndex: 0,
    drawing: new THREE.DataTexture(
      new Uint8Array(kImageResolutions[i][0] * kImageResolutions[i][1] * 4),
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
    return new Response(
      JSON.stringify({
        test: imageIndex,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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
    }
  );
});
