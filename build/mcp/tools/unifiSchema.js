import { z } from "zod";
import { getOpenApiSpec } from "../../utils/openApiSpec.js";
import { getApiType } from "../../utils/apiClient.js";
import { mapSpecPathToApiPath, getApiTypeDescription } from "../../utils/pathMapper.js";
import { ResponseFormatter } from "../../utils/responseFormatter.js";
export const schema = {
    tag: z.string().optional().describe("Filter by tag (e.g. 'sites', 'devices', 'networks')"),
    path: z.string().optional().describe("Get details for a specific path (e.g. /v1/sites/{siteId}/devices)"),
};
export const name = "unifi-api-schema";
export const description = "Discover available UniFi Network API operations from the OpenAPI spec. Call with no args for a tag overview, with tag to list operations in that tag, or with path for full parameter and request body details.";
export const annotations = {
    title: "UniFi API Schema",
    readOnlyHint: true,
    openWorldHint: true,
};
export async function handler(input) {
    const { tag, path } = input;
    const apiType = getApiType();
    const spec = getOpenApiSpec();
    if (path) {
        const specPathEntry = Object.entries(spec.paths).find(([p]) => p === path);
        if (!specPathEntry) {
            return ResponseFormatter.error("Path not found", `'${path}' not found. Available: ${Object.keys(spec.paths).slice(0, 10).join(", ")}...`);
        }
        const [specPath, operations] = specPathEntry;
        const apiPath = mapSpecPathToApiPath(specPath, apiType);
        const methods = Object.keys(operations).filter((m) => m !== "parameters");
        return ResponseFormatter.success(`Path: ${specPath}`, {
            apiType,
            apiTypeDescription: getApiTypeDescription(apiType),
            baseUrl: apiType === "local" ? "https://192.168.100.1" : "https://api.ui.com",
            specPath,
            cloudApiPath: apiPath,
            methods,
        });
    }
    if (tag) {
        const matchingPaths = Object.entries(spec.paths)
            .filter(([, ops]) => {
            const tagList = ops.tags ?? [];
            return tagList.includes(tag);
        })
            .map(([p]) => p);
        if (matchingPaths.length === 0) {
            const allTags = [...new Set(Object.values(spec.paths).flatMap((ops) => ops.tags ?? []))];
            return ResponseFormatter.error("Tag not found", `Tag '${tag}' not found. Available: ${allTags.join(", ")}`);
        }
        return ResponseFormatter.success(`Tag: ${tag} (${matchingPaths.length} paths)`, { apiType, tag, paths: matchingPaths });
    }
    // Return all tags summary
    const tagMap = new Map();
    for (const [p, ops] of Object.entries(spec.paths)) {
        const tags = ops.tags ?? ["untagged"];
        for (const t of tags) {
            if (!tagMap.has(t))
                tagMap.set(t, []);
            tagMap.get(t).push(p);
        }
    }
    return ResponseFormatter.success(`UniFi Network API — ${Object.keys(spec.paths).length} paths across ${tagMap.size} tags`, {
        apiType,
        apiTypeDescription: getApiTypeDescription(apiType),
        baseUrl: apiType === "local" ? "https://192.168.100.1" : "https://api.ui.com",
        pathPrefix: apiType === "local" ? "/proxy/network/integration" : apiType === "cloud-ea" ? "/integration" : "",
        tags: Object.fromEntries(tagMap),
        totalPaths: Object.keys(spec.paths).length,
    });
}
