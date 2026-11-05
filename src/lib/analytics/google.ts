import { createSign } from "node:crypto";
import { env } from "../env";

// Google Analytics Data API (GA4), read-only, signed in as a service account.
// https://developers.google.com/analytics/devguides/reporting/data/v1

// The overrides exist only so the page can be previewed against a local stand-in.
const TOKEN_URL = process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token";
const API = process.env.GA_DATA_API_URL || "https://analyticsdata.googleapis.com/v1beta";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export class AnalyticsError extends Error {
  constructor(
    message: string,
    readonly code: "not-configured" | "bad-property" | "bad-key" | "no-access" | "quota" | "unknown-dimension" | "failed",
  ) {
    super(message);
  }
}

type ServiceAccount = { client_email: string; private_key: string };

/** Hosts the Analytics page counts, so other apps and test sites sharing the property are left out. */
export const DEFAULT_HOSTNAMES = ["www.sleekyprogrammers.com", "sleekyprogrammers.com"];

export type AnalyticsConfig = { propertyId: string; account: ServiceAccount; hostnames: string[] };

/** Reads and checks the settings; throws an AnalyticsError that says what to fix. */
export function analyticsConfig(): AnalyticsConfig {
  const { GA4_PROPERTY_ID, GOOGLE_SERVICE_ACCOUNT_JSON, GA4_HOSTNAMES } = env();
  if (!GA4_PROPERTY_ID || !GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new AnalyticsError("Google Analytics isn't connected yet.", "not-configured");
  }
  const propertyId = GA4_PROPERTY_ID.trim();
  if (!/^\d+$/.test(propertyId)) {
    throw new AnalyticsError(
      propertyId.toUpperCase().startsWith("G-")
        ? `GA4_PROPERTY_ID is set to the measurement ID (${propertyId}). Use the numeric Property ID from Google Analytics → Admin → Property details.`
        : "GA4_PROPERTY_ID must be the numeric Property ID from Google Analytics → Admin → Property details.",
      "bad-property",
    );
  }
  const hostnames = (GA4_HOSTNAMES ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  return { propertyId, account: parseServiceAccount(GOOGLE_SERVICE_ACCOUNT_JSON), hostnames: hostnames.length ? hostnames : DEFAULT_HOSTNAMES };
}

/** Accepts the key file's JSON as is, or base64-encoded (easier to paste into some dashboards). */
export function parseServiceAccount(raw: string): ServiceAccount {
  const text = raw.trim().startsWith("{") ? raw.trim() : Buffer.from(raw.trim(), "base64").toString("utf8");
  let parsed: Partial<ServiceAccount>;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AnalyticsError("GOOGLE_SERVICE_ACCOUNT_JSON isn't valid JSON. Paste the whole downloaded key file.", "bad-key");
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new AnalyticsError("GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key. Paste the whole downloaded key file.", "bad-key");
  }
  // Keys pasted as one line keep their line breaks as "\n".
  return { client_email: parsed.client_email, private_key: parsed.private_key.replace(/\\n/g, "\n") };
}

const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

let cachedToken: { value: string; email: string; expiresAt: number } | undefined;

async function accessToken(account: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.email === account.client_email && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(
    JSON.stringify({ iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  )}`;
  let signature: string;
  try {
    signature = createSign("RSA-SHA256").update(unsigned).sign(account.private_key, "base64url");
  } catch {
    throw new AnalyticsError("The service account's private key couldn't be read. Paste the whole downloaded key file.", "bad-key");
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
  });
  const data = (await response.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !data.access_token) {
    throw new AnalyticsError(`Google sign-in failed: ${data.error_description ?? response.status}. Check the service account key.`, "bad-key");
  }
  cachedToken = { value: data.access_token, email: account.client_email, expiresAt: Date.now() + ((data.expires_in ?? 3600) - 120) * 1000 };
  return cachedToken.value;
}

// ---------- Reports ----------

export type ReportRequest = {
  dateRanges?: { startDate: string; endDate: string }[];
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  dimensionFilter?: unknown;
  orderBys?: unknown[];
  limit?: number;
};

export type ReportRow = { dimensions: string[]; metrics: number[] };
export type Report = { dimensionHeaders: string[]; metricHeaders: string[]; rows: ReportRow[] };

type RawReport = {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string }[];
  rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[];
};

/** Turns the API's string values into numbers. */
export function toReport(raw: RawReport): Report {
  return {
    dimensionHeaders: (raw.dimensionHeaders ?? []).map((header) => header.name),
    metricHeaders: (raw.metricHeaders ?? []).map((header) => header.name),
    rows: (raw.rows ?? []).map((row) => ({
      dimensions: (row.dimensionValues ?? []).map((value) => value.value),
      metrics: (row.metricValues ?? []).map((value) => Number(value.value) || 0),
    })),
  };
}

async function call(config: AnalyticsConfig, method: "runReport" | "runRealtimeReport", body: ReportRequest): Promise<Report> {
  const token = await accessToken(config.account);
  const response = await fetch(`${API}/properties/${config.propertyId}:${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message: string = data?.error?.message ?? `HTTP ${response.status}`;
    if (response.status === 403) {
      throw new AnalyticsError(
        `The service account ${config.account.client_email} can't read this property. In Google Analytics → Admin → Property access management, add it as a Viewer.`,
        "no-access",
      );
    }
    if (response.status === 429) throw new AnalyticsError("Google Analytics' hourly limit was reached. Try again in a little while.", "quota");
    if (/customEvent:/.test(message) && /not a valid dimension|did not match|is not valid/i.test(message)) {
      throw new AnalyticsError(message, "unknown-dimension");
    }
    if (response.status === 404 || /property/i.test(message)) throw new AnalyticsError(`Google Analytics: ${message}`, "bad-property");
    throw new AnalyticsError(`Google Analytics: ${message}`, "failed");
  }
  return toReport(data as RawReport);
}

export const runReport = (config: AnalyticsConfig, body: ReportRequest) => call(config, "runReport", body);
export const runRealtimeReport = (config: AnalyticsConfig, body: ReportRequest) => call(config, "runRealtimeReport", body);
