import "../styles/globals.css";
import type { Metadata } from "next";
import { SocketConnectionProvider } from "@/components";
import { PropsWithChildren } from "react";

export const dynamicParams = false;

export const metadata: Metadata = {
  title: "Behind Density Lines",
  description: "Behind Density Lines",
};

export default function RootLayout(props: PropsWithChildren) {
  return (
    <html lang="en">
      <body className="bg-slate-50">
        <SocketConnectionProvider>{props.children}</SocketConnectionProvider>
      </body>
    </html>
  );
}
