/**
 * Render Utilities
 *
 * Core rendering functions for video and image sequence output.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { setFrame, createBrowser, closeBrowser } from './browser.js';
import { getCodecArgs, getAudioArgs } from './codecs.js';

/** Selector for the render container element. */
const RENDER_CONTAINER = '#render-container';

/** Default JPEG quality for frame capture. */
const DEFAULT_SCREENSHOT_QUALITY = 90;

/**
 * Render a video from a page.
 *
 * @param {object} options
 * @param {Page} options.page - Playwright page
 * @param {string} options.outputPath - Output file path
 * @param {number} options.startFrame - First frame to render
 * @param {number} options.endFrame - Last frame to render
 * @param {number} options.width - Video width
 * @param {number} options.height - Video height
 * @param {number} options.fps - Frames per second
 * @param {string} options.codec - Codec identifier
 * @param {number} options.crf - Quality (CRF value)
 * @param {boolean} options.muted - Disable audio
 * @param {number} [options.screenshotQuality] - JPEG quality for frame capture (1-100)
 * @param {function} options.onProgress - Progress callback
 * @returns {Promise<string>} Output path
 */
export async function renderVideo({
  page,
  outputPath,
  startFrame,
  endFrame,
  width,
  height,
  fps,
  codec = 'h264',
  crf = 18,
  muted = false,
  screenshotQuality = DEFAULT_SCREENSHOT_QUALITY,
  onProgress,
}) {
  const totalFrames = endFrame - startFrame + 1;

  // Build FFmpeg arguments
  const ffmpegArgs = [
    '-y',                          // Overwrite output
    '-f', 'image2pipe',            // Input: piped images
    '-c:v', 'mjpeg',              // Input codec: JPEG
    '-framerate', String(fps),     // Input framerate
    '-i', '-',                     // Read from stdin
    ...getCodecArgs(codec, { crf, fps, width, height }),
  ];

  // Add audio arguments if not muted (placeholder for when audio is extracted)
  if (!muted) {
    // Audio will be mixed in a second pass or via temp file
    // For now, we create a silent video
  }

  ffmpegArgs.push(outputPath);

  // Start FFmpeg process
  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

  // Track FFmpeg errors
  let ffmpegError = '';
  ffmpegProcess.stderr.on('data', (data) => {
    ffmpegError += data.toString();
  });

  const ffmpegDone = new Promise((resolve, reject) => {
    ffmpegProcess.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed (code ${code}): ${ffmpegError.slice(-500)}`));
    });
    ffmpegProcess.on('error', reject);
  });

  // Render each frame
  for (let frame = startFrame; frame <= endFrame; frame++) {
    // Set frame and wait for render
    await setFrame(page, frame);

    // Capture screenshot (JPEG is faster to encode and smaller to pipe)
    const element = page.locator(RENDER_CONTAINER);
    const screenshot = await element.screenshot({ type: 'jpeg', quality: screenshotQuality });

    // Pipe to FFmpeg
    const canWrite = ffmpegProcess.stdin.write(screenshot);
    if (!canWrite) {
      await new Promise((resolve) => ffmpegProcess.stdin.once('drain', resolve));
    }

    // Report progress
    if (onProgress) onProgress(frame - startFrame + 1, totalFrames);
  }

  // Finalize
  ffmpegProcess.stdin.end();
  await ffmpegDone;

  return outputPath;
}

/**
 * Render an image sequence from a page.
 *
 * @param {object} options
 * @param {Page} options.page - Playwright page
 * @param {string} options.outputDir - Output directory
 * @param {number} options.startFrame - First frame to render
 * @param {number} options.endFrame - Last frame to render
 * @param {number} options.width - Image width
 * @param {number} options.height - Image height
 * @param {number} options.fps - Frames per second (for naming)
 * @param {string} options.imageFormat - 'png' or 'jpeg'
 * @param {number} options.quality - JPEG quality (0-100)
 * @param {function} options.onProgress - Progress callback
 * @returns {Promise<string>} Output directory
 */
export async function renderSequence({
  page,
  outputDir,
  startFrame,
  endFrame,
  width,
  height,
  fps,
  imageFormat = 'png',
  quality = 80,
  onProgress,
}) {
  const totalFrames = endFrame - startFrame + 1;

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Calculate padding for frame numbers
  const padding = String(endFrame).length;
  const ext = imageFormat === 'jpeg' ? 'jpg' : imageFormat;

  // Render each frame
  for (let frame = startFrame; frame <= endFrame; frame++) {
    // Set frame and wait for render
    await setFrame(page, frame);

    // Build filename with zero-padded frame number
    const frameNum = String(frame).padStart(padding, '0');
    const filename = `frame-${frameNum}.${ext}`;
    const outputPath = path.join(outputDir, filename);

    // Capture screenshot
    const element = page.locator(RENDER_CONTAINER);
    const screenshotOptions = {
      type: imageFormat,
      path: outputPath,
    };

    if (imageFormat === 'jpeg') {
      screenshotOptions.quality = quality;
    }

    await element.screenshot(screenshotOptions);

    // Report progress
    if (onProgress) onProgress(frame - startFrame + 1, totalFrames);
  }

  return outputDir;
}

/**
 * Render a GIF with palette optimization.
 *
 * @param {object} options
 * @param {Page} options.page - Playwright page
 * @param {string} options.outputPath - Output file path
 * @param {number} options.startFrame - First frame to render
 * @param {number} options.endFrame - Last frame to render
 * @param {number} options.width - GIF width
 * @param {number} options.height - GIF height
 * @param {number} options.fps - Frames per second
 * @param {number} options.loop - Loop count (0 = infinite)
 * @param {function} options.onProgress - Progress callback
 * @returns {Promise<string>} Output path
 */
export async function renderGif({
  page,
  outputPath,
  startFrame,
  endFrame,
  width,
  height,
  fps = 15,
  loop = 0,
  onProgress,
}) {
  const totalFrames = endFrame - startFrame + 1;
  const tempDir = path.join(path.dirname(outputPath), '.framely-temp-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // First pass: render frames to temp directory
    const padding = String(endFrame).length;

    for (let frame = startFrame; frame <= endFrame; frame++) {
      await setFrame(page, frame);

      const frameNum = String(frame - startFrame).padStart(padding, '0');
      const framePath = path.join(tempDir, `frame-${frameNum}.png`);

      const element = page.locator(RENDER_CONTAINER);
      await element.screenshot({ type: 'png', path: framePath });

      if (onProgress) onProgress(frame - startFrame + 1, totalFrames);
    }

    // Second pass: generate palette and create GIF
    const paletteFile = path.join(tempDir, 'palette.png');
    const inputPattern = path.join(tempDir, `frame-%0${padding}d.png`);

    // Generate palette
    await runFFmpeg([
      '-i', inputPattern,
      '-vf', `fps=${fps},scale=${width}:${height}:flags=lanczos,palettegen=max_colors=256`,
      '-y', paletteFile,
    ]);

    // Create GIF using palette
    await runFFmpeg([
      '-i', inputPattern,
      '-i', paletteFile,
      '-lavfi', `fps=${fps},scale=${width}:${height}:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a`,
      '-loop', String(loop),
      '-y', outputPath,
    ]);

    return outputPath;
  } finally {
    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Mix audio tracks into video.
 *
 * @param {object} options
 * @param {string} options.videoPath - Path to video file
 * @param {Array<{ path: string, startFrame: number, volume: number }>} options.audioTracks
 * @param {string} options.outputPath - Output path
 * @param {number} options.fps - Video FPS (for timing)
 * @returns {Promise<string>} Output path
 */
export async function mixAudio({
  videoPath,
  audioTracks,
  outputPath,
  fps,
}) {
  if (!audioTracks || audioTracks.length === 0) {
    // No audio to mix, just copy
    fs.copyFileSync(videoPath, outputPath);
    return outputPath;
  }

  // Build FFmpeg filter for mixing audio tracks
  const inputs = ['-i', videoPath];
  const filters = [];
  const audioInputs = [];

  audioTracks.forEach((track, i) => {
    const inputIndex = i + 1;
    inputs.push('-i', track.path);

    const delay = Math.round((track.startFrame / fps) * 1000);
    const volume = track.volume != null ? track.volume : 1;

    // Delay and adjust volume
    filters.push(`[${inputIndex}:a]adelay=${delay}|${delay},volume=${volume}[a${i}]`);
    audioInputs.push(`[a${i}]`);
  });

  // Mix all audio tracks
  const mixFilter = audioInputs.join('') + `amix=inputs=${audioTracks.length}:duration=longest[aout]`;
  filters.push(mixFilter);

  const ffmpegArgs = [
    ...inputs,
    '-filter_complex', filters.join(';'),
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'copy',
    ...getAudioArgs(),
    '-y', outputPath,
  ];

  await runFFmpeg(ffmpegArgs);
  return outputPath;
}

/**
 * Render a video using parallel browser instances.
 *
 * Divides the frame range into chunks, renders each chunk in a separate
 * browser instance as a PNG sequence, then stitches them with FFmpeg.
 *
 * @param {object} options
 * @param {string} options.renderUrl - URL to load in each browser
 * @param {string} options.outputPath - Output file path
 * @param {number} options.startFrame - First frame
 * @param {number} options.endFrame - Last frame
 * @param {number} options.width - Video width
 * @param {number} options.height - Video height
 * @param {number} options.fps - Frames per second
 * @param {string} options.codec - Codec identifier
 * @param {number} options.crf - Quality
 * @param {number} options.concurrency - Number of parallel workers
 * @param {boolean} options.muted - Disable audio
 * @param {function} options.onProgress - Progress callback
 * @returns {Promise<string>} Output path
 */
export async function renderVideoParallel({
  renderUrl,
  outputPath,
  startFrame,
  endFrame,
  width,
  height,
  fps,
  codec = 'h264',
  crf = 18,
  concurrency = 2,
  muted = false,
  onProgress,
}) {
  const totalFrames = endFrame - startFrame + 1;
  const chunkSize = Math.ceil(totalFrames / concurrency);
  const tempDir = path.join(path.dirname(outputPath), `.framely-parallel-${crypto.randomUUID().slice(0, 8)}`);
  fs.mkdirSync(tempDir, { recursive: true });

  // Calculate padding for frame filenames
  const padding = String(endFrame).length;

  try {
    // Divide into chunks
    const chunks = [];
    for (let i = 0; i < concurrency; i++) {
      const chunkStart = startFrame + i * chunkSize;
      const chunkEnd = Math.min(chunkStart + chunkSize - 1, endFrame);
      if (chunkStart > endFrame) break;
      chunks.push({ start: chunkStart, end: chunkEnd, index: i });
    }

    // Track progress across all workers
    let framesRendered = 0;

    // Render each chunk in parallel
    await Promise.all(
      chunks.map(async (chunk) => {
        const { browser, page } = await createBrowser({ width, height, scale: 1 });

        try {
          await page.goto(renderUrl, { waitUntil: 'domcontentloaded' });
          await page.waitForFunction('window.__ready === true', { timeout: 30000 });

          for (let frame = chunk.start; frame <= chunk.end; frame++) {
            await setFrame(page, frame);

            const frameNum = String(frame).padStart(padding, '0');
            const framePath = path.join(tempDir, `frame-${frameNum}.png`);

            const element = page.locator(RENDER_CONTAINER);
            await element.screenshot({ type: 'png', path: framePath });

            framesRendered++;
            if (onProgress) onProgress(framesRendered, totalFrames);
          }
        } finally {
          await closeBrowser(browser);
        }
      })
    );

    // Stitch frames with FFmpeg
    const inputPattern = path.join(tempDir, `frame-%0${padding}d.png`);
    const ffmpegArgs = [
      '-y',
      '-framerate', String(fps),
      '-i', inputPattern,
      ...getCodecArgs(codec, { crf, fps, width, height }),
      outputPath,
    ];

    await runFFmpeg(ffmpegArgs);
    return outputPath;
  } finally {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Run FFmpeg command.
 *
 * @param {string[]} args - FFmpeg arguments
 * @returns {Promise<void>}
 */
function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);

    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      // Cap stderr buffer at 10KB
      if (stderr.length > 10000) {
        stderr = stderr.slice(-10000);
      }
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed (code ${code}): ${stderr.slice(-2000)}`));
    });

    proc.on('error', reject);
  });
}

export default {
  renderVideo,
  renderVideoParallel,
  renderSequence,
  renderGif,
  mixAudio,
};
