import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { Server as HttpServer } from "http";
import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { DrawEvent } from "@/util";

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
      connection.on("draw", (data: DrawEvent) => {
        connection.broadcast.emit("draw", data);
        fetch("http://localhost:3000/api/state", {
          method: "POST",
          body: JSON.stringify(data),
          cache: "no-cache",
        });
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}
