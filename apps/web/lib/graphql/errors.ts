import { createGraphQLError } from "graphql-yoga";
import { log } from "@/lib/log";

const USER_ERROR_CODE = "USER_ERROR";
const GENERIC_MESSAGE = "Algo deu errado. Tente novamente.";

type WithExtensions = { extensions?: { code?: string }; originalError?: unknown };

export function userError(message: string) {
  return createGraphQLError(message, { extensions: { code: USER_ERROR_CODE } });
}

export function isUserError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const candidate = error as WithExtensions;
  if (candidate.extensions?.code === USER_ERROR_CODE) {
    return true;
  }
  return candidate.originalError ? isUserError(candidate.originalError) : false;
}

export function maskGraphQLError(error: unknown): Error {
  if (isUserError(error)) {
    return error as Error;
  }
  log.error("graphql.unexpected_error", undefined, error);
  return createGraphQLError(GENERIC_MESSAGE);
}
