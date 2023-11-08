import { serverState } from "@/server";
import { DrawResponse, FloodFillResponse, StateResponse } from "drawing";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const imageIndex = parseInt(request.query.imageIndex as string);
  const state = serverState[imageIndex];
  const initialState: { draws: DrawResponse[]; fills: FloodFillResponse[] } = {
    draws: [],
    fills: [],
  };
  let current = state.shortLog.draws.head.next;
  while (current !== null) {
    initialState.draws.push(current.value);
    current = current.next;
  }
  let currentFill = state.shortLog.fills.head.next;
  while (currentFill !== null) {
    initialState.fills.push({
      startingPoint: (currentFill.value.points.values().next().value as string)
        .split(",")
        .map((x) => parseInt(x)) as [number, number],
      segment: currentFill.value.segment,
    });
    currentFill = currentFill.next;
  }
  const res: StateResponse = initialState;
  return response.status(200).json(res);
}
