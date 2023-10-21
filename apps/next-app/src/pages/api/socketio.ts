import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { Server as HttpServer } from "http";
import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { DrawEvent, kImages } from "@/util";

export const config = {
  api: {
    bodyParser: false,
  },
};

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
      const url = connection.request.headers.referer;
      const imageIndex = url?.slice(url.lastIndexOf("/") + 1);
      if (imageIndex && imageIndex !== "") {
        connection.join(imageIndex);
      }
      connection.on("join", (data: { room: string }) => {
        connection.join(data.room);
      });
      connection.on("leave", (data: { room: string }) => {
        connection.leave(data.room);
      });
      connection.on("draw", async (data: DrawEvent) => {
        let room = undefined;
        for (const connectedRoom of connection.rooms) {
          if (connectedRoom !== connection.id) {
            room = connectedRoom;
            break;
          }
        }
        if (room) {
          connection.broadcast.to(room).emit("draw", data);
          await fetch(
            `http://localhost${
              process.env.PORT ? `:${process.env.PORT}` : ""
            }/api/state?imageIndex=${room}`,
            {
              method: "POST",
              body: JSON.stringify(data),
              cache: "no-cache",
            }
          );
        } else {
          throw new Error("Draw event from user not in a room");
        }
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}
