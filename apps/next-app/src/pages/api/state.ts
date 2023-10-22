import { DrawEvent, kImages } from "@/util";
import { NextApiRequest, NextApiResponse } from "next";

/**
 * the server state is stored as an array of draw events in the order in which they were received.
 * clients must recreate the drawing by iterating through the array and drawing each event in order.
 */
export const serverState = kImages.map(() => <DrawEvent[]>[]);

/**
 * responds with the current server state. this is invoked by a worker thread performing SSR.
 */
export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  return response
    .status(200)
    .json({ state: serverState[parseInt(request.query.imageIndex as string)] });
}
