import { PropsWithChildren } from "react";

export const dynamicParams = false;

export default function PainterLayout(props: PropsWithChildren) {
  return <span className="overflow-hidden">{props.children}</span>;
}
