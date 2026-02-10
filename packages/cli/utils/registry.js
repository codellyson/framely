/**
 * Template Registry Client
 *
 * Fetches and caches the template registry from GitHub.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

/** Default registry URL (GitHub raw) */
export const DEFAULT_REGISTRY_URL =
  'https://raw.githubusercontent.com/codellyson/framely-templates/main/registry.json';

/** Cache TTL: 1 hour */
const CACHE_TTL_MS = 60 * 60 * 1000;

/** Cache directory */
const CACHE_DIR = path.join(os.homedir(), '.framely');

/** Cache file path */
const CACHE_FILE = path.join(CACHE_DIR, 'registry-cache.json');

/**
 * Read the cached registry if it exists and is fresh.
 *
 * @returns {{ templates: Array, fetchedAt: number } | null}
 */
function readCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cached = JSON.parse(raw);
    if (!cached || !Array.isArray(cached.templates)) return null;
    return cached;
  } catch {
    return null;
  }
}

/**
 * Write registry data to the cache.
 *
 * @param {object} data - Registry data with templates array
 */
function writeCache(data) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ ...data, fetchedAt: Date.now() }),
      'utf-8'
    );
  } catch {
    // Cache write failure is non-fatal
  }
}

/**
 * Fetch the template registry from GitHub (or a local file).
 *
 * Uses a local cache with 1-hour TTL. Falls back to stale cache when offline.
 * Supports file:// URLs and absolute paths for local development.
 *
 * @param {string} [registryUrl] - Custom registry URL (defaults to GitHub)
 * @returns {Promise<Array>} Array of registry template objects
 */
export async function fetchRegistry(registryUrl) {
  const url = registryUrl || DEFAULT_REGISTRY_URL;

  // Check cache freshness
  const cached = readCache();
  if (cached && cached.fetchedAt && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.templates;
  }

  // Support local file paths (file:// URLs or absolute paths)
  const localPath = url.startsWith('file://')
    ? url.replace('file://', '')
    : url.startsWith('/') && !url.startsWith('//') ? url : null;

  if (localPath) {
    try {
      const raw = fs.readFileSync(localPath, 'utf-8');
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.templates)) {
        throw new Error('Invalid registry format');
      }
      writeCache(data);
      return data.templates;
    } catch {
      if (cached && Array.isArray(cached.templates)) return cached.templates;
      return [];
    }
  }

  // Fetch from remote
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Registry fetch failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !Array.isArray(data.templates)) {
      throw new Error('Invalid registry format');
    }

    writeCache(data);
    return data.templates;
  } catch (err) {
    // Fallback to stale cache if available
    if (cached && Array.isArray(cached.templates)) {
      return cached.templates;
    }

    // No cache, no network — return empty
    return [];
  }
}

/**
 * Get the registry URL from framely.config.js or use the default.
 *
 * @param {string} projectDir - Project directory
 * @returns {string} Registry URL
 */
export function getRegistryUrl(projectDir) {
  try {
    const configPath = path.join(projectDir, 'framely.config.js');
    if (fs.existsSync(configPath)) {
      // Dynamic import would be ideal but we keep it simple
      // Users can set registry.url in their config
      const raw = fs.readFileSync(configPath, 'utf-8');
      const match = raw.match(/registry\s*:\s*\{\s*url\s*:\s*['"]([^'"]+)['"]/);
      if (match) return match[1];
    }
  } catch {
    // Config read failure is non-fatal
  }
  return DEFAULT_REGISTRY_URL;
}

/**
 * Clear the registry cache.
 */
export function clearRegistryCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
  } catch {
    // Non-fatal
  }
}
