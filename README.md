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

**Token savings:** Traditional UniFi MCP servers cost ~45,000–60,000 tokens per session. This 2-tool OpenAPI approach costs ~500–1,500 tokens — a **~97% reduction**.

| Approach | Tools | Token Cost | Coverage |
|----------|-------|------------|----------|
| [enuno/unifi-mcp-server](https://github.com/enuno/unifi-mcp-server) (explicit) | 148 | ~45,000–60,000 | Fixed |
| [sirkirby/unifi-mcp](https://github.com/sirkirby/unifi-mcp) (multi-product) | ~82 | ~25,000–35,000 | Network + Protect + Access + Drive |
| **This server (2-tool OpenAPI)** | **2 generic** | **~500–1,500** | **All 44+ Network API operations** |

- **2 tools** instead of 148 explicit tools → ~97% less context overhead
- Inspired by [@dokploy/mcp](https://www.npmjs.com/package/dokploy-mcp) ([tacticlaunch/dokploy-mcp](https://github.com/tacticlaunch/dokploy-mcp)) — first MCP server to demonstrate the 2-tool OpenAPI pattern, covering 463 Dokploy operations in ~500 tokens
- OpenAPI specs from [beezly/unifi-apis](https://github.com/beezly/unifi-apis) (which traces its API research lineage to [sirkirby/unifi-mcp](https://github.com/sirkirby/unifi-mcp))

## License

MIT
