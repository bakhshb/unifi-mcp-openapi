export type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

export const SUPPORTED_METHODS: HttpMethod[] = ["get", "post", "put", "delete", "patch"];

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const DEFAULT_TIMEOUT = 30000;