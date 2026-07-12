import type { NextConfig } from 'next'

export default {
  reactStrictMode: true,
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ['zod/mini'],
  },
} satisfies NextConfig
