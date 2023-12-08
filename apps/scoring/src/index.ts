import * as THREE from "three";
import {
  ClientState,
  DrawResponse,
  FloodFillResponse,
  applyDrawEventClient,
  floodFillClient,
} from "drawing";
import { kImageResolutions } from "images";
import SocketIOClient from "socket.io-client";
import { ServerWebSocket } from "bun";
import * as fs from "fs";

const references: { [key: number]: number[] } = {};
for (let i = 0; i < kImageResolutions.length; i++) {
  references[i] = [];
  const reference = JSON.parse(
    fs.readFileSync(`./references/${i}.json`, "utf8")
  )["data"];
  for (const [value, count] of reference) {
    for (let k = 0; k < count; k++) {
      references[i].push(value);
    }
  }
}

/**
 * @param resolution The width and height of the input image
 * @param reference Segment index array of correct/reference image
 * @param input Segement index array of a given image to assign a score to
 */
const scoringFunction = (
  resolution: readonly [number, number],
  reference: readonly number[],
  input: readonly number[]
) => {
  /*
    Approach:
      Perform an optimal mapping of correct segments to given segments. This mapping should be injective
      but not necessarily surjective. That is, every correct segment should match to at most 1 given segment.
      With that mapping count the total number of pixels which have been correctly drawn
      Report the answer as that value divided by the total number of pixels on the image.
    */

  const [width, height] = resolution;
  const size = width * height;
  if (reference.length != size || input.length != size) {
    throw Error(
      "Dimension of correct and image must match the total size of the image"
    );
  }

  // 1. Count for each correct segment the total number of pixels for each

  // input segment index to a map that associates a reference segment index to the count
  const counts = new Map<number, Map<number, number>>();
  const found = new Array<boolean>(size).fill(false);
  let numReferencePoints = 0;
  let refseg = 0;
  let wrongfill = 0;
  let vals = [];
  for (let i = 0; i < size; i++) {
    if (reference[i] !== -1) {
      numReferencePoints++;
      refseg++;
    } else if (input[i] !== -1) {
      // i.e. reference is null and the user segmented something there
      vals.push(input[i]);
      numReferencePoints++;
      wrongfill++;
    }

    if (input[i] === -1) {
      continue;
    }

    if (found[i]) {
      continue;
    }

    let [x, y] = [i % width, Math.floor(i / width)];
    // perform DFS
    const stack: number[] = [i];
    //console.log('starting dfs on', i)
    found[i] = true;
    while (stack.length > 0) {
      const n = stack.pop() as number;
      const segmentIndex = input[n];
      const referenceIndex = reference[n];
      //console.log(segmentIndex, referenceIndex);
      if (referenceIndex !== -1) {
        if (!counts.has(segmentIndex as number)) {
          counts.set(segmentIndex as number, new Map<number, number>());
        }

        const countMap = counts.get(segmentIndex as number);
        if (countMap?.has(referenceIndex)) {
          countMap.set(
            referenceIndex,
            (countMap.get(referenceIndex) as number) + 1
          );
        } else {
          countMap?.set(referenceIndex, 1);
        }
      }
      for (const dir of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const [nx, ny] = [x + dir[0], y + dir[1]];
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const index = nx + ny * width;
          //console.log('exploring',index,input[index],found[index],segmentIndex);
          if (!found[index] && input[index] === segmentIndex) {
            stack.push(index);
            //console.log(stack);
            found[index] = true;
          }
        }
      }
    }
  }

  //console.log('refseg', refseg);
  //console.log('wrongfill', wrongfill);
  //console.log(vals);

  //console.log("Counts");
  counts.forEach((value) => {
    //console.log(Object.fromEntries(value))
  });

  // FOR OPTIMAL SOLUTION:
  // To perfrom an optimal matching that associates reference segment indexes to input
  // we can use a maximum flow algorithm on a bipartite graph

  // FOR NAIVE SOLUTION:
  // For each matching associate the input segment with the one it is overlapping the greatest with and mark that segment as used
  const used = new Set<number>();
  const inputToReference = new Map<number, number>();
  counts.forEach((val: Map<number, number>, key: number) => {
    let [max, maxInd]: [number, number | null] = [0, null];
    val.forEach((count: number, ind: number) => {
      if (used.has(ind)) return;
      if (count > max) {
        max = count;
        maxInd = ind;
      }
    });

    if (maxInd !== null) {
      inputToReference.set(key, maxInd);
      used.add(maxInd);
    }
  });

  //console.log("Reference map")
  //console.log(Object.fromEntries(inputToReference));

  let correctCount = 0;

  counts.forEach((value: Map<number, number>, inputIndex: number) => {
    const referenceIndex = inputToReference.get(inputIndex);
    if (referenceIndex !== -1 && referenceIndex !== -1) {
      correctCount += value.get(referenceIndex as number) as number;
    }
  });

  const totalCorrect = correctCount;

  //console.log(totalCorrect, '/', numReferencePoints);

  const score = totalCorrect / numReferencePoints;

  return score;
};

function percentScoringFunction(input: readonly (number | null)[]) {
  // count non-null, non-undefined cells
  let count = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== null && input[i] !== undefined) {
      count++;
    }
  }
  return count / input.length;
}

const states: ClientState[] = [];

for (let i = 0; i < kImageResolutions.length; i++) {
  states.push({
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

function outputScores() {
  const scores = [];
  for (let i = 0; i < states.length; i++) {
    const state = states[i];
    const segments = [];
    for (const seg of state.canvas) {
      if (seg) {
        segments.push(seg.segment);
      } else {
        segments.push(-1);
      }
    }
    const dimension = state.resolution;

    let score;
    if (!Object.hasOwn(references, i)) {
      // Use a percent scoring function if there is no reference image.
      score = percentScoringFunction(segments);
    } else {
      // Compare to a reference image if there is one.
      score = scoringFunction(dimension, references[i], segments);
    }

    scores.push({ dim: dimension, segments: segments, score });
  }
  return scores;
}

let users: ServerWebSocket<unknown>[] = [];

setInterval(() => {
  const scores = outputScores();
  for (const user of users) {
    user.send(JSON.stringify({ scores: scores.map((s) => s.score) }));
  }
}, 30000);

Bun.serve({
  port: 3002,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }
    return new Response("Upgrade failed :(", { status: 500 });
  },
  websocket: {
    message() {},
    open(ws) {
      users.push(ws);
    },
    close(ws) {
      users = users.filter((user) => user !== ws);
    },
  },
});

const socket = SocketIOClient("http://localhost:3000", {
  path: "/api/socketio",
  addTrailingSlash: false,
});

socket.on("connect", () => {
  for (let i = 0; i < states.length; i++) {
    socket.emit("join", { room: i.toString() });
  }

  socket.on(
    "draw",
    (data: {
      imageIndex: number;
      draw: Omit<DrawResponse, "historyIndex">;
      fills: FloodFillResponse[];
    }) => {
      const imageState = states[data.imageIndex];
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
