import { serverState } from "@/server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  // get the room state
  const state = serverState[parseInt(request.query.imageIndex as string)];
  if (request.query.historyIndex) {
    // the raw log index of the last draw event a client received.
    const historyIndex = parseInt(request.query.historyIndex as string);
    const initialState = [];
    let current = state.shortLog.tail;
    let maxSegment = 0;
    while (current.type !== "HeadNode" && current.historyIndex > historyIndex) {
      if (current.type === "DrawNode") {
        initialState.unshift({
          type: current.type,
          event: current.event,
          segment: current.segment,
          historyIndex: current.historyIndex,
        });
      } else {
        const points = [...current.points.entries()].map(([key, value]) => ({
          pos: key.split(",").map((x) => parseInt(x)) as [number, number],
          boundary: value.boundary,
        }));
        initialState.unshift({
          type: current.type,
          event: {
            boundary: points
              .filter(({ boundary }) => boundary)
              .map(({ pos }) => pos),
            fillStart: points.find(({ boundary }) => !boundary)?.pos,
          },
          segment: current.segment,
        });
        maxSegment = Math.max(maxSegment, current.segment);
      }
      current = current.prev;
    }
    return response.status(200).json({ initialState });
  } else {
    return response.status(500).json({ error: "historyIndex not provided" });
  }
}
