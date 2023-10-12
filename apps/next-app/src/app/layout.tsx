import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Behind Density Lines",
  description: "Behind Density Lines",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
