export const runtime = "nodejs";

import { GoogleAdsApi, Customer } from "google-ads-api";

const REQUIRED_ENV_VARS = [
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_CUSTOMER_ID",
] as const;

function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : undefined;
}

/**
 * Get OAuth2 access token by refreshing the refresh token
 */
async function getAccessToken(): Promise<string> {
  const clientId = readEnv("GOOGLE_ADS_CLIENT_ID");
  const clientSecret = readEnv("GOOGLE_ADS_CLIENT_SECRET");
  const refreshToken = readEnv("GOOGLE_ADS_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing OAuth2 credentials");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create authenticated Google Ads API client
 */
export async function createGoogleAdsClient(options?: {
  customerId?: string;
  loginCustomerId?: string;
}): Promise<{
  customer: Customer;
  customerId: string;
}> {
  const developerToken = readEnv("GOOGLE_ADS_DEVELOPER_TOKEN");
  const customerId = options?.customerId || readEnv("GOOGLE_ADS_CUSTOMER_ID");
  const loginCustomerId = options?.loginCustomerId || readEnv("GOOGLE_ADS_LOGIN_CUSTOMER_ID");

  if (!developerToken) {
    throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN is required");
  }
  if (!customerId) {
    throw new Error("GOOGLE_ADS_CUSTOMER_ID is required");
  }

  const accessToken = await getAccessToken();

  const client = new GoogleAdsApi({
    client_id: readEnv("GOOGLE_ADS_CLIENT_ID")!,
    client_secret: readEnv("GOOGLE_ADS_CLIENT_SECRET")!,
    developer_token: developerToken,
  });

  const customer = client.Customer({
    customer_id: customerId.replace(/-/g, ""),
    refresh_token: readEnv("GOOGLE_ADS_REFRESH_TOKEN")!,
    access_token: accessToken,
    login_customer_id: loginCustomerId?.replace(/-/g, ""),
  } as any);

  return { customer, customerId };
}
