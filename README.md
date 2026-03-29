# UniFi MCP Server

Control your UniFi network via AI. 2-tool design powered by OpenAPI spec — works with **UniFi Cloud API** or **local Dream Machine**.

## What it does

- Query devices, clients, network stats
- Manage WiFi, VLANs, firewall rules
- Create network configurations
- Monitor network health

## Quick Setup (5 minutes)

### 1. Get your UniFi API Key

1. Go to [account.ui.com](https://account.ui.com)
2. Sign in → Settings → API Keys
3. Create new key → copy it

### 2. Run with npx (no install)

```bash
UNIFI_API_TYPE=cloud-ea UNIFI_API_KEY=your-key-here npx @bakhshb/unifi-mcp
```

Or create a `.env` file:

```bash
UNIFI_API_TYPE=cloud-ea
UNIFI_API_KEY=your-key-here
```

Then run:
```bash
npx @bakhshb/unifi-mcp
```

### 3. Connect to Claude/OpenClaw

**OpenClaw** (`~/.openclaw/openclaw.json`):

```json
{
  "mcp": {
    "servers": {
      "unifi": {
        "command": "npx",
        "args": ["@bakhshb/unifi-mcp"],
        "env": {
          "UNIFI_API_TYPE": "cloud-ea",
          "UNIFI_API_KEY": "your-key-here"
        }
      }
    }
  }
}
```

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "unifi": {
      "command": "npx",
      "args": ["@bakhshb/unifi-mcp"],
      "env": {
        "UNIFI_API_TYPE": "cloud-ea",
        "UNIFI_API_KEY": "your-key-here"
      }
    }
  }
}
```

## Local Dream Machine Setup

Your **local UniFi controller** (Dream Machine, etc.) also supports API keys, just like the cloud API. Generate an API key in your controller settings:

1. Go to your UniFi Controller → Settings → API Keys
2. Create a new key for local access
3. Use the same env vars as cloud, but with `UNIFI_API_TYPE=local`

```bash
UNIFI_API_TYPE=local
UNIFI_API_KEY=your-local-api-key
UNIFI_LOCAL_HOST=192.168.1.1
UNIFI_LOCAL_VERIFY_SSL=false
```

Or in openclaw.json:

```json
{
  "mcp": {
    "servers": {
      "unifi": {
        "command": "npx",
        "args": ["@bakhshb/unifi-mcp"],
        "env": {
          "UNIFI_API_TYPE": "local",
          "UNIFI_API_KEY": "your-local-api-key",
          "UNIFI_LOCAL_HOST": "192.168.1.1",
          "UNIFI_LOCAL_VERIFY_SSL": "false"
        }
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `UNIFI_API_TYPE` | Yes | `local` | `local`, `cloud-v1`, or `cloud-ea` |
| `UNIFI_API_KEY` | Yes | - | Your API key (for both cloud and local) |
| `UNIFI_LOCAL_HOST` | For local | `192.168.100.1` | Your UniFi controller IP |
| `UNIFI_LOCAL_VERIFY_SSL` | No | `true` | Set `false` to skip SSL verification |
| `UNIFI_TIMEOUT` | No | `30000` | Request timeout in milliseconds |

**Note:** For local mode, you can also use session cookies (`UNIFI_SESSION_COOKIE` + `UNIFI_CSRF_TOKEN`) instead of API key, but API key is simpler.

## Commands

### `unifi-api`
Execute any UniFi API call. Examples:
- `unifi-api` with `path="/v2/sites"` → list all sites
- `unifi-api` with `path="/v1/sites/{siteId}/devices"` and `pathParams={siteId:"default"}` → get devices
- `unifi-api` with `path="/v1/sites/{siteId}/clients"` and `pathParams={siteId:"default"}` → get clients

### `unifi-api-schema`
Discover available API operations:
- No args → list all tags/operations
- `tag="sites"` → operations for sites
- `path="/v1/sites/{siteId}/devices"` → details for that path

## Troubleshooting

**"API key required"** → Set `UNIFI_API_KEY` in your environment

**"Connection refused"** → Check `UNIFI_LOCAL_HOST` for local mode

**SSL errors** → Set `UNIFI_LOCAL_VERIFY_SSL=false` for local

## Architecture

- **2 tools** instead of 82-148 explicit tools → ~95% less context overhead
- Inspired by [limehawk/dokploy-mcp](https://github.com/limehawk/dokploy-mcp) 2-tool OpenAPI pattern
- Uses [beezly/unifi-apis](https://github.com/beezly/unifi-apis) OpenAPI specs for UniFi Network API

## License

MIT
