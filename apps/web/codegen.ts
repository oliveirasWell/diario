import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./schema.graphql",
  documents: ["lib/gql-documents.ts"],
  generates: {
    "src/gql/graphql.ts": {
      plugins: ["typescript", "typescript-operations", "typed-document-node"],
      config: {
        gqlTagName: "graphql",
        scalars: {
          DateTime: "string",
        },
        useTypeImports: true,
      },
    },
  },
};

export default config;
