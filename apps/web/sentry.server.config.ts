import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled, sentryEnvironment } from "@/lib/sentry-config";

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: isSentryEnabled(dsn),
  tracesSampleRate: 0,
  environment: sentryEnvironment(),
});
