import * as THREE from "three";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { Server as HttpServer } from "http";
import { Server as NetServer, Socket } from "net";
import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { DrawEvent, getSegment, kImages, smoothPaint } from "@/util";
import { segmentState } from "@/server-state";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function socket(
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
        let segment = getSegment(
          segmentState.segmentBuffers[0], // this should be the image index
          [kImages[0].width, kImages[0].height], // this should be the image resolution
          data.from
        );
        if (segment === -1) {
          if (!data.color) {
            throw new Error("Color is required for new segments");
          }
          segmentState.segmentData[0].push({
            color: new THREE.Color(`#${data.color}`),
          });
          segment = segmentState.segmentData.length - 1;
        }
        smoothPaint(
          segmentState.segmentBuffers[0], // this should be the image index
          segment,
          segmentState.segmentData[0], // this should be the image index
          null,
          data.to,
          data.from,
          [kImages[0].width, kImages[0].height] // this should be the image resolution
        );
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}
