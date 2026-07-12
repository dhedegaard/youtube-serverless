import * as z from 'zod/mini'

const envSchema = z.object({
  SECRET: z.string().check(z.minLength(1)),
  CRON_SECRET: z.optional(z.string().check(z.minLength(1))),

  YOUTUBE_API_KEY: z.string().check(z.minLength(1)),

  MONGODB_URI: z.string().check(z.startsWith('mongodb')) as z.ZodMiniType<
    `mongodb${string}`,
    `mongodb${string}`
  >,
})

export const SERVER_ENV = envSchema.parse(
  Object.fromEntries(Object.keys(envSchema.shape).map((key) => [key, process.env[key]]))
)
