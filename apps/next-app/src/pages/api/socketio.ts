import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { Server as HttpServer } from "http";
import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { CondensedStateNode, DrawEvent, kImages, smoothPaint } from "@/util";
import { addCondensedStateEntry, serverState } from "./state";

export const config = {
  api: {
    bodyParser: false,
  },
};

// registers the socket.io server to the Next.js server
export default async function socket(
  req: NextApiRequest,
  res: NextApiResponse & {
    socket: Socket & {
      server: NetServer & {
        io: SocketIOServer;
      };
    };
  }
) {
  if (!res.socket.server.io) {
    const httpServer: HttpServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: "/api/socketio",
      addTrailingSlash: false,
    });

    io.on("connection", (connection) => {
      // ** IMPORTANT ** a user should only be in one room at a time. if we want
      // users to join multiple rooms at once, we will also need to provide a way
      // for users to specify which room they are drawing in when they send draw
      // events

      // register an event listener to allow users to join rooms
      connection
        .on("join", (data: { room: string }) => {
          connection.join(data.room);
        })
        // register an event listener to allow users to leave rooms
        .on("leave", (data: { room: string }) => {
          connection.leave(data.room);
        })
        // register an event listener to allow users to send draw events
        .on("draw", async (data: DrawEvent) => {
          // find the room the user is in
          let room = undefined;
          for (const connectedRoom of connection.rooms) {
            if (connectedRoom !== connection.id) {
              room = connectedRoom;
              break;
            }
          }

          // if the user is in a room, broadcast the draw event to the room and
          // save the draw event to the server state
          if (room) {
            connection.broadcast.to(room).emit("draw", data);
            const imageIndex = parseInt(room);
            const state = serverState[imageIndex];
            state.events.push(data);

            const node: CondensedStateNode = {
              type: "CondensedStateNode",
              data: {
                event: {
                  from: data.from,
                  to: data.to,
                  segment: data.segment,
                  color: data.color,
                  size: data.size,
                },
                historyIndex: state.events.length - 1,
                numPixels: 0,
              },
              next: null,
              prev: null,
            };

            if (state.condensedState.length > 0) {
              if (state.condensedState.tail!.type === "CondensedStateNode") {
                const previousNode = state.condensedState.tail!;
                const lastEvent = previousNode.data!.event;
                if (
                  lastEvent.to[0] === data.from[0] &&
                  lastEvent.to[1] === data.from[1]
                ) {
                  const diff = [
                    data.to[0] - lastEvent.from[0],
                    data.to[1] - lastEvent.from[1],
                  ];
                  const lastDiff = [
                    lastEvent.to[0] - lastEvent.from[0],
                    lastEvent.to[1] - lastEvent.from[1],
                  ];
                  const lengthDiff = Math.sqrt(
                    diff[0] * diff[0] + diff[1] * diff[1]
                  );
                  const lastLengthDiff = Math.sqrt(
                    lastDiff[0] * lastDiff[0] + lastDiff[1] * lastDiff[1]
                  );
                  const diffNormalized = [
                    diff[0] / lengthDiff,
                    diff[1] / lengthDiff,
                  ];
                  const lastDiffNormalized = [
                    lastDiff[0] / lastLengthDiff,
                    lastDiff[1] / lastLengthDiff,
                  ];
                  // const dotProduct =
                  //   diffNormalized[0] * lastDiffNormalized[0] +
                  //   diffNormalized[1] * lastDiffNormalized[1];
                  // if (dotProduct === 1) {
                  //   node.data!.event.from = lastEvent.from;
                  //   previousNode.prev!.next = null;
                  //   state.condensedState.length--;
                  //   state.condensedState.segmentSizes[
                  //     previousNode.data!.event.segment
                  //   ]--;
                  //   state.condensedState.tail = previousNode.prev!;
                  // }
                }
              }
            }

            state.condensedState.tail.next = node;
            node.prev = state.condensedState.tail;
            state.condensedState.tail = node;
            state.condensedState.length++;
            if (state.condensedState.segmentSizes.length > data.segment) {
              state.condensedState.segmentSizes[data.segment]++;
            } else {
              state.condensedState.segmentSizes.push(1);
            }

            addCondensedStateEntry(imageIndex, node);
          } else {
            throw new Error("Draw event from user not in a room");
          }
        });
    });

    res.socket.server.io = io;
  }
  res.end();
}
