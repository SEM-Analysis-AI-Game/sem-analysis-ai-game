import { serverState } from "@/server";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const state = serverState[parseInt(request.query.imageIndex as string)];
  const data = new Uint8Array(state.gifEncoder.out.getData());
  return response
    .status(200)
    .setHeader("Content-Type", "image/gif")
    .setHeader("Content-Disposition", "attachment; filename=animation.gif")
    .setHeader("Content-Length", data.length)
    .write(data, "binary");
}
