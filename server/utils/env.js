import { existsSync } from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = join(__dirname, '..');
const PROJECT_ROOT = join(SERVER_ROOT, '..');
const ROOT_ENV_PATH = join(PROJECT_ROOT, '.env');
const SERVER_ENV_PATH = join(SERVER_ROOT, '.env');

let loadedEnvPath = null;

function stripWrappingQuotes(value) {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function normalizeSecret(value) {
  if (!value) return null;
  const normalized = stripWrappingQuotes(value.trim());
  return normalized || null;
}

export function loadEnvironment() {
  if (existsSync(ROOT_ENV_PATH)) {
    dotenv.config({ path: ROOT_ENV_PATH });
    loadedEnvPath = ROOT_ENV_PATH;

    if (existsSync(SERVER_ENV_PATH)) {
      console.warn(
        `Found ${SERVER_ENV_PATH}, but the server is using ${ROOT_ENV_PATH}.`
      );
    }
  } else if (existsSync(SERVER_ENV_PATH)) {
    dotenv.config({ path: SERVER_ENV_PATH });
    loadedEnvPath = SERVER_ENV_PATH;
    console.warn(
      `Loaded legacy env file at ${SERVER_ENV_PATH}. Move it to ${ROOT_ENV_PATH} to match the current setup.`
    );
  }

  const hubSpotToken = normalizeSecret(process.env.HUBSPOT_ACCESS_TOKEN);
  if (hubSpotToken) {
    process.env.HUBSPOT_ACCESS_TOKEN = hubSpotToken;
  }

  return loadedEnvPath;
}

export function getLoadedEnvPath() {
  return loadedEnvPath;
}

export function getHubSpotAccessToken() {
  return normalizeSecret(process.env.HUBSPOT_ACCESS_TOKEN);
}

export function getTokenFingerprint(token = getHubSpotAccessToken()) {
  if (!token) return 'missing';
  if (token.length <= 12) return token;
  return `${token.slice(0, 8)}...${token.slice(-4)}`;
}
