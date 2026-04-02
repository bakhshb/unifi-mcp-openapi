import { describe, it, expect } from "vitest";
import { buildUrl } from "./httpUtils.js";

describe("httpUtils.ts", () => {
  describe("buildUrl", () => {
    it("should return template as-is when no params provided", () => {
      expect(buildUrl("/v1/sites")).toBe("/v1/sites");
    });

    it("should substitute path parameters", () => {
      const result = buildUrl("/v1/sites/{siteId}/devices", { siteId: "abc123" });
      expect(result).toBe("/v1/sites/abc123/devices");
    });

    it("should substitute multiple path parameters", () => {
      const result = buildUrl(
        "/v1/sites/{siteId}/clients/{clientId}",
        { siteId: "site1", clientId: "client2" }
      );
      expect(result).toBe("/v1/sites/site1/clients/client2");
    });

    it("should throw error for missing path parameter", () => {
      expect(() => buildUrl("/v1/sites/{siteId}/devices", {})).toThrow(
        "Missing path parameter: siteId"
      );
    });

    it("should throw error for null path parameter", () => {
      expect(() => buildUrl("/v1/sites/{siteId}/devices", { siteId: null })).toThrow(
        "Missing path parameter: siteId"
      );
    });

    it("should convert non-string values to string", () => {
      const result = buildUrl("/v1/devices/{id}", { id: 123 });
      expect(result).toBe("/v1/devices/123");
    });
  });
});