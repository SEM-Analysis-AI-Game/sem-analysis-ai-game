import { serverState } from "@/server";
import { NextApiRequest, NextApiResponse } from "next";
// @ts-ignore
import GIFEncoder from "gif-encoder-2";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const state = serverState[parseInt(request.query.imageIndex as string)];
  const copiedEncoder = {
    ...state.gifEncoder,
  };
  const data = new Uint8Array(copiedEncoder.out.getData());
  return response
    .status(200)
    .setHeader("Content-Type", "image/gif")
    .setHeader("Content-Disposition", "attachment; filename=animation.gif")
    .setHeader("Content-Length", data.length)
    .write(data, "binary");
}
