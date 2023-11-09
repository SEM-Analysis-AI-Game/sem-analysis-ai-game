import { serverState } from "@/server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const state = serverState[parseInt(request.query.imageIndex as string)];
  if (!request.query.historyIndex) {
    return response.status(500).json({ error: "historyIndex is required" });
  }
  const historyIndex = parseInt(request.query.historyIndex as string);
  return response.status(200).json({
    initialState: state.rawLog.slice(historyIndex + 1).map((event, index) => ({
      ...event,
      historyIndex: historyIndex + index + 1,
    })),
  });
}
