import { serverState } from "@/server";
import { scoringFunction } from "@/server/scoring";
import { NextApiRequest, NextApiResponse } from "next";
// @ts-ignore
import GIFEncoder from "gif-encoder-2";

const references: {[key: number]: number[]} = {
    1: []
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
    const imageIndex = parseInt(request.query.imageIndex as string)
    const state = serverState[imageIndex];
    const segments = state.canvas.map(value => value.segment);
    const dimension = state.resolution;
    const score = scoringFunction([5, 5], [
        0, 0, 1, 1, 0,
        0, 1, 1, 1, 1,
        0, 0, 1, 0, 0,
        0, 2, 0, 0, 0, 
        0, 2, 0, 0, 0
    ], [
        0, 0, 2, 2, 0,
        0, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 1, 0, 0, 0,
    ]);

    if (!Object.hasOwn(references, imageIndex)) {
        throw Error(`There is no reference segmentation for image index ${imageIndex}`);
    }

    // const score = scoringFunction(dimension, references[imageIndex], segments);

    // const score = 0.58342;

    return response
        .status(200)
        .setHeader("Content-Type", "application/json")
        .json({
            dim: dimension,
            segments: segments,
            score
    })
}
