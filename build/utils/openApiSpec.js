import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createLogger } from "./logger.js";
import { SUPPORTED_METHODS } from "./constants.js";
const logger = createLogger("OpenApiSpec");
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SPEC_PATH = join(__dirname, "../../reference/unifi-api.json");
let cachedSpec = null;
export function getOpenApiSpec() {
    if (cachedSpec)
        return cachedSpec;
    logger.info("Loading OpenAPI spec from local file", { path: SPEC_PATH });
    const content = readFileSync(SPEC_PATH, "utf-8");
    cachedSpec = JSON.parse(content);
    logger.info("OpenAPI spec loaded", {
        paths: Object.keys(cachedSpec.paths).length,
    });
    return cachedSpec;
}
export function detectMethod(path) {
    const spec = getOpenApiSpec();
    const pathObj = spec.paths[path];
    if (!pathObj)
        return null;
    for (const method of SUPPORTED_METHODS) {
        if (method in pathObj)
            return method;
    }
    return null;
}
function resolveRef(spec, ref, depth = 0) {
    if (depth > 8)
        return { note: "Max resolution depth reached" };
    const parts = ref.replace(/^#\//, "").split("/");
    let current = spec;
    for (const part of parts) {
        if (typeof current !== "object" || current === null)
            return {};
        current = current[part];
    }
    if (typeof current !== "object" || current === null)
        return {};
    return resolveSchema(spec, current, depth + 1);
}
export function resolveSchema(spec, schema, depth = 0) {
    if (depth > 8)
        return { note: "Max resolution depth reached" };
    if (typeof schema["$ref"] === "string") {
        return resolveRef(spec, schema["$ref"], depth);
    }
    if (Array.isArray(schema["allOf"])) {
        let merged = {};
        for (const sub of schema["allOf"]) {
            merged = { ...merged, ...resolveSchema(spec, sub, depth + 1) };
        }
        return merged;
    }
    if (Array.isArray(schema["oneOf"]) || Array.isArray(schema["anyOf"])) {
        const variants = (schema["oneOf"] ?? schema["anyOf"]);
        return {
            oneOf: variants.map((v) => resolveSchema(spec, v, depth + 1)),
        };
    }
    if (schema["type"] === "object" && schema["properties"]) {
        const props = schema["properties"];
        const required = new Set(Array.isArray(schema["required"]) ? schema["required"] : []);
        const result = {};
        for (const [propName, propSchema] of Object.entries(props)) {
            const resolved = resolveSchema(spec, propSchema, depth + 1);
            result[propName] = {
                ...resolved,
                required: required.has(propName),
            };
        }
        return { type: "object", properties: result };
    }
    return schema;
}
