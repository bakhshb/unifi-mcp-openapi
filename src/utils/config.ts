export interface UnifiConfig {
  unifiUrl: string;
  apiKey: string | undefined;
  username: string | undefined;
  password: string | undefined;
  siteId: string | undefined;
  timeout: number;
}

export function getUnifiConfig(): UnifiConfig {
  const unifiUrl = process.env["UNIFI_URL"];
  const apiKey = process.env["UNIFI_API_KEY"];
  const username = process.env["UNIFI_USERNAME"];
  const password = process.env["UNIFI_PASSWORD"];
  const siteId = process.env["UNIFI_SITE_ID"];
  const timeout = parseInt(process.env["UNIFI_TIMEOUT"] ?? "30000", 10);

  if (!unifiUrl) {
    throw new Error("Environment variable UNIFI_URL is not defined");
  }

  const hasApiKey = apiKey !== undefined && apiKey !== "";
  const hasCredentials = username !== undefined && password !== undefined;

  if (!hasApiKey && !hasCredentials) {
    throw new Error(
      "Either UNIFI_API_KEY or UNIFI_USERNAME/UNIFI_PASSWORD must be defined"
    );
  }

  return {
    unifiUrl,
    apiKey: hasApiKey ? apiKey : undefined,
    username: hasCredentials ? username : undefined,
    password: hasCredentials ? password : undefined,
    siteId: siteId || "default",
    timeout,
  };
}