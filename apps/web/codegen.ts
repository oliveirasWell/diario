import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./schema.graphql",
  generates: {
    "src/gql/schema-types.ts": {
      plugins: ["typescript"],
      config: {
        maybeValue: "T | null | undefined",
        scalars: {
          DateTime: "string",
        },
      },
    },
  },
};

export default config;
