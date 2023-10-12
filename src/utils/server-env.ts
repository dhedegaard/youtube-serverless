import { z } from "zod";

const envSchema = z.object({
  SECRET: z.string().min(1),
  YOUTUBE_API_KEY: z.string().min(1),
  AWS_DYNAMODB_ACCESS_KEY: z.string().min(1),
  AWS_DYNAMODB_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_DYNAMODB_REGION: z.string().min(1),
  AWS_DYNAMODB_TABLE: z.string().min(1),
});

export const SERVER_ENV = envSchema.parse(
  Object.fromEntries(
    Object.keys(envSchema.shape).map((key) => [key, process.env[key]])
  )
);
