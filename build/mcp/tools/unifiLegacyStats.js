import { z } from "zod";
import { AxiosError } from "axios";
import { getApiClient } from "../../utils/apiClient.js";
import { createLogger } from "../../utils/logger.js";
import { ResponseFormatter } from "../../utils/responseFormatter.js";
const logger = createLogger("UnifiLegacyStats");
/**
 * Schema for the legacy client stats tool.
 * Calls the old UniFi controller API at /proxy/network/api/s/{site}/stat/sta
 */
export const schema = {
    site: z.string().default("default").describe("Site name (e.g. 'default'). Use site ID UUID for other sites."),
};
export const name = "unifi-legacy-client-stats";
export const description = "Get client bandwidth statistics from the legacy UniFi controller API. " +
    "Returns per-client tx_bytes, rx_bytes, tx_rate, rx_rate for all active clients. " +
    "Uses the old controller API endpoint (/proxy/network/api/s/{site}/stat/sta) which is not in the Integration API OpenAPI spec. " +
    "This is the only way to get per-client bandwidth data on UniFi OS devices.";
export const annotations = {
    title: "UniFi Legacy Client Stats",
    readOnlyHint: true,
    openWorldHint: true,
};
export async function handler(input) {
    const site = input.site ?? "default";
    try {
        const url = `/proxy/network/api/s/${site}/stat/sta`;
        logger.info(`Fetching legacy client stats from ${url}`);
        const client = getApiClient();
        const response = await client.get(url);
        // Legacy API returns { meta: { rc: "ok" }, data: [...] }
        // Normalize to match Integration API format
        const rawData = response.data;
        let clients = [];
        if (rawData && typeof rawData === "object" && "data" in rawData) {
            clients = rawData.data;
        }
        else if (Array.isArray(rawData)) {
            clients = rawData;
        }
        // Enrich with human-readable bandwidth
        const enriched = clients.map((c) => ({
            mac: c.mac,
            ip: c.ip,
            hostname: c.hostname || c.name || c.mac,
            network: c.network,
            vlan: c.vlan,
            is_wired: c.is_wired,
            // Bandwidth - bytes
            tx_bytes: c.tx_bytes,
            rx_bytes: c.rx_bytes,
            tx_bytes_formatted: formatBytes(Number(c.tx_bytes) || 0),
            rx_bytes_formatted: formatBytes(Number(c.rx_bytes) || 0),
            // Bandwidth - rates
            tx_rate_bps: c["tx_bytes-r"],
            rx_rate_bps: c["rx_bytes-r"],
            tx_rate_formatted: formatRate(Number(c["tx_bytes-r"]) || 0),
            rx_rate_formatted: formatRate(Number(c["rx_bytes-r"]) || 0),
            // Connection
            signal: c.signal,
            rssi: c.rssi,
            uptime: c.uptime,
            uptime_formatted: formatUptime(Number(c.uptime) || 0),
            // Uplink
            essid: c.essid,
            ap_mac: c.ap_mac,
            ap_name: c.last_uplink_name,
            channel: c.channel,
            radio: c.radio,
            // Satisfaction
            satisfaction: c.satisfaction,
        }));
        return ResponseFormatter.success(`Legacy client stats: ${clients.length} active clients on site '${site}'`, {
            count: clients.length,
            site,
            endpoint: url,
            clients: enriched,
        });
    }
    catch (error) {
        logger.error(`Legacy client stats failed for site '${site}'`, {
            error: error instanceof Error ? error.message : "Unknown error",
        });
        if (error instanceof AxiosError && error.response) {
            const status = error.response.status;
            const data = error.response.data;
            const detail = data?.message ?? error.message;
            if (status === 401) {
                return ResponseFormatter.error("Authentication failed", "Check UNIFI_API_KEY. Legacy API requires API key auth.");
            }
            if (status === 404) {
                return ResponseFormatter.error("Not found", `Site '${site}' not found or legacy API not available.`);
            }
            return ResponseFormatter.error(`HTTP ${status}`, detail);
        }
        return ResponseFormatter.error("Request failed", error instanceof Error ? error.message : "Unknown error");
    }
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatBytes(bytes) {
    if (bytes === 0)
        return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
function formatRate(bytesPerSec) {
    if (bytesPerSec === 0)
        return "0 B/s";
    const bps = bytesPerSec * 8; // convert to bits
    if (bps < 1000)
        return `${bps.toFixed(0)} bps`;
    if (bps < 1e6)
        return `${(bps / 1e3).toFixed(1)} Kbps`;
    if (bps < 1e9)
        return `${(bps / 1e6).toFixed(1)} Mbps`;
    return `${(bps / 1e9).toFixed(2)} Gbps`;
}
function formatUptime(seconds) {
    if (seconds === 0)
        return "0s";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (d > 0)
        parts.push(`${d}d`);
    if (h > 0)
        parts.push(`${h}h`);
    if (m > 0)
        parts.push(`${m}m`);
    if (s > 0 && d === 0)
        parts.push(`${s}s`);
    return parts.join(" ") || "0s";
}
