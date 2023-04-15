import { Metadata } from "next";
import { ReactNode } from "react";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "New youtube videos",
  description: "Aggregating youtube videos since 2015",
  viewport: "minimum-scale=1, initial-scale=1, width=device-width",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  appleWebApp: true,
  openGraph: {
    siteName: "Youtube",
    url: "https://ut.dhedegaard.dk/",
    title: "New youtube videos",
    description: "Aggregating youtube videos since 2015",
  },
  themeColor: "#222222",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>{children}</body>
    </html>
  );
}
