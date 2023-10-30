import { PropsWithChildren } from "react";

export const dynamicParams = false;

export default function PainterLayout(props: PropsWithChildren) {
  return <main className="overflow-hidden">{props.children}</main>;
}
