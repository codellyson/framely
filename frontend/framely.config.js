/**
 * Framely Configuration File
 *
 * This file configures rendering, encoding, and studio settings.
 * CLI flags will override these settings.
 *
 * See documentation for all available options:
 * https://framely.dev/docs/config
 */

import { Config } from './src/lib/config';

// ─── Rendering ───────────────────────────────────────────────────────────────

/**
 * Number of parallel browser instances for rendering.
 * Default: half of available CPU cores
 */
// Config.setConcurrency(4);

/**
 * Video codec for output.
 * Options: 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores' | 'gif'
 * Default: 'h264'
 */
// Config.setCodec('h264');

/**
 * Constant Rate Factor (quality).
 * Lower = better quality, larger file. Range: 0-51
 * Default: 18 (near-lossless)
 */
// Config.setCrf(18);

/**
 * Pixel format for FFmpeg.
 * Default: 'yuv420p' (most compatible)
 */
// Config.setPixelFormat('yuv420p');

/**
 * Video bitrate (alternative to CRF).
 * Examples: '5M', '10M', '20M'
 * Default: null (use CRF instead)
 */
// Config.setVideoBitrate('10M');

/**
 * Audio codec.
 * Default: 'aac'
 */
// Config.setAudioCodec('aac');

/**
 * Audio bitrate.
 * Default: '320k'
 */
// Config.setAudioBitrate('320k');

/**
 * Scale factor for output dimensions.
 * Example: 0.5 = half resolution
 * Default: 1
 */
// Config.setScale(1);

// ─── Output ──────────────────────────────────────────────────────────────────

/**
 * Default output directory for rendered videos.
 * Default: './outputs'
 */
// Config.setOutputLocation('./outputs');

/**
 * Image format for frame captures.
 * Options: 'png' | 'jpeg'
 * Default: 'png'
 */
// Config.setImageFormat('png');

/**
 * JPEG quality (0-100) when using jpeg format.
 * Default: 80
 */
// Config.setJpegQuality(80);

// ─── Browser ─────────────────────────────────────────────────────────────────

/**
 * Custom Chrome/Chromium executable path.
 * Default: null (use Playwright's bundled browser)
 */
// Config.setBrowserExecutable('/path/to/chrome');

/**
 * Disable web security in Chrome (for CORS issues).
 * Default: false
 */
// Config.setChromiumDisableWebSecurity(false);

/**
 * Run browser in headless mode.
 * Default: true
 */
// Config.setChromiumHeadlessMode(true);

// ─── Timeouts ────────────────────────────────────────────────────────────────

/**
 * Timeout for delayRender() in milliseconds.
 * Default: 30000 (30 seconds)
 */
// Config.setDelayRenderTimeoutInMilliseconds(30000);

/**
 * Puppeteer/Playwright navigation timeout.
 * Default: 30000 (30 seconds)
 */
// Config.setPuppeteerTimeout(30000);

// ─── Studio ──────────────────────────────────────────────────────────────────

/**
 * Port for the development studio.
 * Default: 3000
 */
// Config.setStudioPort(3000);

/**
 * Port for the rendering service.
 * Default: 4000
 */
// Config.setRendererPort(4000);

/**
 * Automatically open browser when starting studio.
 * Default: true
 */
// Config.setShouldOpenBrowser(true);

/**
 * Enable keyboard shortcuts in studio.
 * Default: true
 */
// Config.setKeyboardShortcutsEnabled(true);

/**
 * Maximum tracks shown in timeline.
 * Default: 15
 */
// Config.setMaxTimelineTracks(15);

// ─── Logging ─────────────────────────────────────────────────────────────────

/**
 * Log level for console output.
 * Options: 'error' | 'warn' | 'info' | 'verbose'
 * Default: 'info'
 */
// Config.setLevel('info');

// ─── Advanced ────────────────────────────────────────────────────────────────

/**
 * Enable multiprocess rendering on Linux.
 * Default: true
 */
// Config.setEnableMultiprocessOnLinux(true);

/**
 * Hardware acceleration mode.
 * Options: 'auto' | 'on' | 'off'
 * Default: 'auto'
 */
// Config.setHardwareAcceleration('auto');

export default Config;
