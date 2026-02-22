/**
 * Template Registry Client
 *
 * Fetches and caches the template registry from GitHub.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

/** Default registry URL (jsDelivr CDN — mirrors GitHub, more reliable than raw.githubusercontent.com) */
export const DEFAULT_REGISTRY_URL =
  'https://cdn.jsdelivr.net/gh/codellyson/framely@main/framely-templates/registry.json';

/** Fallback registry URL (GitHub raw — used if jsDelivr is down) */
const FALLBACK_REGISTRY_URL =
  'https://raw.githubusercontent.com/codellyson/framely/main/framely-templates/registry.json';

/** CDN mirrors for template file fetching (tried in order) */
const CDN_BASE_URLS = [
  'https://cdn.jsdelivr.net/gh/codellyson/framely@main/framely-templates/templates',
  'https://raw.githubusercontent.com/codellyson/framely/main/framely-templates/templates',
];

/** Cache TTL: 1 hour */
const CACHE_TTL_MS = 60 * 60 * 1000;

/** Cache directory */
const CACHE_DIR = path.join(os.homedir(), '.framely');

/** Cache file path */
const CACHE_FILE = path.join(CACHE_DIR, 'registry-cache.json');

/**
 * Read the cached registry if it exists and is fresh.
 *
 * @returns {{ templates: Array, baseUrl: string, fetchedAt: number } | null}
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
 * @param {object} data - Registry data with templates array and baseUrl
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
 * @returns {Promise<{ templates: Array, baseUrl: string }>}
 */
export async function fetchRegistry(registryUrl) {
  const url = registryUrl || DEFAULT_REGISTRY_URL;

  // Check cache freshness
  const cached = readCache();
  if (cached && cached.fetchedAt && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { templates: cached.templates, baseUrl: cached.baseUrl || '' };
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
      return { templates: data.templates, baseUrl: data.baseUrl || '' };
    } catch {
      if (cached && Array.isArray(cached.templates)) {
        return { templates: cached.templates, baseUrl: cached.baseUrl || '' };
      }
      return { templates: [], baseUrl: '' };
    }
  }

  // Fetch from remote with fallback
  const urls = [url];
  if (url !== FALLBACK_REGISTRY_URL) {
    urls.push(FALLBACK_REGISTRY_URL);
  }

  for (const fetchUrl of urls) {
    try {
      const response = await fetch(fetchUrl, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Registry fetch failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.templates)) {
        throw new Error('Invalid registry format');
      }

      writeCache(data);
      return { templates: data.templates, baseUrl: data.baseUrl || '' };
    } catch {
      // Try next URL
    }
  }

  // All URLs failed — fallback to stale cache if available
  if (cached && Array.isArray(cached.templates)) {
    return { templates: cached.templates, baseUrl: cached.baseUrl || '' };
  }

  // No cache, no network — return empty
  return { templates: [], baseUrl: '' };
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
 * Fetch a single file from the template registry.
 * Supports both remote URLs and local filesystem paths.
 *
 * @param {string} baseUrl - Registry base URL or local directory path
 * @param {string} registryDir - Template directory name
 * @param {string} filePath - Relative file path within the template
 * @returns {Promise<string>} File contents as text
 */
export async function fetchTemplateFile(baseUrl, registryDir, filePath) {
  const fullPath = `${baseUrl}/${registryDir}/${filePath}`;

  // Support local paths
  const localPath = fullPath.startsWith('file://')
    ? fullPath.replace('file://', '')
    : fullPath.startsWith('/') && !fullPath.startsWith('//') ? fullPath : null;

  if (localPath) {
    return fs.readFileSync(localPath, 'utf-8');
  }

  // Build deduplicated list: CDN mirrors first, then the provided baseUrl
  const suffix = `/${registryDir}/${filePath}`;
  const urls = [];
  const seen = new Set();

  for (const cdn of CDN_BASE_URLS) {
    const url = cdn + suffix;
    if (!seen.has(url)) { seen.add(url); urls.push(url); }
  }
  if (!seen.has(fullPath)) { urls.push(fullPath); }

  let lastError;
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${filePath}: ${response.status}`);
      }
      return await response.text();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
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
