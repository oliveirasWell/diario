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
      include: ["lib/**/*.ts", "app/api/auth/**/route.ts"],
      // wiring with no logic of its own: generated docs, client/transport setup, observability
      exclude: [
        "lib/gql-documents.ts",
        "lib/graphql-error.ts",
        "lib/graphql-client.ts",
        "lib/query-options.ts",
        "lib/mongodb.ts",
        "lib/sentry-config.ts",
        "lib/capture-unexpected.ts",
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
