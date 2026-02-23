/**
 * Batch Render Command
 *
 * Renders multiple videos from a data file (CSV or JSON).
 * Each row in the data file becomes the props for one video render.
 *
 * Usage:
 *   framely batch my-video --data users.csv --output-pattern "{name}-welcome.mp4"
 *   framely batch product-card --data products.json --concurrency 3
 */

import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { createBrowser, closeBrowser } from '../utils/browser.js';
import { renderVideo } from '../utils/render.js';
import { getCodecConfig } from '../utils/codecs.js';
import { loadDataFile } from '../utils/data.js';
import { createLogger } from '../utils/logger.js';
import {
  validateCrf,
  validateScale,
  validateFps,
  validateDimension,
  validateQuality,
  validateFrontendUrl,
} from '../utils/validate.js';

/**
 * Build render URL with props.
 */
function buildRenderUrl(baseUrl, compositionId, props) {
  const url = new URL(baseUrl);
  url.searchParams.set('renderMode', 'true');
  url.searchParams.set('composition', compositionId);
  if (Object.keys(props).length > 0) {
    url.searchParams.set('props', encodeURIComponent(JSON.stringify(props)));
  }
  return url.toString();
}

/**
 * Create ASCII progress bar.
 */
function createProgressBar(percent, width) {
  const filled = Math.floor((percent / 100) * width);
  const empty = width - filled;
  return chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

/**
 * Sanitize a string for use as a filename.
 */
function sanitizeFilename(str) {
  return String(str).replace(/[/\\:*?"<>|]/g, '-').replace(/\s+/g, '-');
}

/**
 * Resolve output filename from a pattern and data row.
 *
 * @param {string} pattern - Pattern with {field} placeholders
 * @param {object} props - Data row
 * @param {number} index - Row index (0-based)
 * @param {number} totalRows - Total number of rows (for zero-padding)
 * @param {string} compositionId - Composition ID
 * @param {string} ext - File extension
 * @returns {string}
 */
function resolveOutputPattern(pattern, props, index, totalRows, compositionId, ext) {
  const padding = String(totalRows - 1).length;
  const paddedIndex = String(index).padStart(Math.max(padding, 3), '0');

  let filename = pattern
    .replace(/\{_index\}/g, paddedIndex)
    .replace(/\{compositionId\}/g, compositionId);

  // Replace {field} placeholders with values from props
  for (const [key, value] of Object.entries(props)) {
    filename = filename.replace(new RegExp(`\\{${key}\\}`, 'g'), sanitizeFilename(value));
  }

  // Ensure it has the right extension
  if (!filename.endsWith(`.${ext}`)) {
    filename = filename.replace(/\.[^.]+$/, '') + `.${ext}`;
  }

  return filename;
}

/**
 * Promise-based concurrency limiter.
 *
 * @param {Array<() => Promise>} tasks - Array of async task functions
 * @param {number} limit - Max concurrent tasks
 * @param {function} onTaskDone - Called after each task completes
 * @returns {Promise<Array<{ status: 'fulfilled'|'rejected', value?: any, reason?: any }>>}
 */
async function runWithConcurrency(tasks, limit, onTaskDone) {
  const results = new Array(tasks.length);
  let nextIndex = 0;

  async function runNext() {
    while (nextIndex < tasks.length) {
      const index = nextIndex++;
      try {
        const value = await tasks[index]();
        results[index] = { status: 'fulfilled', value };
      } catch (error) {
        results[index] = { status: 'rejected', reason: error };
      }
      if (onTaskDone) onTaskDone(index, results[index]);
    }
  }

  // Start `limit` workers
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => runNext());
  await Promise.all(workers);

  return results;
}

/**
 * Main batch command handler.
 */
export async function batchCommand(compositionId, options) {
  const log = createLogger(options.logLevel);

  try {
    // ─── Validate Options ───
    const codec = options.codec || 'h264';
    const codecConfig = getCodecConfig(codec);

    if (!codecConfig) {
      console.error(chalk.red(`Unknown codec: ${codec}`));
      console.log(chalk.gray('Available codecs: h264, h265, vp8, vp9, prores, gif'));
      process.exit(1);
    }

    const crf = validateCrf(parseInt(options.crf, 10), codec);
    const concurrency = parseInt(options.concurrency, 10);
    const scale = validateScale(parseFloat(options.scale));
    validateFrontendUrl(options.frontendUrl, options.allowRemote);
    if (options.fps) validateFps(options.fps);
    if (options.width) validateDimension(options.width, 'width');
    if (options.height) validateDimension(options.height, 'height');

    // ─── Load Data ───
    const dataFile = options.data;
    if (!dataFile) {
      console.error(chalk.red('Error: --data <path> is required'));
      process.exit(1);
    }

    console.log(chalk.cyan('\n📦 Framely Batch Render\n'));
    console.log(chalk.white('  Composition:'), chalk.yellow(compositionId));
    console.log(chalk.white('  Data file:  '), chalk.yellow(dataFile));

    const data = loadDataFile(dataFile);
    console.log(chalk.white('  Jobs:       '), chalk.yellow(data.length));
    console.log(chalk.white('  Concurrency:'), chalk.yellow(concurrency));
    console.log(chalk.white('  Codec:      '), chalk.yellow(codec));
    if (codecConfig.supportsCrf) {
      console.log(chalk.white('  Quality:    '), chalk.yellow(`CRF ${crf}`));
    }

    // ─── Output Setup ───
    const ext = codecConfig.extension;
    const outputDir = path.resolve(options.outputDir);
    fs.mkdirSync(outputDir, { recursive: true });

    const outputPattern = options.outputPattern || `${compositionId}-{_index}.${ext}`;
    console.log(chalk.white('  Pattern:    '), chalk.yellow(outputPattern));
    console.log(chalk.white('  Output dir: '), chalk.green(outputDir));
    console.log('');

    // ─── Resolve Output Filenames ───
    const jobs = data.map((row, index) => ({
      index,
      props: row,
      filename: resolveOutputPattern(outputPattern, row, index, data.length, compositionId, ext),
    }));

    // Check for duplicate filenames
    const filenames = new Set();
    for (const job of jobs) {
      if (filenames.has(job.filename)) {
        console.error(chalk.red(`Error: Duplicate output filename "${job.filename}". Use {_index} in your pattern to ensure uniqueness.`));
        process.exit(1);
      }
      filenames.add(job.filename);
    }

    // ─── Fetch Composition Metadata (once) ───
    process.stdout.write(chalk.gray('  Fetching composition metadata...'));
    const { browser: metaBrowser, page: metaPage } = await createBrowser({
      width: options.width ? parseInt(options.width, 10) : undefined,
      height: options.height ? parseInt(options.height, 10) : undefined,
      scale,
    });

    const metaUrl = buildRenderUrl(options.frontendUrl, compositionId, {});
    await metaPage.goto(metaUrl, { waitUntil: 'domcontentloaded' });
    await metaPage.waitForFunction('window.__ready === true', { timeout: 30000 });

    const metadata = await metaPage.evaluate(() => ({
      width: window.__compositionWidth || 1920,
      height: window.__compositionHeight || 1080,
      fps: window.__compositionFps || 30,
      durationInFrames: window.__compositionDurationInFrames || 300,
    }));

    await closeBrowser(metaBrowser);
    console.log(chalk.green(' done'));
    console.log(chalk.gray(`  ${metadata.width}x${metadata.height} @ ${metadata.fps}fps, ${metadata.durationInFrames} frames\n`));

    const width = options.width ? parseInt(options.width, 10) : metadata.width;
    const height = options.height ? parseInt(options.height, 10) : metadata.height;
    const fps = options.fps ? parseInt(options.fps, 10) : metadata.fps;
    const totalFrames = metadata.durationInFrames;

    // ─── Progress State ───
    const jobStatus = new Array(jobs.length).fill(null);
    let completedCount = 0;
    let failedCount = 0;
    const startTime = Date.now();

    function printProgress() {
      const finished = completedCount + failedCount;
      const inProgress = Math.min(concurrency, jobs.length - finished);
      const queued = Math.max(0, jobs.length - finished - inProgress);

      process.stdout.write(
        `\r  ${chalk.gray('Progress:')} ${chalk.green(completedCount + ' done')} | ${chalk.cyan(inProgress + ' active')} | ${chalk.gray(queued + ' queued')}` +
        (failedCount > 0 ? ` | ${chalk.red(failedCount + ' failed')}` : '') +
        '   '
      );
    }

    // ─── Build Tasks ───
    const tasks = jobs.map((job) => async () => {
      const outputPath = path.join(outputDir, job.filename);
      jobStatus[job.index] = { state: 'rendering', progress: 0 };

      // Create browser for this job
      const { browser, page } = await createBrowser({ width, height, scale });

      try {
        const renderUrl = buildRenderUrl(options.frontendUrl, compositionId, job.props);
        await page.goto(renderUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction('window.__ready === true', { timeout: 30000 });

        await renderVideo({
          page,
          outputPath,
          startFrame: 0,
          endFrame: totalFrames - 1,
          width,
          height,
          fps,
          codec,
          crf,
          muted: options.muted,
          onProgress: (frame, total) => {
            jobStatus[job.index].progress = Math.floor((frame / total) * 100);
            printProgress();
          },
        });

        return { filename: job.filename, outputPath };
      } finally {
        await closeBrowser(browser);
      }
    });

    // ─── Execute ───
    console.log(chalk.gray('  Rendering...\n'));

    const results = await runWithConcurrency(
      tasks,
      concurrency,
      (index, result) => {
        if (result.status === 'fulfilled') {
          completedCount++;
          const jobLabel = `[${String(completedCount + failedCount).padStart(String(jobs.length).length)}/${jobs.length}]`;
          console.log(`\n  ${chalk.green('✓')} ${chalk.gray(jobLabel)} ${chalk.white(jobs[index].filename)}`);
        } else {
          failedCount++;
          const jobLabel = `[${String(completedCount + failedCount).padStart(String(jobs.length).length)}/${jobs.length}]`;
          console.log(`\n  ${chalk.red('✗')} ${chalk.gray(jobLabel)} ${chalk.white(jobs[index].filename)} ${chalk.red(result.reason.message)}`);

          if (options.failFast) {
            throw result.reason;
          }
        }
        printProgress();
      },
    );

    // ─── Summary ───
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log('\n');
    console.log(chalk.cyan('  ─── Summary ───'));
    console.log(chalk.white('  Total:    '), chalk.yellow(jobs.length));
    console.log(chalk.white('  Success:  '), chalk.green(succeeded));
    if (failed > 0) {
      console.log(chalk.white('  Failed:   '), chalk.red(failed));
    }
    console.log(chalk.white('  Time:     '), chalk.cyan(duration + 's'));
    console.log(chalk.white('  Output:   '), chalk.green(outputDir));
    console.log('');

    if (failed > 0) {
      console.log(chalk.yellow(`  ⚠ ${failed} job(s) failed. Re-run with --log-level verbose for details.\n`));
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(chalk.red(`\nError: ${error.message}\n`));
    if (log.isVerbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}
