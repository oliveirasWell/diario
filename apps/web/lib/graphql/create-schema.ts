import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createSchema } from "graphql-yoga";
import { resolvers } from "./resolvers";

const typeDefs = readFileSync(join(process.cwd(), "schema.graphql"), "utf8");

export function createGraphQLSchema() {
  return createSchema({ typeDefs, resolvers });
}
