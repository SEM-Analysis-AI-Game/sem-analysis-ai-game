import { serverState } from "@/server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const state = serverState[parseInt(request.query.imageIndex as string)];
  const initialState = [];
  let current = state.shortLog.head.next;
  while (current !== null) {
    initialState.push({
      event: current.event,
      segment: current.segment,
      historyIndex: current.historyIndex,
    });
    current = current.next;
  }
  return response.status(200).json({ initialState });
}
