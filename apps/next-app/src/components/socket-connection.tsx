"use client";

import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import SocketIOClient, { Socket } from "socket.io-client";

const SocketConnectionContext = createContext<Socket | null>(null);

export function useSocket(): Socket | null {
  return useContext(SocketConnectionContext);
}

export function SocketConnectionProvider(
  props: PropsWithChildren
): JSX.Element {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect((): any => {
    const socket = SocketIOClient(process.env.BASE_URL!, {
      path: "/api/socketio",
      addTrailingSlash: false,
    });

    socket.on("connect", () => {
      setSocket(socket);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <SocketConnectionContext.Provider value={socket}>
      {props.children}
    </SocketConnectionContext.Provider>
  );
}
