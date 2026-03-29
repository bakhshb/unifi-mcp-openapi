import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { createLogger } from "./logger.js";

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

const logger = createLogger("AxiosClient");

const BASE_URL = "https://api.ui.com";

function getConfig() {
  const apiKey = process.env["UNIFI_API_KEY"];

  if (!apiKey) {
    throw new Error(
      "Environment variable UNIFI_API_KEY is not defined. " +
        "Obtain an API key from the UniFi Cloud portal and set this variable."
    );
  }

  return {
    apiKey,
    timeout: parseInt(process.env["UNIFI_TIMEOUT"] ?? "30000", 10),
  };
}

let clientInstance: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
  if (clientInstance) return clientInstance;

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

  clientInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      (config as ExtendedAxiosRequestConfig).metadata = { startTime: Date.now() };
      logger.debug("Making API request", {
        method: config.method?.toUpperCase(),
        url: config.url,
      });
      return config;
    },
    (error: AxiosError) => {
      logger.error("Request interceptor error", { error: error.message });
      return Promise.reject(error);
    }
  );

  clientInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      const metadata = (response.config as ExtendedAxiosRequestConfig).metadata;
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
    },
    (error: AxiosError) => {
      if (error.response) {
        logger.error("API error response", {
          status: error.response.status,
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
        });
      } else if (error.request) {
        logger.error("No response received", { url: error.config?.url });
      } else {
        logger.error("Request setup error", { error: error.message });
      }
      return Promise.reject(error);
    }
  );

  return clientInstance;
}
