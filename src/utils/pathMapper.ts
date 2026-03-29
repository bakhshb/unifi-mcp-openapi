/**
 * Maps OpenAPI spec paths to UniFi Cloud API paths based on API type.
 *
 * The spec uses paths like /v1/sites/{siteId}/devices
 * - cloud-v1:  use as-is              → /v1/sites/{siteId}/devices
 * - cloud-ea:  prepend /integration/  → /integration/v1/sites/{siteId}/devices
 */

export type ApiType = "cloud-v1" | "cloud-ea";

export function getApiType(): ApiType {
  const raw = process.env["UNIFI_API_TYPE"] ?? "cloud-ea";
  if (raw === "cloud-v1" || raw === "cloud-ea") return raw;
  return "cloud-ea";
}

/**
 * Converts a spec path to the actual Cloud API path.
 */
export function mapSpecPathToApiPath(specPath: string, apiType: ApiType): string {
  if (apiType === "cloud-ea") {
    // /v1/... → /integration/v1/...
    return `/integration${specPath}`;
  }
  // cloud-v1: use as-is
  return specPath;
}

/**
 * Substitutes path parameters in the URL template.
 * e.g. /v1/sites/{siteId}/devices + { siteId: "abc123" } → /v1/sites/abc123/devices
 */
export function buildUrl(
  pathTemplate: string,
  pathParams?: Record<string, unknown>
): string {
  if (!pathParams) return pathTemplate;
  return pathTemplate.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const val = pathParams[key];
    if (val === undefined || val === null) {
      throw new Error(`Missing path parameter: ${key}`);
    }
    return String(val);
  });
}
