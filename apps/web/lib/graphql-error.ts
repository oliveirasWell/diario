import { ClientError } from "graphql-request";

export function isUnauthorizedError(err: unknown): boolean {
  if (err instanceof ClientError) {
    return err.response.status === 401;
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes("unauthorized") || msg.includes("401");
  }
  return false;
}

export function formatGraphqlError(err: unknown): string {
  if (err instanceof ClientError) {
    if (err.response.status === 401) {
      return "Sessão expirada. Faça login novamente.";
    }
    const msg = err.response.errors?.[0]?.message;
    if (msg) {
      return msg;
    }
  }

  if (
    err instanceof TypeError ||
    (err instanceof Error && err.message.includes("Failed to fetch"))
  ) {
    return "Sem conexão. Verifique a internet.";
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }
  return "Algo deu errado. Tente novamente.";
}
