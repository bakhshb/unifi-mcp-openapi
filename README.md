# unifi-mcp-openapi

MCP server for the UniFi Network Cloud API (api.ui.com), providing 2 tools backed by the OpenAPI spec.

## Tools

### `unifi-api`
Execute any UniFi Cloud API operation. Specify the spec path, optional path params, query params, or JSON body. HTTP method is auto-detected from the spec.

### `unifi-api-schema`
Discover available API operations and their parameters. Call with no args for a tag overview, with `tag` to list operations in that tag, or with `path` for full parameter and request body details.

## Setup

### 1. Prerequisites

- Node.js 18+
- UniFi Cloud API key (from the UniFi Site Manager / Cloud portal)

### 2. Build

```bash
npm install && npm run build
```

### 3. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `UNIFI_API_KEY` | **Yes** | — | Your UniFi Cloud API key |
| `UNIFI_API_TYPE` | No | `cloud-ea` | API type: `cloud-ea` or `cloud-v1` |
| `UNIFI_TIMEOUT` | No | `30000` | Request timeout in milliseconds |

### 4. API Type Mapping

The OpenAPI spec uses paths like `/v1/sites/{siteId}/devices`. These are mapped to the Cloud API URL based on `UNIFI_API_TYPE`:

| Type | Spec path | Cloud API path |
|------|-----------|---------------|
| `cloud-ea` (default) | `/v1/sites/{siteId}/devices` | `/integration/v1/sites/{siteId}/devices` |
| `cloud-v1` | `/v1/sites/{siteId}/devices` | `/v1/sites/{siteId}/devices` |

All requests go to `https://api.ui.com`.

### 5. MCP Client Configuration

#### Claude Desktop (claude_desktop_config.json)

```json
{
  "mcpServers": {
    "unifi": {
      "command": "node",
      "args": ["/path/to/unifi-mcp-openapi/build/index.js"],
      "env": {
        "UNIFI_API_KEY": "your-api-key-here",
        "UNIFI_API_TYPE": "cloud-ea"
      }
    }
  }
}
```

#### OpenClaw / Claude Code

```json
{
  "mcpServers": {
    "unifi": {
      "command": "node",
      "args": ["build/index.js"],
      "env": {
        "UNIFI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Usage Examples

### List all sites
```
Tool: unifi-api
path: /v1/sites
```

### List devices for a site
```
Tool: unifi-api
path: /v1/sites/{siteId}/devices
pathParams: { "siteId": "your-site-id" }
```

### List clients with filter
```
Tool: unifi-api
path: /v1/sites/{siteId}/clients
pathParams: { "siteId": "your-site-id" }
params: { "type": "WIRED" }
```

### Discover available operations
```
Tool: unifi-api-schema
(no args — shows tag summary)
```

```
Tool: unifi-api-schema
tag: UniFi Devices
```

```
Tool: unifi-api-schema
path: /v1/sites/{siteId}/devices/{deviceId}
```

## API Coverage

The spec covers 44 paths across these areas:

- **Sites** — list and manage sites
- **UniFi Devices** — list, provision, adopt, manage devices and statistics
- **Clients** — list clients and perform client actions
- **Networks** — create/read/update/delete networks
- **WiFi Broadcasts** — manage SSIDs
- **Hotspot** — manage vouchers
- **Firewall** — zones, policies, ordering
- **Access Control (ACL Rules)** — create/read/update/delete ACL rules
- **Switching** — switch stacks, MC-LAG domains, LAGs
- **DNS Policies** — DNS policy management
- **Traffic Matching Lists** — DPI traffic classification
- **Supporting Resources** — DPI categories, applications, countries, RADIUS profiles, VPN
