import { z } from "zod";
import { createLogger } from "../../utils/logger.js";
import { ResponseFormatter } from "../../utils/responseFormatter.js";
import {
  getOpenApiSpec,
  resolveSchema,
  type OpenApiOperation,
  type HttpMethod,
} from "../../utils/openApiSpec.js";
import { getApiType, mapSpecPathToApiPath } from "../../utils/pathMapper.js";

const logger = createLogger("UnifiApiSchema");

const SUPPORTED_METHODS: HttpMethod[] = ["get", "post", "put", "delete", "patch"];

interface ParameterInfo {
  name: string;
  required: boolean;
  type?: string;
  description?: string;
}

interface OperationDetail {
  path: string;
  cloudApiPath: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  pathParams?: ParameterInfo[];
  queryParams?: ParameterInfo[];
  requestBody?: Record<string, unknown>;
}

function extractOperation(
  spec: ReturnType<typeof getOpenApiSpec>,
  path: string,
  method: HttpMethod,
  op: OpenApiOperation
): OperationDetail {
  const apiType = getApiType();
  const detail: OperationDetail = {
    path,
    cloudApiPath: mapSpecPathToApiPath(path, apiType),
    method: method.toUpperCase(),
    operationId: op.operationId,
    summary: op.summary,
    description: op.description,
    tags: op.tags,
  };

  if (op.parameters && op.parameters.length > 0) {
    const pathParams: ParameterInfo[] = [];
    const queryParams: ParameterInfo[] = [];

    for (const param of op.parameters) {
      const info: ParameterInfo = {
        name: param.name,
        required: param.required ?? false,
        type: (param.schema?.["type"] as string) ?? "string",
        description: param.description,
      };
      if (param.in === "path") {
        pathParams.push(info);
      } else if (param.in === "query") {
        queryParams.push(info);
      }
    }

    if (pathParams.length > 0) detail.pathParams = pathParams;
    if (queryParams.length > 0) detail.queryParams = queryParams;
  }

  if (op.requestBody) {
    const jsonContent = op.requestBody.content["application/json"];
    if (jsonContent?.schema) {
      detail.requestBody = resolveSchema(
        spec as unknown as Record<string, unknown>,
        jsonContent.schema
      );
    }
  }

  return detail;
}

export const schema = {
  tag: z
    .string()
    .optional()
    .describe(
      'Filter operations by tag, e.g. "Sites", "UniFi Devices", "Clients", "Networks", "Firewall"'
    ),
  path: z
    .string()
    .optional()
    .describe(
      'Get details for a specific spec path, e.g. "/v1/sites/{siteId}/devices"'
    ),
  method: z
    .enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
    .optional()
    .describe(
      "Filter by HTTP method when combined with path (defaults to listing all methods for that path)"
    ),
};

export const name = "unifi-api-schema";

export const description =
  "Discover UniFi Network Cloud API operations and their parameters from the OpenAPI spec. " +
  "Call with no args for a tag summary, with tag to list operations, " +
  "or with path for full parameter details including request body schema. " +
  "Returns the mapped cloudApiPath showing the actual URL that will be called.";

export const annotations = {
  title: "UniFi API Schema",
  readOnlyHint: true,
  idempotentHint: true,
};

export async function handler(input: {
  tag?: string;
  path?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
}) {
  try {
    const spec = getOpenApiSpec();
    const apiType = getApiType();

    // Specific path requested
    if (input.path) {
      const pathObj = spec.paths[input.path];
      if (!pathObj) {
        return ResponseFormatter.error(
          "Path not found",
          `No path "${input.path}" in spec. Use unifi-api-schema without args to see available tags.`
        );
      }

      const operations: OperationDetail[] = [];
      const methodFilter = input.method?.toLowerCase() as HttpMethod | undefined;

      for (const method of SUPPORTED_METHODS) {
        if (method in pathObj) {
          if (methodFilter && method !== methodFilter) continue;
          const op = pathObj[method] as OpenApiOperation;
          operations.push(extractOperation(spec, input.path, method, op));
        }
      }

      return ResponseFormatter.success(`Schema for ${input.path}`, {
        specPath: input.path,
        cloudApiPath: mapSpecPathToApiPath(input.path, apiType),
        apiType,
        operations,
      });
    }

    // Tag filter — list operations for that tag
    if (input.tag) {
      const operations: Array<{
        path: string;
        cloudApiPath: string;
        method: string;
        summary?: string;
        operationId?: string;
      }> = [];

      for (const [path, methods] of Object.entries(spec.paths)) {
        for (const method of SUPPORTED_METHODS) {
          if (!(method in methods)) continue;
          const op = methods[method] as OpenApiOperation;
          if (op.tags && op.tags.includes(input.tag)) {
            operations.push({
              path,
              cloudApiPath: mapSpecPathToApiPath(path, apiType),
              method: method.toUpperCase(),
              summary: op.summary,
              operationId: op.operationId,
            });
          }
        }
      }

      if (operations.length === 0) {
        return ResponseFormatter.error(
          "Tag not found",
          `No operations with tag "${input.tag}". Use unifi-api-schema without args to see available tags.`
        );
      }

      return ResponseFormatter.success(`Operations in tag: ${input.tag}`, {
        tag: input.tag,
        apiType,
        count: operations.length,
        operations: operations.sort((a, b) => a.path.localeCompare(b.path)),
      });
    }

    // No filter — return tag summary
    const tagCounts: Record<string, number> = {};
    let totalOperations = 0;

    for (const methods of Object.values(spec.paths)) {
      for (const method of SUPPORTED_METHODS) {
        if (!(method in methods)) continue;
        const op = methods[method] as OpenApiOperation;
        totalOperations++;
        for (const tag of op.tags ?? ["untagged"]) {
          tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
        }
      }
    }

    return ResponseFormatter.success("Available tags", {
      apiTitle: (spec.info["title"] as string) ?? "UniFi Network API",
      apiVersion: (spec.info["version"] as string) ?? "unknown",
      apiType,
      baseUrl: `https://api.ui.com`,
      totalPaths: Object.keys(spec.paths).length,
      totalOperations,
      tags: tagCounts,
    });
  } catch (error) {
    logger.error("Failed to read API schema", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return ResponseFormatter.error(
      "Failed to read API schema",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
