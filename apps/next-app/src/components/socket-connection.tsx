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

/**
 * provides a socket connection to children
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

    return () => {
      setSocket(null);
      newSocket.disconnect();
    };
  }, []);

  return (
    <>
      {socket ? null : (
        <div className="absolute top-0 right-0">
          <h1>Connecting...</h1>
        </div>
      )}
      <SocketConnectionContext.Provider value={socket}>
        {props.children}
      </SocketConnectionContext.Provider>
    </>
  );
}
