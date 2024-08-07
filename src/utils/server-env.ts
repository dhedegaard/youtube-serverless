import { z } from 'zod'

const envSchema = z.object({
  SECRET: z.string().min(1),
  CRON_SECRET: z.optional(z.string().min(1)),

  YOUTUBE_API_KEY: z.string().min(1),

  MONGODB_URI: z.string().startsWith('mongodb') as z.ZodType<`mongodb${string}`>,
})

export const SERVER_ENV = envSchema.parse(
  Object.fromEntries(Object.keys(envSchema.shape).map((key) => [key, process.env[key]]))
)
