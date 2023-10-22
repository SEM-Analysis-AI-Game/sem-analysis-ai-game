import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { Server as HttpServer } from "http";
import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { DrawEvent } from "@/util";
import { serverState } from "./state";

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
            serverState[parseInt(room)].push({
              ...data,
              timestamp: Date.now(),
            });
          } else {
            throw new Error("Draw event from user not in a room");
          }
        });
    });

    res.socket.server.io = io;
  }
  res.end();
}
