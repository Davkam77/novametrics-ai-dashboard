import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_ALLOWED_MODELS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
] as const;

let cachedLocalEnv: Record<string, string> | null = null;

function readLocalEnv() {
  if (cachedLocalEnv) {
    return cachedLocalEnv;
  }

  let currentDir = process.cwd();
  let filePath: string | null = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = resolve(currentDir, ".env.local");

    if (existsSync(candidate)) {
      filePath = candidate;
      break;
    }

    const parentDir = resolve(currentDir, "..");
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  const entries: Record<string, string> = {};

  if (filePath) {
    const contents = readFileSync(filePath, "utf8");

    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (key) {
        entries[key] = value;
      }
    }
  }

  cachedLocalEnv = entries;
  return entries;
}

function readValue(name: string): string | null {
  const value = process.env[name]?.trim() ?? readLocalEnv()[name]?.trim();
  return value ? value : null;
}

function readValueWithFallback(
  primaryName: string,
  fallbackName?: string,
): string | null {
  return readValue(primaryName) ?? (fallbackName ? readValue(fallbackName) : null);
}

function requireValue(name: string, fallbackName?: string): string {
  const value = readValueWithFallback(name, fallbackName);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readInteger(
  name: string,
  fallbackName: string | undefined,
  defaultValue: number,
): number {
  const raw = readValueWithFallback(name, fallbackName);

  if (!raw) {
    return defaultValue;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function readCsvList(
  name: string,
  fallbackName: string | undefined,
  defaultValue: readonly string[],
): string[] {
  const raw = readValueWithFallback(name, fallbackName);

  if (!raw) {
    return [...defaultValue];
  }

  const values = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return values.length > 0 ? values : [...defaultValue];
}

const allowedModels = readCsvList("NVM_ALLOWED_MODELS", undefined, DEFAULT_ALLOWED_MODELS);
const defaultModel = readValue("NVM_DEFAULT_MODEL") ?? allowedModels[0] ?? DEFAULT_ALLOWED_MODELS[0];

if (!allowedModels.includes(defaultModel)) {
  allowedModels.unshift(defaultModel);
}

export const env = {
  supabaseUrl: requireValue("SUPABASE_URL", "VITE_SUPABASE_URL"),
  supabasePublishableKey: requireValue(
    "SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
  ),
  supabaseServiceRoleKey: requireValue("SUPABASE_SERVICE_ROLE_KEY"),
  groqApiKey: requireValue("GROQ_API_KEY"),
  keyPepper: requireValue("NVM_KEY_PEPPER"),
  groqBaseUrl: "https://api.groq.com/openai/v1",
  defaultModel,
  allowedModels,
  requestTimeoutMs: readInteger("NVM_REQUEST_TIMEOUT_MS", undefined, 45_000),
  maxActiveKeys: readInteger("NVM_MAX_ACTIVE_KEYS", undefined, 5),
  rateLimitRpm: readInteger("NVM_RATE_LIMIT_RPM", undefined, 30),
  dailyRequestLimit: readInteger("NVM_DAILY_REQUEST_LIMIT", undefined, 200),
  monthlyTokenLimit: readInteger("NVM_MONTHLY_TOKEN_LIMIT", undefined, 1_000_000),
  maxBodyBytes: readInteger("NVM_MAX_BODY_BYTES", undefined, 32_768),
  maxMessages: readInteger("NVM_MAX_MESSAGES", undefined, 32),
  maxCompletionTokens: readInteger("NVM_MAX_COMPLETION_TOKENS", undefined, 2_048),
  concurrentRequests: 2,
  apiKeyPrefix: "nvm_live_",
  apiKeySecretBytes: 32,
  apiKeyPrefixLength: 12,
  apiKeyLastFourLength: 4,
  apiKeyHashVersion: 1,
} as const;

export function isModelAllowed(model: string) {
  return env.allowedModels.includes(model);
}

export function getMessageContentLimit() {
  return Math.max(256, Math.floor(env.maxBodyBytes / Math.max(1, env.maxMessages)));
}
