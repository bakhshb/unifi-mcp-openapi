import { describe, it, expect } from "vitest";
import {
  SUPPORTED_METHODS,
  HTTP_STATUS_CODES,
  DEFAULT_TIMEOUT,
  type HttpMethod,
} from "./constants.js";

describe("constants.ts", () => {
  it("should export SUPPORTED_METHODS with all HTTP methods", () => {
    expect(SUPPORTED_METHODS).toEqual(["get", "post", "put", "delete", "patch"]);
  });

  it("should export HTTP_STATUS_CODES with correct values", () => {
    expect(HTTP_STATUS_CODES.OK).toBe(200);
    expect(HTTP_STATUS_CODES.CREATED).toBe(201);
    expect(HTTP_STATUS_CODES.BAD_REQUEST).toBe(400);
    expect(HTTP_STATUS_CODES.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS_CODES.FORBIDDEN).toBe(403);
    expect(HTTP_STATUS_CODES.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS_CODES.TOO_MANY_REQUESTS).toBe(429);
    expect(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).toBe(500);
  });

  it("should export DEFAULT_TIMEOUT as 30000", () => {
    expect(DEFAULT_TIMEOUT).toBe(30000);
  });

  it("should have correct HttpMethod type", () => {
    const validMethods: HttpMethod[] = ["get", "post", "put", "delete", "patch"];
    expect(validMethods).toHaveLength(5);
  });
});