import { getOpenApiSpec } from "./openApiSpec.js";
import { SUPPORTED_METHODS, type HttpMethod } from "./constants.js";

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

export function detectMethod(path: string): HttpMethod | null {
  const spec = getOpenApiSpec();
  const pathObj = spec.paths[path];
  if (!pathObj) return null;

  for (const method of SUPPORTED_METHODS) {
    if (method in pathObj) return method;
  }
  return null;
}