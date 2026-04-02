# UniFi MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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
| `UNIFI_URL` | Yes | - | Your UniFi controller URL (e.g., `https://192.168.1.1` or `https://api.ui.com` for cloud) |
| `UNIFI_API_KEY` | Yes* | - | Your API key (*required if not using username/password) |
| `UNIFI_USERNAME` | Yes* | - | UniFi username (*required if not using API key) |
| `UNIFI_PASSWORD` | Yes* | - | UniFi password (*required if not using API key) |
| `UNIFI_SITE_ID` | No | `default` | Your UniFi site identifier |
| `UNIFI_TIMEOUT` | No | `30000` | Request timeout in milliseconds |

**Note:** Set either `UNIFI_API_KEY` OR (`UNIFI_USERNAME` + `UNIFI_PASSWORD`).

**Note:** For local mode, you can also use session cookies (`UNIFI_SESSION_COOKIE` + `UNIFI_CSRF_TOKEN`) instead of API key, but API key is simpler.

### API Modes Explained

UniFi MCP supports three connection modes, set via `UNIFI_API_TYPE`:

| Mode | When to use | Auth required | Rate limit |
|------|-------------|---------------|------------|
| `local` | Your Dream Machine / UDM Pro SE on the LAN | API key | None |
| `cloud-v1` | Remote management via Ubiquiti cloud (stable) | API key | 10,000 req/min |
| `cloud-ea` | Remote management via Ubiquiti cloud (Early Access) | API key | 100 req/min |

**`local`** — Connect directly to your UniFi controller on the local network. Full access, no external traffic, no rate limits. Requires `UNIFI_LOCAL_HOST`.

**`cloud-v1`** — Stable cloud API hosted at `api.ui.com`. Backward compatible with long-term support. Higher rate limit but core feature set only.

**`cloud-ea`** — Early Access cloud API at `api.ui.com`. Newer features before they land in v1, but lower rate limit and may still evolve. The Site Manager API and some newer endpoints live here first.

**Which to choose?**
- **Home lab / local network** → `local` (your UDM Pro SE)
- **Remote management, production stability** → `cloud-v1`
- **Remote management, want latest features** → `cloud-ea`

## Commands

### `unifi-api`
Execute any UniFi Integration API call. Examples:
- `unifi-api` with `path="/v2/sites"` → list all sites
- `unifi-api` with `path="/v1/sites/{siteId}/devices"` and `pathParams={siteId:"default"}` → get devices
- `unifi-api` with `path="/v1/sites/{siteId}/clients"` and `pathParams={siteId:"default"}` → get clients

### `unifi-api-schema`
Discover available Integration API operations:
- No args → list all tags/operations
- `tag="sites"` → operations for sites
- `path="/v1/sites/{siteId}/devices"` → details for that path

### `unifi-legacy-client-stats`
Get per-client bandwidth statistics from the **legacy controller API** (`/api/s/{site}/stat/sta`). This endpoint is separate from the Integration API and returns real-time tx/rx bytes and rates per client.

**Why a separate tool?** The legacy controller API is not covered by the UniFi OpenAPI spec (beezly/unifi-apis). It exists on the same controller but uses different paths (`/proxy/network/api/s/`) and returns bandwidth data (tx_bytes, rx_bytes, tx_rate, rx_rate) unavailable in the Integration API.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `site` | string | `"default"` | Site name or ID |

**Example response:**
```json
{
  "success": true,
  "message": "Legacy client stats: 2 active clients on site 'default'",
  "data": {
    "count": 2,
    "site": "default",
    "clients": [
      {
        "hostname": "iPhone",
        "ip": "192.168.1.100",
        "mac": "aa:bb:cc:dd:ee:ff",
        "network": "Home",
        "vlan": 1,
        "is_wired": false,
        "tx_bytes": 1234567890,
        "tx_bytes_formatted": "1.15 GB",
        "rx_bytes": 987654321,
        "rx_bytes_formatted": "941.8 MB",
        "tx_rate_bps": 1500,
        "tx_rate_formatted": "1.5 Kbps",
        "rx_rate_bps": 800,
        "rx_rate_formatted": "800 bps",
        "uptime": 3600,
        "uptime_formatted": "1h 0m",
        "signal": -50,
        "essid": "MyWiFi",
        "ap_name": "UDM-Pro"
      },
      {
        "hostname": "laptop",
        "ip": "192.168.1.50",
        "mac": "11:22:33:44:55:66",
        "network": "Home",
        "vlan": 1,
        "is_wired": true,
        "tx_bytes": 50000000,
        "tx_bytes_formatted": "47.7 MB",
        "rx_bytes": 100000000,
        "rx_bytes_formatted": "95.4 MB",
        "tx_rate_bps": 0,
        "tx_rate_formatted": "0 B/s",
        "rx_rate_bps": 0,
        "rx_rate_formatted": "0 B/s",
        "uptime": 7200,
        "uptime_formatted": "2h 0m",
        "ap_name": "Switch"
      }
    ]
  }
}
```

## Troubleshooting

**"API key required"** → Set `UNIFI_API_KEY` in your environment

**"Connection refused"** → Check `UNIFI_LOCAL_HOST` for local mode

**SSL errors** → Set `UNIFI_LOCAL_VERIFY_SSL=false` for local

## Architecture

**Token savings:** Traditional UniFi MCP servers cost ~45,000–60,000 tokens per session. The 2-tool + 1-legacy approach costs ~500–1,500 tokens for the Integration API, plus ~200 tokens for the legacy stats tool — a **~97% reduction**.

| Approach | Tools | Token Cost | Coverage |
|----------|-------|------------|----------|
| [enuno/unifi-mcp-server](https://github.com/enuno/unifi-mcp-server) (explicit) | 148 | ~45,000–60,000 | Fixed |
| [sirkirby/unifi-mcp](https://github.com/sirkirby/unifi-mcp) (multi-product) | ~82 | ~25,000–35,000 | Network + Protect + Access + Drive |
| **This server (2-tool + 1-legacy)** | **3 tools** | **~700–1,700** | **44+ Integration API ops + legacy stats** |

- **3 tools** instead of 148 explicit tools → ~97% less context overhead
- 2 generic tools for Integration API (OpenAPI spec-driven, dynamically scales with API surface)
- 1 legacy tool for bandwidth stats (not in OpenAPI spec, controller-specific)
- Inspired by [@dokploy/mcp](https://www.npmjs.com/package/dokploy-mcp) ([tacticlaunch/dokploy-mcp](https://github.com/tacticlaunch/dokploy-mcp)) — first MCP server to demonstrate the 2-tool OpenAPI pattern, covering 463 Dokploy operations in ~500 tokens
- OpenAPI specs from [beezly/unifi-apis](https://github.com/beezly/unifi-apis) (which traces its API research lineage to [sirkirby/unifi-mcp](https://github.com/sirkirby/unifi-mcp))

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MIT License
