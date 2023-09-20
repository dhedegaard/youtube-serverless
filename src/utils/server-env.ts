import { z } from "zod";

const envSchema = z.object({
  YOUTUBE_API_KEY: z.string().nonempty(),
  AWS_DYNAMODB_ACCESS_KEY: z.string().nonempty(),
  AWS_DYNAMODB_SECRET_ACCESS_KEY: z.string().nonempty(),
  AWS_DYNAMODB_REGION: z.string().nonempty(),
  AWS_DYNAMODB_TABLE: z.string().nonempty(),
});

export const SERVER_ENV = envSchema.parse(
  Object.fromEntries(
    Object.keys(envSchema.shape).map((key) => [key, process.env[key]])
  )
);
