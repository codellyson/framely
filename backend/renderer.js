import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getEncodingArgs, getExtension, getCodec } from './codecs.js';
import {
  extractAudioTracks,
  downloadAudio,
  mixAudioTracks,
  muxVideoAudio,
} from './audio.js';

/**
 * Default browser launch arguments for rendering.
 */
const BROWSER_ARGS = [
  '--disable-web-security',
  '--disable-features=IsolateOrigins',
  '--disable-site-isolation-trials',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--autoplay-policy=no-user-gesture-required',
];

/**
 * Renders a composition to a video file.
 *
 * Strategy:
 *   1. Launch headless Chromium via Playwright
 *   2. Navigate to the frontend in render mode
 *   3. For each frame: call window.__setFrame(n), screenshot
 *   4. Pipe raw screenshot data directly into FFmpeg (no temp files)
 *   5. FFmpeg encodes to the specified codec
 *   6. Extract and mix audio tracks
 *   7. Mux video and audio into final output
 *
 * @param {object} options
 * @returns {Promise<string>} Path to the output video file
 */
export async function renderComposition({
  compositionId,
  width = 1920,
  height = 1080,
  fps = 30,
  durationInFrames = 300,
  startFrame = 0,
  endFrame,
  frontendUrl = 'http://localhost:3000',
  outputDir = './outputs',
  outputPath: customOutputPath,
  codec = 'h264',
  crf = 18,
  bitrate,
  preset = 'fast',
  scale = 1,
  inputProps = {},
  muted = false,
  imageSequence = false,
  imageFormat = 'png',
  imageQuality = 80,
  onProgress,
  onLog,
}) {
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Calculate actual end frame
  const actualEndFrame = endFrame ?? durationInFrames - 1;
  const totalFrames = actualEndFrame - startFrame + 1;

  // Determine output path
  const timestamp = Date.now();
  const ext = imageSequence ? '' : getExtension(codec);
  const outputPath = customOutputPath || path.join(
    outputDir,
    imageSequence
      ? `${compositionId}-${timestamp}`
      : `${compositionId}-${timestamp}.${ext}`
  );

  // Scale dimensions
  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);

  // Temp directory for intermediate files
  const tempDir = path.join(outputDir, `.framely-temp-${timestamp}`);
  fs.mkdirSync(tempDir, { recursive: true });

  let browser;
  let ffmpegProcess;

  try {
    // ─── 1. Launch Browser ───
    log(onLog, 'Launching browser...');
    browser = await chromium.launch({ args: BROWSER_ARGS });

    const context = await browser.newContext({
      viewport: { width: scaledWidth, height: scaledHeight },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    // ─── 2. Navigate and wait for app to be ready ───
    const renderUrl = buildRenderUrl(frontendUrl, compositionId, inputProps);
    log(onLog, `Loading: ${renderUrl}`);
    await page.goto(renderUrl, { waitUntil: 'networkidle' });

    // Wait for the React app to expose window.__ready
    await page.waitForFunction('window.__ready === true', { timeout: 30000 });
    log(onLog, 'App ready, starting frame capture...');

    // ─── 3. Extract audio tracks ───
    let audioTracks = [];
    const codecConfig = getCodec(codec);
    if (!muted && codecConfig?.supportsAudio) {
      log(onLog, 'Extracting audio tracks...');
      audioTracks = await extractAudioTracks(page);
      log(onLog, `Found ${audioTracks.length} audio track(s)`);
    }

    // ─── 4. Handle image sequence output ───
    if (imageSequence) {
      fs.mkdirSync(outputPath, { recursive: true });
      const padding = String(actualEndFrame).length;
      const imgExt = imageFormat === 'jpeg' ? 'jpg' : imageFormat;

      for (let frame = startFrame; frame <= actualEndFrame; frame++) {
        await setFrameAndWait(page, frame);

        const frameNum = String(frame).padStart(padding, '0');
        const framePath = path.join(outputPath, `frame-${frameNum}.${imgExt}`);

        const element = page.locator('#render-container');
        const screenshotOptions = { type: imageFormat, path: framePath };
        if (imageFormat === 'jpeg') {
          screenshotOptions.quality = imageQuality;
        }

        await element.screenshot(screenshotOptions);
        onProgress?.(frame - startFrame + 1, totalFrames);
      }

      await browser.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
      return outputPath;
    }

    // ─── 5. Start FFmpeg process for video ───
    const videoTempPath = path.join(tempDir, `video.${ext}`);
    const ffmpegArgs = [
      '-y',
      '-f', 'image2pipe',
      '-framerate', String(fps),
      '-i', '-',
      ...getEncodingArgs(codec, { crf, bitrate, preset, fps, width: scaledWidth, height: scaledHeight }),
    ];

    // For GIF, we need different handling
    if (codec === 'gif') {
      // GIF will be processed separately with palette
      ffmpegArgs.length = 0;
      ffmpegArgs.push(
        '-y',
        '-f', 'image2pipe',
        '-framerate', String(fps),
        '-i', '-',
        '-c:v', 'png',
      );
      ffmpegArgs.push(path.join(tempDir, 'frames.mkv'));
    } else {
      ffmpegArgs.push(videoTempPath);
    }

    ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

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

    // ─── 6. Capture each frame ───
    log(onLog, `Rendering ${totalFrames} frames...`);
    for (let frame = startFrame; frame <= actualEndFrame; frame++) {
      await setFrameAndWait(page, frame);

      const element = page.locator('#render-container');
      const screenshot = await element.screenshot({ type: 'png' });

      const canWrite = ffmpegProcess.stdin.write(screenshot);
      if (!canWrite) {
        await new Promise((resolve) => ffmpegProcess.stdin.once('drain', resolve));
      }

      onProgress?.(frame - startFrame + 1, totalFrames);
    }

    ffmpegProcess.stdin.end();
    await ffmpegDone;

    // ─── 7. Handle GIF with palette optimization ───
    if (codec === 'gif') {
      log(onLog, 'Generating GIF with palette optimization...');
      const framesMkv = path.join(tempDir, 'frames.mkv');
      const palettePath = path.join(tempDir, 'palette.png');

      // Generate palette
      await runFFmpeg([
        '-i', framesMkv,
        '-vf', `fps=${fps},scale=${scaledWidth}:${scaledHeight}:flags=lanczos,palettegen=max_colors=256`,
        '-y', palettePath,
      ]);

      // Create GIF using palette
      await runFFmpeg([
        '-i', framesMkv,
        '-i', palettePath,
        '-lavfi', `fps=${fps},scale=${scaledWidth}:${scaledHeight}:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a`,
        '-loop', '0',
        '-y', outputPath,
      ]);

      await browser.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
      return outputPath;
    }

    // ─── 8. Process and mix audio ───
    if (!muted && audioTracks.length > 0) {
      log(onLog, 'Processing audio...');
      const processedTracks = [];

      for (let i = 0; i < audioTracks.length; i++) {
        const track = audioTracks[i];
        const localPath = await downloadAudio(track.src, tempDir, i);
        processedTracks.push({
          path: localPath,
          delayMs: (track.startFrame / fps) * 1000,
          volume: track.volume,
        });
      }

      const audioPath = path.join(tempDir, 'audio.aac');
      const durationMs = (totalFrames / fps) * 1000;
      await mixAudioTracks(processedTracks, audioPath, durationMs);

      log(onLog, 'Muxing video and audio...');
      await muxVideoAudio(videoTempPath, audioPath, outputPath);
    } else {
      // No audio - just rename/copy video
      fs.renameSync(videoTempPath, outputPath);
    }

    // ─── 9. Cleanup ───
    fs.rmSync(tempDir, { recursive: true, force: true });

    return outputPath;
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Render a single frame as an image.
 *
 * @param {object} options
 * @returns {Promise<string>} Path to the output image
 */
export async function renderStill({
  compositionId,
  frame = 0,
  width = 1920,
  height = 1080,
  frontendUrl = 'http://localhost:3000',
  outputDir = './outputs',
  outputPath: customOutputPath,
  format = 'png',
  quality = 80,
  scale = 1,
  inputProps = {},
  onLog,
}) {
  fs.mkdirSync(outputDir, { recursive: true });

  const ext = format === 'jpeg' ? 'jpg' : format;
  const timestamp = Date.now();
  const outputPath = customOutputPath || path.join(outputDir, `${compositionId}-frame${frame}-${timestamp}.${ext}`);

  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);

  let browser;

  try {
    log(onLog, 'Launching browser...');
    browser = await chromium.launch({ args: BROWSER_ARGS });

    const context = await browser.newContext({
      viewport: { width: scaledWidth, height: scaledHeight },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    const renderUrl = buildRenderUrl(frontendUrl, compositionId, inputProps);
    log(onLog, `Loading: ${renderUrl}`);
    await page.goto(renderUrl, { waitUntil: 'networkidle' });

    await page.waitForFunction('window.__ready === true', { timeout: 30000 });

    log(onLog, `Capturing frame ${frame}...`);
    await setFrameAndWait(page, frame);

    const element = page.locator('#render-container');
    const screenshotOptions = { type: format, path: outputPath };
    if (format === 'jpeg') {
      screenshotOptions.quality = quality;
    }

    await element.screenshot(screenshotOptions);

    return outputPath;
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Render using parallel workers for speed.
 *
 * @param {object} options
 * @returns {Promise<string>} Path to the output video file
 */
export async function renderParallel({
  compositionId,
  width = 1920,
  height = 1080,
  fps = 30,
  durationInFrames = 300,
  startFrame = 0,
  endFrame,
  frontendUrl = 'http://localhost:3000',
  outputDir = './outputs',
  codec = 'h264',
  crf = 18,
  concurrency = 4,
  inputProps = {},
  muted = false,
  onProgress,
  onLog,
}) {
  fs.mkdirSync(outputDir, { recursive: true });

  const actualEndFrame = endFrame ?? durationInFrames - 1;
  const totalFrames = actualEndFrame - startFrame + 1;
  const timestamp = Date.now();
  const tempDir = path.join(outputDir, `.framely-parallel-${timestamp}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const ext = getExtension(codec);
  const outputPath = path.join(outputDir, `${compositionId}-${timestamp}.${ext}`);

  let completedFrames = 0;

  try {
    // Split frames into chunks
    const framesPerWorker = Math.ceil(totalFrames / concurrency);
    const chunks = [];

    for (let i = 0; i < concurrency; i++) {
      const chunkStart = startFrame + i * framesPerWorker;
      const chunkEnd = Math.min(chunkStart + framesPerWorker - 1, actualEndFrame);
      if (chunkStart <= actualEndFrame) {
        chunks.push({ start: chunkStart, end: chunkEnd, index: i });
      }
    }

    log(onLog, `Rendering with ${chunks.length} parallel workers...`);

    // Launch browsers in parallel
    const renderPromises = chunks.map(async (chunk) => {
      const chunkDir = path.join(tempDir, `chunk-${chunk.index}`);
      fs.mkdirSync(chunkDir, { recursive: true });

      const browser = await chromium.launch({ args: BROWSER_ARGS });
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      const renderUrl = buildRenderUrl(frontendUrl, compositionId, inputProps);
      await page.goto(renderUrl, { waitUntil: 'networkidle' });
      await page.waitForFunction('window.__ready === true', { timeout: 30000 });

      const padding = String(actualEndFrame).length;

      for (let frame = chunk.start; frame <= chunk.end; frame++) {
        await setFrameAndWait(page, frame);

        const frameNum = String(frame).padStart(padding, '0');
        const framePath = path.join(chunkDir, `frame-${frameNum}.png`);

        const element = page.locator('#render-container');
        await element.screenshot({ type: 'png', path: framePath });

        completedFrames++;
        onProgress?.(completedFrames, totalFrames);
      }

      await browser.close();
      return chunkDir;
    });

    await Promise.all(renderPromises);

    // Combine all frames and encode
    log(onLog, 'Combining frames...');
    const padding = String(actualEndFrame).length;

    // Use glob pattern for FFmpeg input
    const inputPattern = path.join(tempDir, 'chunk-%d', `frame-%0${padding}d.png`);

    // Create a file list for proper ordering
    const fileListPath = path.join(tempDir, 'files.txt');
    const fileList = [];
    for (let frame = startFrame; frame <= actualEndFrame; frame++) {
      const chunkIndex = Math.min(Math.floor((frame - startFrame) / framesPerWorker), chunks.length - 1);
      const frameNum = String(frame).padStart(padding, '0');
      const framePath = path.join(tempDir, `chunk-${chunkIndex}`, `frame-${frameNum}.png`);
      fileList.push(`file '${framePath}'`);
    }
    fs.writeFileSync(fileListPath, fileList.join('\n'));

    const ffmpegArgs = [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-r', String(fps),
      '-i', fileListPath,
      ...getEncodingArgs(codec, { crf, fps, width, height }),
      outputPath,
    ];

    await runFFmpeg(ffmpegArgs);

    return outputPath;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Build render URL with composition ID and props.
 */
function buildRenderUrl(baseUrl, compositionId, props = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set('renderMode', 'true');
  url.searchParams.set('composition', compositionId);
  if (Object.keys(props).length > 0) {
    url.searchParams.set('props', encodeURIComponent(JSON.stringify(props)));
  }
  return url.toString();
}

/**
 * Set frame and wait for delayRenders to complete.
 */
async function setFrameAndWait(page, frame) {
  await page.evaluate((f) => window.__setFrame(f), frame);

  // Wait for any delayRender handles
  try {
    await page.waitForFunction(
      () => {
        const dr = window.__FRAMELY_DELAY_RENDER;
        return !dr || dr.pendingCount === 0;
      },
      { timeout: 30000 }
    );
  } catch {
    // Continue even if delayRender check times out
  }

  // Small settle time for complex renders
  await page.waitForTimeout(16);
}

/**
 * Run FFmpeg command.
 */
function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const process = spawn('ffmpeg', args);

    let stderr = '';
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg failed (code ${code}): ${stderr.slice(-500)}`));
    });

    process.on('error', reject);
  });
}

/**
 * Log helper.
 */
function log(onLog, message) {
  if (onLog) {
    onLog(message);
  } else {
    console.log(`   ${message}`);
  }
}
