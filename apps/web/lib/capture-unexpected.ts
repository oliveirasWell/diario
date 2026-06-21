import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled, sentryEnvironment } from "@/lib/sentry-config";

type CaptureFields = Record<string, string | number | boolean | null | undefined>;

let initialized = false;

function ensureSentry() {
  if (initialized || typeof window !== "undefined") return;
  initialized = true;
  const dsn = process.env.SENTRY_DSN;
  if (!isSentryEnabled(dsn)) return;
  Sentry.init({
    dsn,
    enabled: true,
    tracesSampleRate: 0,
    environment: sentryEnvironment(),
  });
}

export function captureUnexpected(err: unknown, event: string, fields?: CaptureFields) {
  if (typeof window !== "undefined") return;
  ensureSentry();
  if (!isSentryEnabled(process.env.SENTRY_DSN)) return;

  Sentry.withScope((scope) => {
    scope.setTag("event", event);
    if (fields) {
      for (const [key, value] of Object.entries(fields)) {
        if (value != null) scope.setExtra(key, value);
      }
    }
    Sentry.captureException(err);
  });
}
