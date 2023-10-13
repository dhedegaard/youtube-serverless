import { NextRequest } from "next/server";
import { SERVER_ENV } from "./server-env";

export const isApiRequestAuthenticated = (request: NextRequest): boolean =>
  request.headers.get("authorization") === SERVER_ENV.SECRET ||
  request.nextUrl.searchParams.get("token") === SERVER_ENV.SECRET;
