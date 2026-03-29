import { z } from "zod";
import { AxiosError } from "axios";
import { getApiClient } from "../../utils/apiClient.js";
import { createLogger } from "../../utils/logger.js";
import { ResponseFormatter } from "../../utils/responseFormatter.js";
import { getOpenApiSpec, detectMethod } from "../../utils/openApiSpec.js";
import { getApiType, mapSpecPathToApiPath, buildUrl } from "../../utils/pathMapper.js";
const logger = createLogger("UnifiApi");
export const schema = {
    path: z
        .string()
        .min(1)
        .describe('The API path as defined in the OpenAPI spec, e.g. "/v1/sites/{siteId}/devices". ' +
        "Use unifi-api-schema to discover available paths. " +
        "The path will be automatically mapped to the correct Cloud API URL based on UNIFI_API_TYPE."),
    method: z
        .enum(["GET", "POST", "PUT", "DELETE", "PATCH"])
        .optional()
        .describe("HTTP method. If omitted, auto-detected from the OpenAPI spec (prefers GET when available)."),
    pathParams: z
        .record(z.union([z.string(), z.number()]))
        .optional()
        .describe('Path parameter values to substitute into the URL, e.g. { "siteId": "abc123", "deviceId": "xyz" }'),
    params: z
        .record(z.unknown())
        .optional()
        .describe("For GET/DELETE: query string parameters. For POST/PUT/PATCH: JSON request body."),
};
export const name = "unifi-api";
export const description = "Execute any UniFi Network Cloud API operation. Specify the path from the OpenAPI spec " +
    "(e.g. /v1/sites/{siteId}/devices) and optional path params, query params, or body. " +
    "HTTP method is auto-detected from the spec. " +
    "Auth uses X-API-Key from UNIFI_API_KEY env var. " +
    "Path is mapped to the correct Cloud API URL based on UNIFI_API_TYPE (cloud-ea or cloud-v1). " +
    "Use unifi-api-schema to discover available paths and parameters.";
export const annotations = {
    title: "UniFi API",
    readOnlyHint: false,
    openWorldHint: true,
};
export async function handler(input) {
    const { path, pathParams, params } = input;
    // Resolve HTTP method
    const methodRaw = input.method
        ? input.method.toLowerCase()
        : (detectMethod(path) ?? "get");
    // Get API type and map spec path to actual API path
    const apiType = getApiType();
    const mappedPath = mapSpecPathToApiPath(path, apiType);
    // Build the actual URL with path params substituted
    let url;
    try {
        url = buildUrl(mappedPath, pathParams);
    }
    catch (err) {
        return ResponseFormatter.error("Invalid path parameters", err instanceof Error ? err.message : "Unknown error");
    }
    logger.info(`Executing ${methodRaw.toUpperCase()} ${url}`, {
        apiType,
        specPath: path,
        hasParams: !!params,
    });
    // Validate path exists in spec
    const spec = getOpenApiSpec();
    if (!spec.paths[path]) {
        return ResponseFormatter.error("Path not found in spec", `"${path}" is not a valid path. Use unifi-api-schema to discover available paths.`);
    }
    try {
        const client = getApiClient();
        let responseData;
        if (methodRaw === "get" || methodRaw === "delete") {
            const response = await client[methodRaw](url, { params });
            responseData = response.data;
        }
        else {
            const response = await client[methodRaw](url, params ?? {});
            responseData = response.data;
        }
        return ResponseFormatter.success(`${methodRaw.toUpperCase()} ${url} succeeded`, responseData);
    }
    catch (error) {
        logger.error(`${methodRaw.toUpperCase()} ${url} failed`, {
            error: error instanceof Error ? error.message : "Unknown error",
        });
        if (error instanceof AxiosError && error.response) {
            const status = error.response.status;
            const data = error.response.data;
            const detail = data?.message ||
                data?.error ||
                data?.errors ||
                error.message;
            if (status === 400) {
                return ResponseFormatter.error(`Bad request: ${url}`, detail);
            }
            if (status === 401) {
                return ResponseFormatter.error("Authentication failed", "Check UNIFI_API_KEY — ensure it is a valid UniFi Cloud API key");
            }
            if (status === 403) {
                return ResponseFormatter.error("Access denied", `Insufficient permissions for ${url}. Ensure the API key has the required scopes.`);
            }
            if (status === 404) {
                return ResponseFormatter.error("Resource not found", `Path ${url} not found or resource does not exist`);
            }
            if (status === 429) {
                return ResponseFormatter.error("Rate limited", "Too many requests. The UniFi Cloud API has rate limits — wait before retrying.");
            }
            if (status >= 500) {
                return ResponseFormatter.error("UniFi Cloud API server error", `HTTP ${status} while processing ${url}`);
            }
            return ResponseFormatter.error(`HTTP ${status}: ${url}`, detail);
        }
        if (error instanceof AxiosError && error.code === "ECONNABORTED") {
            return ResponseFormatter.error("Request timeout", `Request to ${url} timed out. Increase UNIFI_TIMEOUT if needed.`);
        }
        return ResponseFormatter.error(`Failed: ${url}`, error instanceof Error ? error.message : "Unknown error");
    }
}
