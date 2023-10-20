import { DrawEvent, kImages } from "@/util";
import { NextApiRequest, NextApiResponse } from "next";

export const serverState = kImages.map(() => <DrawEvent[]>[]);

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method === "POST") {
    const body = JSON.parse(request.body);
    serverState[0].push(body);
  }
  response.status(200).json({
    state: serverState[0],
  });
}
