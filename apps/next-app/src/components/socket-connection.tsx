"use client";

import SocketIOClient, { Socket } from "socket.io-client";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const SocketContext = createContext<Socket | null>(null);

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}

/**
 * Provides a socket connection to children
 */
export function SocketConnectionProvider(
  props: PropsWithChildren
): JSX.Element {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect((): any => {
    const newSocket = SocketIOClient(process.env.BASE_URL!, {
      path: "/api/socketio",
      addTrailingSlash: false,
    });

    newSocket.on("connect", () => {
      setSocket(newSocket);
    });

    newSocket.on("disconnect", () => {
      setSocket(null);
    });

    return () => {
      setSocket(null);
      newSocket.disconnect();
    };
  }, []);

  return (
    <>
      {socket && socket.connected ? null : (
        <div className="absolute top-0 right-0">
          <h1>Connecting...</h1>
        </div>
      )}
      <SocketContext.Provider value={socket}>
        {props.children}
      </SocketContext.Provider>
    </>
  );
}
