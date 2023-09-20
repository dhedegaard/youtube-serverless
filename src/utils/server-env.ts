import { z } from "zod";

const envSchema = z.object({
  YOUTUBE_API_KEY: z.string().nonempty(),
});

export const SERVER_ENV = envSchema.parse(
  Object.fromEntries(
    Object.keys(envSchema.shape).map((key) => [key, process.env[key]])
  )
);
