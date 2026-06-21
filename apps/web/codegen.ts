import type { CodegenConfig } from "@graphql-codegen/cli";

const scalarConfig = {
  scalars: {
    DateTime: "string",
  },
  useTypeImports: true,
};

const config: CodegenConfig = {
  schema: "./schema.graphql",
  documents: ["lib/gql-documents.ts"],
  generates: {
    "src/gql/schema.ts": {
      plugins: ["typescript"],
      config: scalarConfig,
    },
    "src/gql/graphql.ts": {
      plugins: ["typescript", "typescript-operations", "typed-document-node"],
      config: {
        ...scalarConfig,
        gqlTagName: "graphql",
      },
    },
  },
};

export default config;
