import { StateResponse } from "@/common";
import { serverState } from "@/server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const state = serverState[parseInt(request.query.imageIndex as string)];
  const initialState: StateResponse = { draws: [], fills: [] };
  let current = state.shortLog.draws.head.next;
  while (current !== null) {
    initialState.draws.push(current.event);
    current = current.next;
  }
  let currentFill = state.shortLog.fills.head.next;
  while (currentFill !== null) {
    initialState.fills.push({
      points: Array.from(currentFill.event.points),
      segment: currentFill.event.segment,
    });
    currentFill = currentFill.next;
  }
  return response.status(200).json(initialState);
}
