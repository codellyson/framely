/**
 * Preview Command
 *
 * Starts the development preview server with hot reloading
 * and a local render API for rendering from the studio UI.
 *
 * Usage:
 *   framely preview
 *   framely preview --port 3001
 *   framely preview --no-open
 */

import http from 'http';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { createBrowser, closeBrowser } from '../utils/browser.js';
import { renderVideo } from '../utils/render.js';
import { getCodecConfig } from '../utils/codecs.js';
import { fetchRegistry, getRegistryUrl } from '../utils/registry.js';
import { discoverInstalledTemplates, mergeWithRegistry, generateVirtualModule } from '../utils/discover.js';
import { detectPackageManager } from './templates.js';
import { createServer as createViteServer } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Parse JSON request body.
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => { chunks.push(chunk); });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Start the render API server.
 *
 * @param {number} apiPort - Port to listen on
 * @param {string} frontendUrl - Frontend URL for loading compositions
 * @param {string} outputsDir - Directory to store rendered files
 * @param {string} publicDir - Public assets directory
 * @param {string} projectDir - User's project directory
 * @param {object} [templateState] - Shared template state for HMR invalidation
 * @returns {http.Server}
 */
export function startRenderApi(apiPort, frontendUrl, outputsDir, publicDir, projectDir, templateState) {
  fs.mkdirSync(outputsDir, { recursive: true });

  const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // POST /api/render — render video
    if (req.method === 'POST' && req.url === '/api/render') {
      handleRender(req, res, frontendUrl, outputsDir);
      return;
    }

    // POST /api/still — render single frame
    if (req.method === 'POST' && req.url === '/api/still') {
      handleStill(req, res, frontendUrl, outputsDir);
      return;
    }

    // GET /api/assets — list project static assets
    if (req.method === 'GET' && req.url === '/api/assets') {
      handleListAssets(req, res, publicDir);
      return;
    }

    // POST /api/templates/install — install a template package
    if (req.method === 'POST' && req.url === '/api/templates/install') {
      handleTemplateInstall(req, res, projectDir, templateState);
      return;
    }

    // POST /api/templates/remove — remove a template package
    if (req.method === 'POST' && req.url === '/api/templates/remove') {
      handleTemplateRemove(req, res, projectDir, templateState);
      return;
    }

    // GET /api/templates/categories — list template categories
    if (req.method === 'GET' && req.url === '/api/templates/categories') {
      handleTemplateCategories(req, res, projectDir);
      return;
    }

    // GET /api/templates/:id — get single template
    if (req.method === 'GET' && req.url.match(/^\/api\/templates\/[^/]+$/)) {
      const id = req.url.replace('/api/templates/', '');
      handleGetTemplate(req, res, id, projectDir);
      return;
    }

    // GET /api/templates — list templates with filters
    if (req.method === 'GET' && req.url.startsWith('/api/templates')) {
      handleListTemplates(req, res, projectDir);
      return;
    }

    // GET /outputs/* — serve rendered files
    if (req.method === 'GET' && req.url.startsWith('/outputs/')) {
      handleOutputFile(req, res, outputsDir);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(apiPort, () => {
    console.log(chalk.gray('  Render API: ') + chalk.green(`http://localhost:${apiPort}`));
  });

  return server;
}

/**
 * Handle POST /api/render.
 * Streams NDJSON progress events.
 */
async function handleRender(req, res, frontendUrl, outputsDir) {
  let body;
  try {
    body = await parseBody(req);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid request body' }));
    return;
  }

  const compositionId = body.compositionId;
  const codec = body.codec || 'h264';
  const codecConfig = getCodecConfig(codec);

  if (!codecConfig) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Unknown codec: ${codec}` }));
    return;
  }

  const crf = body.crf != null ? body.crf : 18;
  const scale = body.scale || 1;
  const width = Math.round((body.width || 1920) * scale);
  const height = Math.round((body.height || 1080) * scale);
  const fps = body.fps || 30;
  const startFrame = body.startFrame || 0;
  const endFrame = body.endFrame != null ? body.endFrame : (body.durationInFrames ? body.durationInFrames - 1 : 299);
  const muted = body.muted || false;

  const ext = codecConfig.extension;
  const filename = `${compositionId}-${Date.now()}.${ext}`;
  const outputPath = path.join(outputsDir, filename);

  // Stream NDJSON progress
  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  function sendEvent(data) {
    res.write(JSON.stringify(data) + '\n');
  }

  sendEvent({ type: 'start', compositionId, codec, frames: endFrame - startFrame + 1 });

  let browser = null;
  const startTime = Date.now();

  try {
    sendEvent({ type: 'status', message: 'Launching browser...' });
    const { browser: b, page } = await createBrowser({ width, height, scale: 1 });
    browser = b;

    sendEvent({ type: 'status', message: 'Loading composition...' });
    const renderUrl = new URL(frontendUrl);
    renderUrl.searchParams.set('renderMode', 'true');
    renderUrl.searchParams.set('composition', compositionId);
    // For templates, pass the original template ID so the renderer can find the component
    if (body.templateId) {
      renderUrl.searchParams.set('templateId', body.templateId);
    }
    // Pass composition dimensions for template rendering
    renderUrl.searchParams.set('width', String(width));
    renderUrl.searchParams.set('height', String(height));
    renderUrl.searchParams.set('fps', String(fps));
    renderUrl.searchParams.set('durationInFrames', String(endFrame - startFrame + 1));
    if (body.inputProps && Object.keys(body.inputProps).length > 0) {
      renderUrl.searchParams.set('props', encodeURIComponent(JSON.stringify(body.inputProps)));
    }

    await page.goto(renderUrl.toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('window.__ready === true', { timeout: 30000 });

    sendEvent({ type: 'status', message: 'Rendering frames...' });

    await renderVideo({
      page,
      outputPath,
      startFrame,
      endFrame,
      width,
      height,
      fps,
      codec,
      crf,
      muted,
      onProgress: (frame, total) => {
        const percent = Math.floor((frame / total) * 100);
        sendEvent({ type: 'progress', frame, total, percent });
      },
    });

    const durationMs = Date.now() - startTime;
    sendEvent({
      type: 'complete',
      outputPath,
      downloadUrl: `/outputs/${filename}`,
      filename,
      durationMs,
    });
  } catch (err) {
    sendEvent({ type: 'error', message: err.message });
  } finally {
    if (browser) {
      await closeBrowser(browser);
    }
    res.end();
  }
}

/**
 * Handle POST /api/still.
 */
async function handleStill(req, res, frontendUrl, outputsDir) {
  let body;
  try {
    body = await parseBody(req);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid request body' }));
    return;
  }

  const compositionId = body.compositionId;
  const frame = body.frame || 0;
  const format = body.format || 'png';
  const quality = body.quality || 80;
  const scale = body.scale || 1;
  const width = Math.round((body.width || 1920) * scale);
  const height = Math.round((body.height || 1080) * scale);

  const ext = format === 'jpeg' ? 'jpg' : format;
  const filename = `${compositionId}-frame${frame}.${ext}`;
  const outputPath = path.join(outputsDir, filename);

  let browser = null;
  try {
    const { browser: b, page } = await createBrowser({ width, height, scale: 1 });
    browser = b;

    const renderUrl = new URL(frontendUrl);
    renderUrl.searchParams.set('renderMode', 'true');
    renderUrl.searchParams.set('composition', compositionId);
    if (body.inputProps && Object.keys(body.inputProps).length > 0) {
      renderUrl.searchParams.set('props', encodeURIComponent(JSON.stringify(body.inputProps)));
    }

    await page.goto(renderUrl.toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction('window.__ready === true', { timeout: 30000 });

    // Set frame and check delayRender in one roundtrip (flushSync commits synchronously)
    const hasPendingDelays = await page.evaluate((f) => {
      window.__setFrame(f);
      const dr = window.__FRAMELY_DELAY_RENDER;
      return !!(dr && dr.pendingCount > 0);
    }, frame);
    if (hasPendingDelays) {
      await page.waitForFunction(() => {
        const dr = window.__FRAMELY_DELAY_RENDER;
        return !dr || dr.pendingCount === 0;
      }, { timeout: 30000 });
    }

    // Capture
    const element = page.locator('#render-container');
    const screenshotOptions = { type: format, path: outputPath };
    if (format === 'jpeg') {
      screenshotOptions.quality = quality;
    }
    await element.screenshot(screenshotOptions);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      outputPath,
      downloadUrl: `/outputs/${filename}`,
      filename,
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  } finally {
    if (browser) {
      await closeBrowser(browser);
    }
  }
}

/**
 * Handle GET /api/assets — list files in the public directory.
 */
function handleListAssets(req, res, publicDir) {
  if (!publicDir || !fs.existsSync(publicDir)) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ assets: [], publicDir: null }));
    return;
  }

  const assets = [];

  function walkDir(dir, prefix) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        walkDir(fullPath, relativePath);
      } else {
        const stat = fs.statSync(fullPath);
        const ext = path.extname(entry.name).toLowerCase();
        assets.push({
          name: entry.name,
          path: relativePath,
          size: stat.size,
          extension: ext,
          type: getAssetType(ext),
        });
      }
    }
  }

  walkDir(publicDir, '');

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ assets, publicDir }));
}

/**
 * Classify file type from extension.
 */
function getAssetType(ext) {
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.bmp', '.ico'];
  const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
  const audioExts = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];
  const fontExts = ['.woff', '.woff2', '.ttf', '.otf', '.eot'];
  const dataExts = ['.json', '.csv', '.xml', '.txt'];

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  if (fontExts.includes(ext)) return 'font';
  if (dataExts.includes(ext)) return 'data';
  return 'other';
}

/**
 * Handle GET /outputs/* — serve rendered files.
 */
function handleOutputFile(req, res, outputsDir) {
  // Decode URL and resolve path
  let filename;
  try {
    filename = decodeURIComponent(req.url.replace('/outputs/', ''));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid URL encoding' }));
    return;
  }

  // Resolve both paths to absolute and verify the file is within outputsDir
  const resolvedOutputs = path.resolve(outputsDir);
  const filePath = path.resolve(outputsDir, filename);

  if (!filePath.startsWith(resolvedOutputs + path.sep) && filePath !== resolvedOutputs) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'File not found' }));
    return;
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.gif': 'image/gif',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
  };

  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Content-Length': stat.size,
    'Content-Disposition': `attachment; filename="${filename}"`,
  });

  fs.createReadStream(filePath).pipe(res);
}

/**
 * Get the merged template list (registry + installed).
 */
async function getMergedTemplates(projectDir) {
  const registryUrl = getRegistryUrl(projectDir);
  const [registry, installed] = await Promise.all([
    fetchRegistry(registryUrl),
    Promise.resolve(discoverInstalledTemplates(projectDir)),
  ]);
  return mergeWithRegistry(installed, registry);
}

/**
 * Handle GET /api/templates — list templates with filters.
 */
async function handleListTemplates(req, res, projectDir) {
  const url = new URL(req.url, `http://localhost`);
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');
  const featured = url.searchParams.get('featured');
  const sortBy = url.searchParams.get('sortBy') || 'newest';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '12', 10);

  try {
    let filtered = await getMergedTemplates(projectDir);

    // Filter by category
    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Filter by featured
    if (featured === 'true') {
      filtered = filtered.filter(t => t.featured);
    }

    // Sort
    if (sortBy === 'popular') {
      filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // newest
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    // Paginate
    const start = (page - 1) * pageSize;
    const templates = filtered.slice(start, start + pageSize);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      templates,
      total: filtered.length,
      page,
      pageSize,
      hasMore: start + pageSize < filtered.length,
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * Handle GET /api/templates/:id — get single template.
 */
async function handleGetTemplate(req, res, id, projectDir) {
  try {
    const templates = await getMergedTemplates(projectDir);
    const template = templates.find(t => t.id === id);
    if (!template) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Template not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(template));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * Handle GET /api/templates/categories — list categories with counts.
 */
async function handleTemplateCategories(req, res, projectDir) {
  try {
    const templates = await getMergedTemplates(projectDir);
    const counts = {};
    templates.forEach(t => {
      if (t.category) {
        counts[t.category] = (counts[t.category] || 0) + 1;
      }
    });
    const categories = Object.entries(counts).map(([category, count]) => ({ category, count }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(categories));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * Handle POST /api/templates/install — install a template package.
 * Streams NDJSON progress events.
 */
async function handleTemplateInstall(req, res, projectDir, templateState) {
  let body;
  try {
    body = await parseBody(req);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid request body' }));
    return;
  }

  const packageName = body.package;
  if (!packageName) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing "package" field' }));
    return;
  }

  const pm = detectPackageManager(projectDir);
  const installCmd = pm === 'yarn' ? 'add' : 'install';

  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  function sendEvent(data) {
    res.write(JSON.stringify(data) + '\n');
  }

  sendEvent({ type: 'start', package: packageName, pm });

  const proc = spawn(pm, [installCmd, packageName], { cwd: projectDir, stdio: ['ignore', 'pipe', 'pipe'] });

  proc.stdout.on('data', (chunk) => {
    sendEvent({ type: 'log', stream: 'stdout', text: chunk.toString() });
  });

  proc.stderr.on('data', (chunk) => {
    sendEvent({ type: 'log', stream: 'stderr', text: chunk.toString() });
  });

  proc.on('close', (code) => {
    if (code === 0) {
      // Re-discover templates and invalidate virtual module
      if (templateState && templateState.invalidate) {
        templateState.installed = discoverInstalledTemplates(projectDir);
        templateState.invalidate();
      }
      sendEvent({ type: 'complete', package: packageName });
    } else {
      sendEvent({ type: 'error', message: `${pm} ${installCmd} ${packageName} exited with code ${code}` });
    }
    res.end();
  });

  proc.on('error', (err) => {
    sendEvent({ type: 'error', message: err.message });
    res.end();
  });
}

/**
 * Handle POST /api/templates/remove — remove a template package.
 * Streams NDJSON progress events.
 */
async function handleTemplateRemove(req, res, projectDir, templateState) {
  let body;
  try {
    body = await parseBody(req);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid request body' }));
    return;
  }

  const packageName = body.package;
  if (!packageName) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing "package" field' }));
    return;
  }

  const pm = detectPackageManager(projectDir);
  const removeCmd = pm === 'yarn' ? 'remove' : 'uninstall';

  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  function sendEvent(data) {
    res.write(JSON.stringify(data) + '\n');
  }

  sendEvent({ type: 'start', package: packageName, pm });

  const proc = spawn(pm, [removeCmd, packageName], { cwd: projectDir, stdio: ['ignore', 'pipe', 'pipe'] });

  proc.stdout.on('data', (chunk) => {
    sendEvent({ type: 'log', stream: 'stdout', text: chunk.toString() });
  });

  proc.stderr.on('data', (chunk) => {
    sendEvent({ type: 'log', stream: 'stderr', text: chunk.toString() });
  });

  proc.on('close', (code) => {
    if (code === 0) {
      if (templateState && templateState.invalidate) {
        templateState.installed = discoverInstalledTemplates(projectDir);
        templateState.invalidate();
      }
      sendEvent({ type: 'complete', package: packageName });
    } else {
      sendEvent({ type: 'error', message: `${pm} ${removeCmd} ${packageName} exited with code ${code}` });
    }
    res.end();
  });

  proc.on('error', (err) => {
    sendEvent({ type: 'error', message: err.message });
    res.end();
  });
}

/**
 * Find the user's entry file in their project.
 */
function findUserEntry(projectDir) {
  const candidates = [
    'src/index.jsx',
    'src/index.tsx',
    'src/index.js',
    'src/index.ts',
  ];
  for (const candidate of candidates) {
    const fullPath = path.resolve(projectDir, candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

/**
 * Vite plugin that provides the studio UI via a virtual entry module.
 * Combines the user's entry file (which calls registerRoot()) with
 * the studio UI bootstrap code.
 */
function framelyStudioPlugin(userEntryPath, studioDir, templateState) {
  const VIRTUAL_ENTRY_ID = 'virtual:framely-entry';
  const RESOLVED_VIRTUAL_ENTRY_ID = '\0' + VIRTUAL_ENTRY_ID;

  const VIRTUAL_TEMPLATES_ID = 'virtual:framely-templates';
  const RESOLVED_VIRTUAL_TEMPLATES_ID = '\0' + VIRTUAL_TEMPLATES_ID;

  return {
    name: 'framely-studio',

    configureServer(server) {
      // Set up HMR invalidation for the virtual templates module
      if (templateState) {
        templateState.invalidate = () => {
          const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_TEMPLATES_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: 'full-reload' });
          }
        };
      }

      // Serve a virtual index.html for the root route
      server.middlewares.use(async (req, res, next) => {
        const urlPath = req.url.split('?')[0];
        if (urlPath === '/' || urlPath === '/index.html') {
          const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Framely Studio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/@id/__x00__${VIRTUAL_ENTRY_ID}"></script>
  </body>
</html>`;
          const transformed = await server.transformIndexHtml(req.url, html);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(transformed);
          return;
        }
        next();
      });
    },

    resolveId(id) {
      if (id === VIRTUAL_ENTRY_ID) return RESOLVED_VIRTUAL_ENTRY_ID;
      if (id === VIRTUAL_TEMPLATES_ID) return RESOLVED_VIRTUAL_TEMPLATES_ID;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_ENTRY_ID) {
        // Normalize paths for import statements (use forward slashes)
        const userEntry = userEntryPath.replace(/\\/g, '/');
        const appPath = path.join(studioDir, 'App.jsx').replace(/\\/g, '/');
        const cssPath = path.join(studioDir, 'styles', 'design-system.css').replace(/\\/g, '/');
        const appCssPath = path.join(studioDir, 'App.css').replace(/\\/g, '/');

        return `
import '${userEntry}';
import '${cssPath}';
import '${appCssPath}';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '${appPath}';

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null, React.createElement(App))
);
`;
      }

      if (id === RESOLVED_VIRTUAL_TEMPLATES_ID) {
        const installed = templateState ? templateState.installed : [];
        return generateVirtualModule(installed);
      }
    },
  };
}

/**
 * Vite plugin that serves /api/assets from the public/ directory.
 * Used as a fallback when accessed directly (not via render API proxy).
 */
function assetsApiPlugin(publicDir) {
  return {
    name: 'framely-assets-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== '/api/assets') return next();

        if (!publicDir || !fs.existsSync(publicDir)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ assets: [] }));
          return;
        }

        const assets = [];
        const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.bmp', '.ico'];
        const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
        const audioExts = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];
        const fontExts = ['.woff', '.woff2', '.ttf', '.otf', '.eot'];
        const dataExts = ['.json', '.csv', '.xml', '.txt'];

        function getType(ext) {
          if (imageExts.includes(ext)) return 'image';
          if (videoExts.includes(ext)) return 'video';
          if (audioExts.includes(ext)) return 'audio';
          if (fontExts.includes(ext)) return 'font';
          if (dataExts.includes(ext)) return 'data';
          return 'other';
        }

        function walk(dir, prefix) {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const full = path.join(dir, entry.name);
            const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
              walk(full, rel);
            } else {
              const stat = fs.statSync(full);
              const ext = path.extname(entry.name).toLowerCase();
              assets.push({
                name: entry.name,
                path: rel,
                size: stat.size,
                extension: ext,
                type: getType(ext),
              });
            }
          }
        }

        walk(publicDir, '');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ assets }));
      });
    },
  };
}

/**
 * Main preview command handler.
 *
 * Uses Vite's JavaScript API to create a dev server that combines
 * the studio UI (bundled in the CLI) with the user's compositions.
 */
export async function previewCommand(options) {
  const port = parseInt(options.port || '3000', 10);
  const apiPort = port + 1;
  const shouldOpen = options.open !== false;
  const projectDir = process.cwd();

  console.log(chalk.cyan('\n🎬 Framely Studio\n'));

  // Find the user's entry file
  const userEntry = findUserEntry(projectDir);
  if (!userEntry) {
    console.error(chalk.red('Error: Could not find entry file.'));
    console.log(chalk.gray('Expected one of: src/index.jsx, src/index.tsx, src/index.js, src/index.ts'));
    console.log(chalk.gray('Run `npx create-framely my-project` to create a new Framely project.\n'));
    process.exit(1);
  }

  const studioDir = path.resolve(__dirname, '../studio');
  const outputsDir = path.resolve(projectDir, 'outputs');
  const publicDir = path.resolve(projectDir, 'public');

  // Discover installed template packages
  const installed = discoverInstalledTemplates(projectDir);
  const templateState = { installed, invalidate: null };

  console.log(chalk.white('  Project:   '), chalk.gray(projectDir));
  console.log(chalk.white('  Entry:     '), chalk.gray(path.relative(projectDir, userEntry)));
  console.log(chalk.white('  Templates: '), chalk.gray(`${installed.length} installed`));
  console.log(chalk.white('  Port:      '), chalk.yellow(String(port)));
  console.log(chalk.white('  URL:       '), chalk.green(`http://localhost:${port}`));
  console.log('');

  // Start the render API
  const frontendUrl = `http://localhost:${port}`;
  const apiServer = startRenderApi(apiPort, frontendUrl, outputsDir, publicDir, projectDir, templateState);

  console.log(chalk.cyan('  Starting studio...\n'));

  // Resolve react/react-dom/framely from the user's project directory
  // This is needed because virtual modules don't have a filesystem location
  // for Vite to resolve bare imports from.
  const require = createRequire(path.resolve(projectDir, 'package.json'));
  function tryResolve(pkg) {
    try {
      return path.dirname(require.resolve(`${pkg}/package.json`));
    } catch {
      return undefined;
    }
  }

  const reactDir = tryResolve('react');
  const reactDomDir = tryResolve('react-dom');
  const framelyDir = tryResolve('@codellyson/framely');

  const aliases = [];
  if (reactDir) aliases.push({ find: 'react', replacement: reactDir });
  if (reactDomDir) aliases.push({ find: 'react-dom', replacement: reactDomDir });
  if (framelyDir) aliases.push({ find: '@codellyson/framely', replacement: framelyDir });

  // Create Vite dev server with the studio plugin
  const server = await createViteServer({
    root: projectDir,
    plugins: [
      react(),
      framelyStudioPlugin(userEntry, studioDir, templateState),
      assetsApiPlugin(publicDir),
    ],
    server: {
      port,
      host: '0.0.0.0',
      open: shouldOpen,
      proxy: {
        '/api/render': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
        '/api/still': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
        '/api/templates/install': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
        '/api/templates/remove': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
        '/api/templates': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
        '/outputs': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', '@codellyson/framely'],
    },
    resolve: {
      alias: aliases,
      dedupe: ['react', 'react-dom', '@codellyson/framely'],
    },
  });

  await server.listen();
  server.printUrls();

  // Handle process signals
  const cleanup = async () => {
    console.log(chalk.gray('\n\n  Shutting down...\n'));
    await server.close();
    apiServer.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
