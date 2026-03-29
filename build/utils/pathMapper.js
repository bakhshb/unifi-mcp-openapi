/**
 * Maps OpenAPI spec paths to actual API paths based on API type.
 *
 * The spec uses paths like /v1/sites/{siteId}/devices
 *
 * local:     /v1/... → /proxy/network/integration/v1/...
 * cloud-v1:  /v1/... → /v1/...
 * cloud-ea:  /v1/... → /integration/v1/...
 */
export function mapSpecPathToApiPath(specPath, apiType) {
    if (apiType === "local") {
        // Local controller uses proxy path
        return `/proxy/network/integration${specPath}`;
    }
    if (apiType === "cloud-ea") {
        // Cloud EA uses /integration prefix
        return `/integration${specPath}`;
    }
    // cloud-v1: use as-is
    return specPath;
}
/**
 * Substitutes path parameters in the URL template.
 * e.g. /v1/sites/{siteId}/devices + { siteId: "abc123" } → /v1/sites/abc123/devices
 */
export function buildUrl(pathTemplate, pathParams) {
    if (!pathParams)
        return pathTemplate;
    return pathTemplate.replace(/\{([^}]+)\}/g, (_, key) => {
        const val = pathParams[key];
        if (val === undefined || val === null) {
            throw new Error(`Missing path parameter: ${key}`);
        }
        return String(val);
    });
}
/**
 * Returns the API type description for the schema tool response.
 */
export function getApiTypeDescription(apiType) {
    switch (apiType) {
        case "local":
            return "Local controller (session auth)";
        case "cloud-v1":
            return "UniFi Cloud API v1 (API key auth)";
        case "cloud-ea":
            return "UniFi Cloud EA API (API key auth)";
    }
}
