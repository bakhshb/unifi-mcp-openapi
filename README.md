# unifi-mcp-openapi

2-tool OpenAPI-driven MCP server for UniFi Network Controller. Supports **local controller**, **Cloud API v1**, and **Cloud EA** modes.

## Architecture

| | Before (enuno) | After (OpenAPI) |
|---|---|---|
| **Tools** | 82–148 explicit tools | 2 generic tools |
| **Token cost** | ~35,000–50,000 tokens | ~500–1,500 tokens |
| **Token savings** | — | **~95%** |

Inspired by [limehawk/dokploy-mcp](https://github.com/limehawk/dokploy-mcp) 2-tool OpenAPI pattern.

## Tools

### `unifi-api`
Execute any UniFi Network API operation. Specify the spec path, optional path params, query params, or body. HTTP method is auto-detected.

### `unifi-api-schema`
Discover available API operations and their parameters. Call with no args for a tag overview, with `tag` to list operations in that tag, or with `path` for full details.

## Supported API Modes

| Mode | Description | Auth |
|------|-------------|------|
| `local` | UniFi Dream Machine / self-hosted controller | Session cookie |
| `cloud-v1` | UniFi Cloud API v1 | API key |
| `cloud-ea` | UniFi Cloud EA API | API key |

## Setup

### 1. Build

```bash
npm install && npm run build
```

### 2. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `UNIFI_API_TYPE` | No | `local` | `local`, `cloud-v1`, or `cloud-ea` |
| `UNIFI_API_KEY` | For Cloud | — | Your UniFi Cloud API key |
| `UNIFI_LOCAL_HOST` | For local | `192.168.100.1` | Local controller IP |
| `UNIFI_LOCAL_PORT` | For local | `443` | Local controller port |
| `UNIFI_LOCAL_VERIFY_SSL` | No | `false` | Skip SSL verification for local |
| `UNIFI_TIMEOUT` | No | `30000` | Request timeout (ms) |

### 3. MCP Client Configuration

#### Claude Desktop

```json
{
  "mcpServers": {
    "unifi": {
      "command": "node",
      "args": ["/path/to/unifi-mcp-openapi/build/index.js"],
      "env": {
        "UNIFI_API_TYPE": "local"
      }
    }
  }
}
```

#### OpenClaw

Update `openclaw.json` MCP servers section:

```json
{
  "mcp": {
    "servers": {
      "unifi-mcp": {
        "command": "node",
        "args": ["/path/to/unifi-mcp-openapi/build/index.js"],
        "env": {
          "UNIFI_API_TYPE": "local"
        }
      }
    }
  }
}
```

## Path Mapping

The OpenAPI spec uses paths like `/v1/sites/{siteId}/devices`. These are mapped to the actual API based on mode:

| Mode | Spec path | Actual path |
|------|-----------|-------------|
| `local` | `/v1/...` | `/proxy/network/integration/v1/...` |
| `cloud-v1` | `/v1/...` | `/v1/...` |
| `cloud-ea` | `/v1/...` | `/integration/v1/...` |

## Examples

### Discover all available paths

```
unifi-api-schema → returns all tags and paths
```

### List sites

```
unifi-api with path="/v1/sites"
```

### Get device details

```
unifi-api with path="/v1/sites/{siteId}/devices" and pathParams={siteId: "default"}
```

### Get clients

```
unifi-api with path="/v1/sites/{siteId}/clients" and pathParams={siteId: "default"}
```

## Troubleshooting

### Local controller returns 401/403
- Check `UNIFI_SESSION_COOKIE` and `UNIFI_CSRF_TOKEN` are set correctly
- Or use API key auth on Cloud mode instead

### Cloud API returns 401
- Verify `UNIFI_API_KEY` is correct
- Check the key has permissions for the requested endpoints

### SSL errors with local controller
- Set `UNIFI_LOCAL_VERIFY_SSL=false` to skip certificate verification

## License

MIT
