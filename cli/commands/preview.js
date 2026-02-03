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
import { createBrowser, closeBrowser } from '../utils/browser.js';
import { renderVideo } from '../utils/render.js';
import { getCodecConfig } from '../utils/codecs.js';

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
function startRenderApi(apiPort, frontendUrl, outputsDir) {
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
 * Handle GET /outputs/* — serve rendered files.
 */
function handleOutputFile(req, res, outputsDir) {
  const filename = req.url.replace('/outputs/', '');
  // Prevent path traversal
  if (filename.indexOf('..') !== -1 || filename.indexOf('/') !== -1) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  const filePath = path.join(outputsDir, filename);
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
 * Main preview command handler.
 */
export async function previewCommand(options) {
  const port = options.port || '3000';
  const apiPort = parseInt(port, 10) + 1;
  const shouldOpen = options.open !== false;

  console.log(chalk.cyan('\n🎬 Framely Preview\n'));

  // Find the frontend directory
  const possiblePaths = [
    path.resolve(process.cwd(), 'frontend'),
    path.resolve(process.cwd()),
    path.resolve(__dirname, '../../frontend'),
  ];

  let frontendDir = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(path.join(p, 'package.json'))) {
      const pkg = JSON.parse(fs.readFileSync(path.join(p, 'package.json'), 'utf-8'));
      if (pkg.name === 'framely-frontend' || fs.existsSync(path.join(p, 'src/lib/context.jsx'))) {
        frontendDir = p;
        break;
      }
    }
  }

  if (!frontendDir) {
    console.error(chalk.red('Error: Could not find Framely frontend directory.'));
    console.log(chalk.gray('Make sure you are in a Framely project directory.\n'));
    process.exit(1);
  }

  const outputsDir = path.resolve(process.cwd(), 'outputs');

  console.log(chalk.white('  Directory:'), chalk.gray(frontendDir));
  console.log(chalk.white('  Port:      '), chalk.yellow(port));
  console.log(chalk.white('  URL:       '), chalk.green(`http://localhost:${port}`));
  console.log('');

  // Check if node_modules exists
  const nodeModulesPath = path.join(frontendDir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log(chalk.yellow('  Installing dependencies...'));
    const installProcess = spawn('npm', ['install'], {
      cwd: frontendDir,
      stdio: 'inherit',
    });

    await new Promise((resolve, reject) => {
      installProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`npm install failed with code ${code}`));
      });
    });
    console.log('');
  }

  // Start the render API
  const frontendUrl = `http://localhost:${port}`;
  const apiServer = startRenderApi(apiPort, frontendUrl, outputsDir);

  // Set environment variables
  const env = {
    ...process.env,
    PORT: port,
    BROWSER: shouldOpen ? 'true' : 'false',
    VITE_RENDER_API_PORT: String(apiPort),
  };

  console.log(chalk.cyan('  Starting development server...\n'));

  // Start the dev server
  const devProcess = spawn('npm', ['run', 'dev'], {
    cwd: frontendDir,
    stdio: 'inherit',
    env,
  });

  // Handle process signals
  const cleanup = () => {
    console.log(chalk.gray('\n\n  Shutting down...\n'));
    devProcess.kill('SIGTERM');
    apiServer.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  devProcess.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.error(chalk.red(`\n  Dev server exited with code ${code}\n`));
    }
    apiServer.close();
    process.exit(code || 0);
  });

  devProcess.on('error', (error) => {
    console.error(chalk.red(`\n  Failed to start dev server: ${error.message}\n`));
    apiServer.close();
    process.exit(1);
  });
}
