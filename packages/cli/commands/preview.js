/* global window */
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

import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { createBrowser, closeBrowser } from '../utils/browser.js';
import { renderVideo } from '../utils/render.js';
import { getCodecConfig } from '../utils/codecs.js';
import { createServer as createViteServer } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Mock templates data for the marketplace API
 * In production, this would come from a database
 */
const MOCK_TEMPLATES = [
  {
    id: 'social-intro-1',
    name: 'Modern Social Intro',
    description: 'Clean, modern intro animation perfect for social media videos.',
    category: 'intro-outro',
    tags: ['intro', 'social', 'modern', 'minimal'],
    preview: { thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=225&fit=crop' },
    author: { id: 'framely', name: 'Framely Team', verified: true },
    bundleUrl: 'https://cdn.framely.dev/templates/social-intro-1/bundle.js',
    version: '1.0.0',
    width: 1080, height: 1920, fps: 30, durationInFrames: 90,
    defaultProps: { title: 'Your Title Here', subtitle: 'Subtitle text', accentColor: '#6366f1' },
    downloads: 1250, rating: 4.8, featured: true,
    createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'youtube-subscribe',
    name: 'Subscribe Animation',
    description: 'Eye-catching subscribe button animation with bell notification.',
    category: 'social-media',
    tags: ['youtube', 'subscribe', 'animation', 'cta'],
    preview: { thumbnail: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=225&fit=crop' },
    author: { id: 'framely', name: 'Framely Team', verified: true },
    bundleUrl: 'https://cdn.framely.dev/templates/youtube-subscribe/bundle.js',
    version: '1.0.0',
    width: 1920, height: 1080, fps: 30, durationInFrames: 120,
    defaultProps: { channelName: 'Your Channel', buttonColor: '#FF0000', showBell: true },
    downloads: 2340, rating: 4.9, featured: true,
    createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-01-18T00:00:00Z',
  },
  {
    id: 'lower-third-1',
    name: 'Clean Lower Third',
    description: 'Professional lower third with smooth slide-in animation.',
    category: 'lower-thirds',
    tags: ['lower-third', 'professional', 'news'],
    preview: { thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=225&fit=crop' },
    author: { id: 'motion-pro', name: 'Motion Pro', verified: true },
    bundleUrl: 'https://cdn.framely.dev/templates/lower-third-1/bundle.js',
    version: '1.2.0',
    width: 1920, height: 1080, fps: 30, durationInFrames: 150,
    defaultProps: { name: 'John Doe', title: 'CEO & Founder', accentColor: '#3b82f6' },
    downloads: 890, rating: 4.6, featured: false,
    createdAt: '2024-01-08T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'text-reveal-1',
    name: 'Kinetic Text Reveal',
    description: 'Dynamic text reveal with character-by-character animation.',
    category: 'text-animations',
    tags: ['text', 'kinetic', 'reveal', 'typography'],
    preview: { thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=225&fit=crop' },
    author: { id: 'type-master', name: 'Type Master', verified: false },
    bundleUrl: 'https://cdn.framely.dev/templates/text-reveal-1/bundle.js',
    version: '1.0.0',
    width: 1920, height: 1080, fps: 60, durationInFrames: 180,
    defaultProps: { text: 'Your text here', fontSize: 120, color: '#ffffff' },
    downloads: 1567, rating: 4.7, featured: false,
    createdAt: '2024-01-05T00:00:00Z', updatedAt: '2024-01-12T00:00:00Z',
  },
  {
    id: 'gradient-bg-1',
    name: 'Animated Gradient',
    description: 'Mesmerizing animated gradient background with smooth color transitions.',
    category: 'backgrounds',
    tags: ['background', 'gradient', 'animated', 'loop'],
    preview: { thumbnail: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=225&fit=crop' },
    author: { id: 'framely', name: 'Framely Team', verified: true },
    bundleUrl: 'https://cdn.framely.dev/templates/gradient-bg-1/bundle.js',
    version: '1.0.0',
    width: 1920, height: 1080, fps: 30, durationInFrames: 300,
    defaultProps: { colors: ['#6366f1', '#8b5cf6', '#d946ef'], speed: 1 },
    downloads: 3210, rating: 4.5, featured: false,
    createdAt: '2024-01-03T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'promo-slide-1',
    name: 'Product Showcase',
    description: 'Professional product showcase template with dynamic transitions.',
    category: 'marketing',
    tags: ['product', 'showcase', 'promo', 'ecommerce'],
    preview: { thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop' },
    author: { id: 'ad-studio', name: 'Ad Studio', verified: true },
    bundleUrl: 'https://cdn.framely.dev/templates/promo-slide-1/bundle.js',
    version: '2.0.0',
    width: 1080, height: 1080, fps: 30, durationInFrames: 180,
    defaultProps: { productName: 'Product Name', price: '$99.99', brandColor: '#10b981' },
    downloads: 756, rating: 4.4, featured: true,
    createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-08T00:00:00Z',
  },
  {
    id: 'presentation-1',
    name: 'Slide Transition Pack',
    description: 'Collection of smooth slide transitions for presentations.',
    category: 'presentation',
    tags: ['presentation', 'slides', 'transition', 'corporate'],
    preview: { thumbnail: 'https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?w=400&h=225&fit=crop' },
    author: { id: 'slide-pro', name: 'Slide Pro', verified: false },
    bundleUrl: 'https://cdn.framely.dev/templates/presentation-1/bundle.js',
    version: '1.1.0',
    width: 1920, height: 1080, fps: 30, durationInFrames: 60,
    defaultProps: { transitionType: 'slide', direction: 'left' },
    downloads: 445, rating: 4.3, featured: false,
    createdAt: '2023-12-28T00:00:00Z', updatedAt: '2024-01-05T00:00:00Z',
  },
  {
    id: 'instagram-story',
    name: 'Story Template',
    description: 'Trendy Instagram story template with animated stickers and text effects.',
    category: 'social-media',
    tags: ['instagram', 'story', 'social', 'trendy'],
    preview: { thumbnail: 'https://images.unsplash.com/photo-1611262588024-d12430b98920?w=400&h=225&fit=crop' },
    author: { id: 'social-creator', name: 'Social Creator', verified: true },
    bundleUrl: 'https://cdn.framely.dev/templates/instagram-story/bundle.js',
    version: '1.0.0',
    width: 1080, height: 1920, fps: 30, durationInFrames: 150,
    defaultProps: { headline: 'New Post!', backgroundColor: '#f472b6' },
    downloads: 1890, rating: 4.6, featured: false,
    createdAt: '2023-12-25T00:00:00Z', updatedAt: '2024-01-02T00:00:00Z',
  },
];

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
      } catch (e) {
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
 * @returns {http.Server}
 */
export function startRenderApi(apiPort, frontendUrl, outputsDir, publicDir) {
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

    // GET /api/templates/categories — list template categories
    if (req.method === 'GET' && req.url === '/api/templates/categories') {
      handleTemplateCategories(req, res);
      return;
    }

    // GET /api/templates/:id — get single template
    if (req.method === 'GET' && req.url.match(/^\/api\/templates\/[^/]+$/)) {
      const id = req.url.replace('/api/templates/', '');
      handleGetTemplate(req, res, id);
      return;
    }

    // GET /api/templates — list templates with filters
    if (req.method === 'GET' && req.url.startsWith('/api/templates')) {
      handleListTemplates(req, res);
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
  } catch (e) {
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
  } catch (e) {
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

    // Set frame
    await page.evaluate((f) => { window.__setFrame(f); }, frame);
    await page.waitForFunction(() => {
      const dr = window.__FRAMELY_DELAY_RENDER;
      return !dr || dr.pendingCount === 0;
    }, { timeout: 30000 });

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
 * Handle GET /api/templates — list templates with filters.
 */
function handleListTemplates(req, res) {
  const url = new URL(req.url, `http://localhost`);
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');
  const featured = url.searchParams.get('featured');
  const sortBy = url.searchParams.get('sortBy') || 'newest';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(url.searchParams.get('pageSize') || '12', 10);

  let filtered = [...MOCK_TEMPLATES];

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
      t.tags.some(tag => tag.toLowerCase().includes(searchLower))
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
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
}

/**
 * Handle GET /api/templates/:id — get single template.
 */
function handleGetTemplate(req, res, id) {
  const template = MOCK_TEMPLATES.find(t => t.id === id);
  if (!template) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Template not found' }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(template));
}

/**
 * Handle GET /api/templates/categories — list categories with counts.
 */
function handleTemplateCategories(req, res) {
  const counts = {};
  MOCK_TEMPLATES.forEach(t => {
    counts[t.category] = (counts[t.category] || 0) + 1;
  });
  const categories = Object.entries(counts).map(([category, count]) => ({ category, count }));
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(categories));
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
function framelyStudioPlugin(userEntryPath, studioDir) {
  const VIRTUAL_ENTRY_ID = 'virtual:framely-entry';
  const RESOLVED_VIRTUAL_ENTRY_ID = '\0' + VIRTUAL_ENTRY_ID;

  return {
    name: 'framely-studio',

    configureServer(server) {
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

  console.log(chalk.white('  Project:   '), chalk.gray(projectDir));
  console.log(chalk.white('  Entry:     '), chalk.gray(path.relative(projectDir, userEntry)));
  console.log(chalk.white('  Port:      '), chalk.yellow(String(port)));
  console.log(chalk.white('  URL:       '), chalk.green(`http://localhost:${port}`));
  console.log('');

  // Start the render API
  const frontendUrl = `http://localhost:${port}`;
  const apiServer = startRenderApi(apiPort, frontendUrl, outputsDir, publicDir);

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
  const framelyDir = tryResolve('framely');

  const aliases = [];
  if (reactDir) aliases.push({ find: 'react', replacement: reactDir });
  if (reactDomDir) aliases.push({ find: 'react-dom', replacement: reactDomDir });
  if (framelyDir) aliases.push({ find: 'framely', replacement: framelyDir });

  // Create Vite dev server with the studio plugin
  const server = await createViteServer({
    root: projectDir,
    plugins: [
      react(),
      framelyStudioPlugin(userEntry, studioDir),
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
      include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'framely'],
    },
    resolve: {
      alias: aliases,
      dedupe: ['react', 'react-dom'],
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
