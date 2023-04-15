import { Metadata } from "next";
import { ReactNode } from "react";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Latest youtube videos",
  description: "Latest youtube videos",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
