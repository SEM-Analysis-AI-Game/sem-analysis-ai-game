import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEM Analysis AI Game",
  description: "SEM Analysis AI Game",
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
