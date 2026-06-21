export function isSentryEnabled(dsn: string | undefined) {
  return Boolean(dsn && process.env.NODE_ENV === "production");
}

export function sentryEnvironment() {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
}
