/**
 * Render Command
 *
 * Renders a composition to video with various codec and quality options.
 *
 * Usage:
 *   framely render my-video output.mp4 --codec h264 --crf 18
 *   framely render my-video --props '{"name": "World"}'
 *   framely render my-video --sequence --image-format png
 */

import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { createBrowser, closeBrowser } from '../utils/browser.js';
import { renderVideo, renderVideoParallel, renderSequence, renderGif, mixAudio } from '../utils/render.js';
import { getCodecConfig } from '../utils/codecs.js';
import { loadProps } from '../utils/props.js';
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
 * Parse frame range string to { start, end }.
 * @param {string} range - e.g., "0-100"
 * @returns {{ start: number, end: number }|null}
 */
function parseFrameRange(range) {
  if (!range) return null;
  const match = range.match(/^(\d+)-(\d+)$/);
  if (!match) return null;
  return { start: parseInt(match[1], 10), end: parseInt(match[2], 10) };
}

/**
 * Main render command handler.
 */
export async function renderCommand(compositionId, output, options) {
  const spinner = ora();
  const log = createLogger(options.logLevel);

  try {
    // ─── Parse Options ───
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
    const frameRange = parseFrameRange(options.frames);
    const inputProps = loadProps(options.props, options.propsFile);
    validateFrontendUrl(options.frontendUrl, options.allowRemote);
    if (options.fps) validateFps(options.fps);
    if (options.width) validateDimension(options.width, 'width');
    if (options.height) validateDimension(options.height, 'height');
    if (options.quality) validateQuality(options.quality);

    // ─── Determine Output Path ───
    const outputDir = path.resolve(options.outputDir);
    fs.mkdirSync(outputDir, { recursive: true });

    let outputPath;
    if (output) {
      outputPath = path.resolve(output);
    } else if (options.sequence) {
      outputPath = path.join(outputDir, compositionId);
    } else {
      const ext = codecConfig.extension;
      outputPath = path.join(outputDir, `${compositionId}-${Date.now()}.${ext}`);
    }

    // ─── Print Configuration ───
    console.log(chalk.cyan('\n🎬 Framely Render\n'));
    console.log(chalk.white('  Composition:'), chalk.yellow(compositionId));
    console.log(chalk.white('  Codec:      '), chalk.yellow(codec));
    if (codecConfig.supportsCrf) {
      console.log(chalk.white('  Quality:    '), chalk.yellow(`CRF ${crf}`));
    }
    if (options.width || options.height) {
      console.log(chalk.white('  Resolution: '), chalk.yellow(`${options.width || 'auto'}x${options.height || 'auto'}`));
    }
    if (scale !== 1) {
      console.log(chalk.white('  Scale:      '), chalk.yellow(`${scale}x`));
    }
    if (frameRange) {
      console.log(chalk.white('  Frames:     '), chalk.yellow(`${frameRange.start}-${frameRange.end}`));
    }
    if (concurrency > 1 && !options.sequence && codec !== 'gif') {
      console.log(chalk.white('  Concurrency:'), chalk.yellow(`${concurrency} workers`));
    }
    if (Object.keys(inputProps).length > 0) {
      console.log(chalk.white('  Props:      '), chalk.gray(JSON.stringify(inputProps)));
    }
    console.log(chalk.white('  Output:     '), chalk.green(outputPath));
    console.log('');

    // ─── Launch Browser ───
    spinner.start('Launching browser...');
    const { browser, page } = await createBrowser({
      width: options.width ? parseInt(options.width, 10) : undefined,
      height: options.height ? parseInt(options.height, 10) : undefined,
      scale,
    });
    spinner.succeed('Browser ready');

    // ─── Load Composition ───
    spinner.start('Loading composition...');
    const renderUrl = buildRenderUrl(options.frontendUrl, compositionId, inputProps);
    await page.goto(renderUrl, { waitUntil: 'domcontentloaded' });

    // Wait for app to be ready
    await page.waitForFunction('window.__ready === true', { timeout: 30000 });

    // Get composition metadata
    const metadata = await page.evaluate(() => ({
      width: window.__compositionWidth || 1920,
      height: window.__compositionHeight || 1080,
      fps: window.__compositionFps || 30,
      durationInFrames: window.__compositionDurationInFrames || 300,
    }));

    spinner.succeed(`Composition loaded: ${metadata.width}x${metadata.height} @ ${metadata.fps}fps`);

    // Apply overrides
    const width = options.width ? parseInt(options.width, 10) : metadata.width;
    const height = options.height ? parseInt(options.height, 10) : metadata.height;
    const fps = options.fps ? parseInt(options.fps, 10) : metadata.fps;
    let startFrame = 0;
    let endFrame = metadata.durationInFrames - 1;

    if (frameRange) {
      startFrame = frameRange.start;
      endFrame = Math.min(frameRange.end, metadata.durationInFrames - 1);
    }

    if (startFrame > endFrame) {
      console.error(chalk.red(`\nError: Start frame (${startFrame}) must be <= end frame (${endFrame})\n`));
      await closeBrowser(browser);
      process.exit(1);
    }

    const totalFrames = endFrame - startFrame + 1;

    console.log(chalk.gray(`\n  Rendering ${totalFrames} frames (${startFrame}-${endFrame})\n`));

    // ─── Render ───
    const startTime = Date.now();
    let lastProgress = -1;

    const onProgress = (frame, total) => {
      const progress = Math.floor((frame / total) * 100);
      if (progress !== lastProgress) {
        lastProgress = progress;
        const bar = createProgressBar(progress, 30);
        process.stdout.write(`\r  ${bar} ${progress}% (frame ${frame}/${total})`);
      }
    };

    if (options.sequence) {
      // Render as image sequence
      await renderSequence({
        page,
        outputDir: outputPath,
        startFrame,
        endFrame,
        width,
        height,
        fps,
        imageFormat: options.imageFormat,
        quality: parseInt(options.quality, 10),
        onProgress,
      });
    } else if (codec === 'gif') {
      // GIF uses 2-pass palette rendering for better quality
      log.verbose('Using 2-pass GIF rendering with palette generation');
      await renderGif({
        page,
        outputPath,
        startFrame,
        endFrame,
        width,
        height,
        fps,
        onProgress,
      });
    } else if (concurrency > 1) {
      // Parallel rendering with multiple browser instances
      log.verbose(`Starting parallel render with ${concurrency} workers`);
      await closeBrowser(browser); // Close the initial browser, parallel uses its own pool
      await renderVideoParallel({
        renderUrl,
        outputPath,
        startFrame,
        endFrame,
        width,
        height,
        fps,
        codec,
        crf,
        concurrency,
        muted: options.muted,
        onProgress,
      });
    } else {
      // Single-threaded video render
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
        muted: options.muted,
        onProgress,
      });
    }

    // ─── Audio Mixing ───
    if (!options.muted && codec !== 'gif' && !options.sequence) {
      try {
        // Check if there are audio tracks registered in the page
        const audioTracks = concurrency > 1 ? null : await page.evaluate(() => {
          return window.__FRAMELY_AUDIO_TRACKS || null;
        });

        if (audioTracks && audioTracks.length > 0) {
          log.verbose(`Mixing ${audioTracks.length} audio track(s)...`);
          spinner.start('Mixing audio...');
          const tempOutput = outputPath.replace(/(\.[^.]+)$/, '-with-audio$1');
          await mixAudio({ videoPath: outputPath, audioTracks, outputPath: tempOutput, fps });
          // Replace original with mixed version
          fs.renameSync(tempOutput, outputPath);
          spinner.succeed('Audio mixed');
        }
      } catch (audioErr) {
        log.warn(`Warning: Audio mixing failed: ${audioErr.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n\n${chalk.green('✓')} Render complete in ${chalk.cyan(duration + 's')}`);
    console.log(chalk.gray(`  Output: ${outputPath}\n`));

    // ─── Cleanup ───
    if (concurrency <= 1) {
      await closeBrowser(browser);
    }
    process.exit(0);
  } catch (error) {
    spinner.fail('Render failed');
    console.error(chalk.red(`\nError: ${error.message}\n`));
    if (log.isVerbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

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
