import { StateResponse } from "@/common";
import { serverState } from "@/server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const state = serverState[parseInt(request.query.imageIndex as string)];
  const initialState: StateResponse = { draws: [], cuts: [] };
  let current = state.shortLog.draws.head.next;
  while (current !== null) {
    initialState.draws.push({
      event: current.event,
      segment: current.segment,
      historyIndex: current.historyIndex,
    });
    current = current.next;
  }
  let currentCut = state.shortLog.cuts.head.next;
  while (currentCut !== null) {
    initialState.cuts.push({
      points: Array.from(currentCut.points),
      segment: currentCut.segment,
    });
    currentCut = currentCut.next;
  }
  return response.status(200).json(initialState);
}
