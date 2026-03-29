import axios from "axios";
import { createLogger } from "./logger.js";
const logger = createLogger("AxiosClient");
export function getApiType() {
    const raw = process.env["UNIFI_API_TYPE"] ?? "local";
    if (raw === "local" || raw === "cloud-v1" || raw === "cloud-ea")
        return raw;
    return "local";
}
function getBaseUrl(apiType) {
    if (apiType === "local") {
        const host = process.env["UNIFI_LOCAL_HOST"] ?? "192.168.100.1";
        return `https://${host}`;
    }
    return "https://api.ui.com";
}
function getHeaders(apiType) {
    const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };
    if (apiType === "local") {
        const sessionCookie = process.env["UNIFI_SESSION_COOKIE"];
        if (sessionCookie) {
            headers["Cookie"] = sessionCookie;
        }
        const csrfToken = process.env["UNIFI_CSRF_TOKEN"];
        if (csrfToken) {
            headers["X-CSRF-Token"] = csrfToken;
        }
    }
    else {
        const apiKey = process.env["UNIFI_API_KEY"];
        if (!apiKey) {
            throw new Error("UNIFI_API_KEY is required for Cloud API. " +
                "Obtain an API key from the UniFi Cloud portal.");
        }
        headers["X-API-Key"] = apiKey;
    }
    return headers;
}
function getTimeout() {
    return parseInt(process.env["UNIFI_TIMEOUT"] ?? "30000", 10);
}
let clientInstance = null;
let lastApiType = null;
export function getApiClient() {
    const apiType = getApiType();
    if (clientInstance && lastApiType !== apiType) {
        clientInstance = null;
    }
    if (clientInstance)
        return clientInstance;
    const baseURL = getBaseUrl(apiType);
    const headers = getHeaders(apiType);
    const timeout = getTimeout();
    clientInstance = axios.create({
        baseURL,
        timeout,
        headers,
        ...(apiType === "local" && process.env["UNIFI_LOCAL_VERIFY_SSL"] === "false"
            ? { httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false }) }
            : {}),
    });
    clientInstance.interceptors.request.use((config) => {
        config.metadata = { startTime: Date.now() };
        logger.debug("API request", {
            method: config.method?.toUpperCase(),
            url: config.url,
            apiType,
        });
        return config;
    }, (error) => {
        logger.error("Request error", { error: error.message });
        return Promise.reject(error);
    });
    clientInstance.interceptors.response.use((response) => {
        const metadata = response.config.metadata;
        if (metadata?.startTime) {
            const duration = Date.now() - metadata.startTime;
            logger.info("API response", {
                method: response.config.method?.toUpperCase(),
                url: response.config.url,
                status: response.status,
                duration: `${duration}ms`,
                apiType,
            });
        }
        return response;
    }, (error) => {
        logger.error("API error", {
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
        });
        return Promise.reject(error);
    });
    lastApiType = apiType;
    return clientInstance;
}
