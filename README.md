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

If running a **local UniFi controller** (UniFi Dream Machine, etc):

```bash
UNIFI_API_TYPE=local
UNIFI_LOCAL_HOST=192.168.1.1
UNIFI_LOCAL_VERIFY_SSL=false
```

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

- **2 tools** instead of 82-148 → ~95% less context overhead
- Powered by [beezly/unifi-apis](https://github.com/beezly/unifi-apis) OpenAPI specs
- Inspired by [limehawk/dokploy-mcp](https://github.com/limehawk/dokploy-mcp)

## License

MIT
