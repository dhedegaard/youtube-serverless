import type { NextConfig } from 'next'

export default {
  reactStrictMode: true,
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ['zod'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.ggpht.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ytimg.com',
        pathname: '/**',
      },
    ],
  },
} satisfies NextConfig
