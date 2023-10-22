"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useSocket } from "./socket-connection";

/**
 * links to a room. disabled when the socket is not connected, emits
 * a "join" event when clicked.
 */
export function RoomLink(props: { room: string }): JSX.Element {
  const socket = useSocket();

  // join the room when the link is clicked (this should be disabled when the socket is not
  // connected)
  const clickHandler = useCallback(() => {
    socket!.emit("join", { room: props.room });
  }, [socket]);

  return (
    <Link
      href={`/${props.room}`}
      key={props.room}
      onClick={clickHandler}
      aria-disabled={!socket}
    >
      {props.room}
    </Link>
  );
}
