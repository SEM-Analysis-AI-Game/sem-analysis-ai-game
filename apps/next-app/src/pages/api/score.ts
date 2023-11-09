import { serverState } from "@/server";
import { scoringFunction } from "@/server/scoring";
import { NextApiRequest, NextApiResponse } from "next";
// @ts-ignore
import GIFEncoder from "gif-encoder-2";

type EncodingSegment = readonly [null | number, number];

// Store run length encoded version to preserve space
const referencesRLE: {[key: number]: EncodingSegment[]} = {
    1: [[null,262216],[0,5],[null,726],[0,7],[null,724],[0,9],[null,723],[0,9],[null,723],[0,9],[null,3],[0,11],[null,709],[0,9],[null,1],[0,17],[null,705],[0,28],[null,704],[0,29],[null,703],[0,30],[null,702],[0,32],[null,700],[0,41],[null,691],[0,42],[null,689],[0,44],[null,688],[0,44],[null,688],[0,44],[null,688],[0,44],[null,688],[0,44],[null,688],[0,43],[null,689],[0,42],[null,690],[0,42],[null,690],[0,41],[null,690],[0,42],[null,690],[0,41],[null,691],[0,41],[null,691],[0,41],[null,691],[0,41],[null,691],[0,41],[null,691],[0,40],[null,692],[0,40],[null,692],[0,40],[null,692],[0,39],[null,693],[0,39],[null,693],[0,39],[null,693],[0,38],[null,694],[0,38],[null,695],[0,36],[null,697],[0,34],[null,698],[0,34],[null,699],[0,32],[null,701],[0,30],[null,704],[0,27],[null,707],[0,24],[null,710],[0,21],[null,713],[0,18],[null,717],[0,13],[null,241376]]


};

const references: {[key: number]: (number | null)[]} = {};
for (const key in referencesRLE) {
    references[key] = [];
    for (const [value, count] of referencesRLE[key]) {
        for (let i = 0; i < count; i++) {
            references[key].push(value);
        }
    }
}
// console.log(references)

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
    const imageIndex = parseInt(request.query.imageIndex as string)
    const state = serverState[imageIndex];
    const segments = state.canvas.map(value => value.segment);
    const dimension = state.resolution;

    if (!Object.hasOwn(references, imageIndex)) {
        throw Error(`There is no reference segmentation for image index ${imageIndex}`);
    }

    const score = scoringFunction(dimension, references[imageIndex], segments);

    return response
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json({
            dim: dimension,
            segments: segments,
            score
    })
}
