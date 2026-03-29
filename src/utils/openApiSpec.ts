import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createLogger } from "./logger.js";

const logger = createLogger("OpenApiSpec");

// Resolve spec path relative to this file's location
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// From build/utils/ → ../../reference.json
const SPEC_PATH = join(__dirname, "../../reference.json");

export interface OpenApiSpec {
  openapi: string;
  info: Record<string, unknown>;
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, Record<string, OpenApiOperation>>;
  components?: Record<string, unknown>;
  tags?: Array<{ name: string; description?: string }>;
}

export interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: {
    content: Record<string, { schema: Record<string, unknown> }>;
    required?: boolean;
  };
  responses?: Record<string, unknown>;
}

export interface OpenApiParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: Record<string, unknown>;
}

let cachedSpec: OpenApiSpec | null = null;

/**
 * Loads and caches the OpenAPI spec from the local JSON file.
 */
export function getOpenApiSpec(): OpenApiSpec {
  if (cachedSpec) return cachedSpec;

  logger.info("Loading OpenAPI spec from local file", { path: SPEC_PATH });
  const content = readFileSync(SPEC_PATH, "utf-8");
  cachedSpec = JSON.parse(content) as OpenApiSpec;
  logger.info("OpenAPI spec loaded", {
    paths: Object.keys(cachedSpec.paths).length,
  });
  return cachedSpec;
}

export type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

const SUPPORTED_METHODS: HttpMethod[] = ["get", "post", "put", "delete", "patch"];

/**
 * Auto-detects the preferred HTTP method for a given path.
 * Preference order: get → post → put → delete → patch
 */
export function detectMethod(path: string): HttpMethod | null {
  const spec = getOpenApiSpec();
  const pathObj = spec.paths[path];
  if (!pathObj) return null;

  for (const method of SUPPORTED_METHODS) {
    if (method in pathObj) return method;
  }
  return null;
}

function resolveRef(
  spec: Record<string, unknown>,
  ref: string,
  depth = 0
): Record<string, unknown> {
  if (depth > 8) return { note: "Max resolution depth reached" };

  const parts = ref.replace(/^#\//, "").split("/");
  let current: unknown = spec;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return {};
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current !== "object" || current === null) return {};
  return resolveSchema(spec, current as Record<string, unknown>, depth + 1);
}

export function resolveSchema(
  spec: Record<string, unknown>,
  schema: Record<string, unknown>,
  depth = 0
): Record<string, unknown> {
  if (depth > 8) return { note: "Max resolution depth reached" };

  if (typeof schema["$ref"] === "string") {
    return resolveRef(spec, schema["$ref"], depth);
  }

  if (Array.isArray(schema["allOf"])) {
    let merged: Record<string, unknown> = {};
    for (const sub of schema["allOf"] as Record<string, unknown>[]) {
      merged = { ...merged, ...resolveSchema(spec, sub, depth + 1) };
    }
    return merged;
  }

  if (Array.isArray(schema["oneOf"]) || Array.isArray(schema["anyOf"])) {
    const variants = (schema["oneOf"] ?? schema["anyOf"]) as Record<string, unknown>[];
    return {
      oneOf: variants.map((v) => resolveSchema(spec, v, depth + 1)),
    };
  }

  if (schema["type"] === "object" && schema["properties"]) {
    const props = schema["properties"] as Record<string, Record<string, unknown>>;
    const required = new Set<string>(
      Array.isArray(schema["required"]) ? (schema["required"] as string[]) : []
    );
    const result: Record<string, unknown> = {};

    for (const [propName, propSchema] of Object.entries(props)) {
      const resolved = resolveSchema(spec, propSchema, depth + 1);
      result[propName] = {
        ...resolved,
        required: required.has(propName),
      };
    }
    return { type: "object", properties: result };
  }

  return schema;
}
