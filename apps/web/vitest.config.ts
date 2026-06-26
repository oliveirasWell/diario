import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["node_modules/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "lib/attendance-date.ts",
        "lib/export-attendance.ts",
        "lib/export-grades.ts",
        "lib/utils.ts",
        "lib/graphql/auth.ts",
        "lib/graphql/context.ts",
        "lib/graphql/create-schema.ts",
        "lib/graphql/db-bridge.ts",
        "lib/graphql/prisma.ts",
        "lib/graphql/resolvers/**/*.ts",
        "app/api/auth/**/route.ts",
      ],
      exclude: [
        "lib/gql-documents.ts",
        "lib/graphql-error.ts",
        "lib/graphql-client.ts",
        "lib/mongodb.ts",
        "lib/sentry-config.ts",
        "lib/log.ts",
        "**/*.config.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": root,
    },
  },
});
