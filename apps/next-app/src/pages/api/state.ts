import { DrawEvent, kImages } from "@/util";
import { NextApiRequest, NextApiResponse } from "next";

const serverState = kImages.map(() => <DrawEvent[]>[]);

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const imageIndex = parseInt(request.query.imageIndex as string);
  if (request.method === "POST") {
    const body = await JSON.parse(request.body);
    serverState[imageIndex].push(body);
    return response.status(200);
  } else if (request.method === "GET") {
    return response.status(200).json({ state: serverState[imageIndex] });
  }
}
