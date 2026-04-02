import { ApiType } from "./apiClient.js";

/**
 * Maps OpenAPI spec paths to actual API paths based on API type.
 *
 * The spec uses paths like /v1/sites/{siteId}/devices
 *
 * local:     /v1/... → /proxy/network/integration/v1/...
 * cloud-v1:  /v1/... → /v1/...
 * cloud-ea:  /v1/... → /integration/v1/...
 */
export function mapSpecPathToApiPath(specPath: string, apiType: ApiType): string {
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
 * Returns the API type description for the schema tool response.
 */
export function getApiTypeDescription(apiType: ApiType): string {
  switch (apiType) {
    case "local":
      return "Local controller (session auth)";
    case "cloud-v1":
      return "UniFi Cloud API v1 (API key auth)";
    case "cloud-ea":
      return "UniFi Cloud EA API (API key auth)";
  }
}
