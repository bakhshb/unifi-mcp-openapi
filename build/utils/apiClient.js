import axios from "axios";
import { createLogger } from "./logger.js";
const logger = createLogger("AxiosClient");
const BASE_URL = "https://api.ui.com";
function getConfig() {
    const apiKey = process.env["UNIFI_API_KEY"];
    if (!apiKey) {
        throw new Error("Environment variable UNIFI_API_KEY is not defined. " +
            "Obtain an API key from the UniFi Cloud portal and set this variable.");
    }
    return {
        apiKey,
        timeout: parseInt(process.env["UNIFI_TIMEOUT"] ?? "30000", 10),
    };
}
let clientInstance = null;
export function getApiClient() {
    if (clientInstance)
        return clientInstance;
    const cfg = getConfig();
    clientInstance = axios.create({
        baseURL: BASE_URL,
        timeout: cfg.timeout,
        headers: {
            "X-API-Key": cfg.apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    });
    clientInstance.interceptors.request.use((config) => {
        config.metadata = { startTime: Date.now() };
        logger.debug("Making API request", {
            method: config.method?.toUpperCase(),
            url: config.url,
        });
        return config;
    }, (error) => {
        logger.error("Request interceptor error", { error: error.message });
        return Promise.reject(error);
    });
    clientInstance.interceptors.response.use((response) => {
        const metadata = response.config.metadata;
        if (metadata?.startTime) {
            const duration = Date.now() - metadata.startTime;
            logger.info("API request completed", {
                method: response.config.method?.toUpperCase(),
                url: response.config.url,
                status: response.status,
                duration: `${duration}ms`,
            });
        }
        return response;
    }, (error) => {
        if (error.response) {
            logger.error("API error response", {
                status: error.response.status,
                url: error.config?.url,
                method: error.config?.method?.toUpperCase(),
            });
        }
        else if (error.request) {
            logger.error("No response received", { url: error.config?.url });
        }
        else {
            logger.error("Request setup error", { error: error.message });
        }
        return Promise.reject(error);
    });
    return clientInstance;
}
