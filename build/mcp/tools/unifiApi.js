import { z } from "zod";
import { AxiosError } from "axios";
import { getApiClient, getApiType } from "../../utils/apiClient.js";
import { mapSpecPathToApiPath } from "../../utils/pathMapper.js";
import { buildUrl } from "../../utils/httpUtils.js";
import { createLogger } from "../../utils/logger.js";
import { getOpenApiSpec, detectMethod } from "../../utils/openApiSpec.js";
import { ResponseFormatter } from "../../utils/responseFormatter.js";
const logger = createLogger("UnifiApi");
export const schema = {
    path: z.string().min(1).describe("OpenAPI spec path (e.g. /v1/sites/{siteId}/devices)"),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional().describe("HTTP method. Auto-detected if omitted."),
    pathParams: z.record(z.union([z.string(), z.number()])).optional().describe("Path parameters to substitute (e.g. { siteId: 'abc' })"),
    queryParams: z.record(z.unknown()).optional().describe("Query string parameters"),
    body: z.record(z.unknown()).optional().describe("JSON request body"),
};
export const name = "unifi-api";
export const description = "Execute any UniFi Network API operation. Specify the spec path (e.g. /v1/sites/{siteId}/devices) and optional path params, query params, or body. HTTP method is auto-detected. Use unifi-api-schema to discover available paths.";
export const annotations = {
    title: "UniFi API",
    readOnlyHint: false,
    openWorldHint: true,
};
export async function handler(input) {
    const { path, pathParams, queryParams, body } = input;
    const apiType = getApiType();
    try {
        const spec = getOpenApiSpec();
        const specPathEntry = Object.entries(spec.paths).find(([p]) => p === path);
        if (!specPathEntry) {
            return ResponseFormatter.error("Path not found", `'${path}' not found in OpenAPI spec. Use unifi-api-schema to discover available paths.`);
        }
        const [specPath] = specPathEntry;
        const methodRaw = input.method
            ? input.method.toLowerCase()
            : (detectMethod(specPath) ?? "get");
        const apiPath = mapSpecPathToApiPath(specPath, apiType);
        const url = buildUrl(apiPath, pathParams);
        logger.info(`Calling ${methodRaw.toUpperCase()} ${url} (${apiType})`);
        const client = getApiClient();
        let responseData;
        if (methodRaw === "get" || methodRaw === "delete") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await client[methodRaw](url, { params: queryParams });
            responseData = response.data;
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const response = await client[methodRaw](url, body ?? {});
            responseData = response.data;
        }
        return ResponseFormatter.success(`${methodRaw.toUpperCase()} ${url} succeeded`, responseData);
    }
    catch (error) {
        logger.error(`${input.method ?? "GET"} ${path} failed`, {
            error: error instanceof Error ? error.message : "Unknown error",
        });
        if (error instanceof AxiosError && error.response) {
            const status = error.response.status;
            const data = error.response.data;
            const detail = data?.error ?? data?.message ?? error.message;
            if (status === 401) {
                return ResponseFormatter.error("Authentication failed", "Check UNIFI_API_KEY or session cookie");
            }
            if (status === 403) {
                return ResponseFormatter.error("Access denied", `Insufficient permissions for ${path}`);
            }
            if (status === 404) {
                return ResponseFormatter.error("Not found", `Path ${path} not found`);
            }
            if (status === 429) {
                return ResponseFormatter.error("Rate limited", "Too many requests, slow down");
            }
            return ResponseFormatter.error(`HTTP ${status}`, detail);
        }
        return ResponseFormatter.error("Request failed", error instanceof Error ? error.message : "Unknown error");
    }
}
