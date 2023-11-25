import { Metadata, Viewport } from 'next'
import { ReactNode } from 'react'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'New youtube videos',
  description: 'Aggregating youtube videos since 2015',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  appleWebApp: true,
  openGraph: {
    siteName: 'Youtube',
    url: 'https://ut.dhedegaard.dk/',
    title: 'New youtube videos',
    description: 'Aggregating youtube videos since 2015',
  },
}
export const viewport: Viewport = {
  themeColor: '#222222',
  minimumScale: 1,
  initialScale: 1,
  width: 'device-width',
}
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>{children}</body>
    </html>
  )
}
