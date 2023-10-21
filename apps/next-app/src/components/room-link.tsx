"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useSocket } from "./socket-connection";

export function RoomLink(props: { room: string }): JSX.Element {
  const socket = useSocket();

  const clickHandler = useCallback(() => {
    socket!.emit("join", { room: props.room });
  }, [socket]);

  return (
    <Link
      href={`/${props.room}`}
      key={props.room}
      onClick={clickHandler}
      aria-disabled={!!!socket}
    >
      {props.room}
    </Link>
  );
}
