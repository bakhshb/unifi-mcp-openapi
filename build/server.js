import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as unifiApi from "./mcp/tools/unifiApi.js";
import * as unifiSchema from "./mcp/tools/unifiSchema.js";
import * as unifiLegacyStats from "./mcp/tools/unifiLegacyStats.js";
export function createServer() {
    const server = new McpServer({
        name: "unifi",
        version: "1.0.0",
    });
    server.tool(unifiApi.name, unifiApi.description, unifiApi.schema, unifiApi.annotations, unifiApi.handler);
    server.tool(unifiSchema.name, unifiSchema.description, unifiSchema.schema, unifiSchema.annotations, unifiSchema.handler);
    server.tool(unifiLegacyStats.name, unifiLegacyStats.description, unifiLegacyStats.schema, unifiLegacyStats.annotations, unifiLegacyStats.handler);
    return server;
}
