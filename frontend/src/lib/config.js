/**
 * Framely Configuration System
 *
 * Manages configuration for rendering, encoding, and studio behavior.
 * Configuration can be set via:
 * - framely.config.js file
 * - Environment variables
 * - CLI flags (highest priority)
 */

// Default configuration values
const defaultConfig = {
  // Rendering
  concurrency: Math.max(1, Math.floor((navigator?.hardwareConcurrency || 4) / 2)),
  codec: 'h264',
  pixelFormat: 'yuv420p',
  crf: 18,
  videoBitrate: null,
  audioBitrate: '320k',
  audioCodec: 'aac',
  scale: 1,

  // Output
  outputLocation: './outputs',
  imageFormat: 'png',
  jpegQuality: 80,

  // Browser
  browserExecutable: null,
  chromiumDisableWebSecurity: false,
  headless: true,

  // Timeouts
  delayRenderTimeout: 30000,
  puppeteerTimeout: 30000,

  // Studio
  studioPort: 3000,
  rendererPort: 4000,
  openBrowser: true,
  keyboardShortcutsEnabled: true,
  maxTimelineTracks: 15,

  // Logging
  logLevel: 'info', // 'error' | 'warn' | 'info' | 'verbose'

  // Advanced
  enableMultiprocessOnLinux: true,
  hardwareAcceleration: 'auto', // 'auto' | 'on' | 'off'
};

// Current configuration (merged defaults + user config)
let currentConfig = { ...defaultConfig };

/**
 * Set a configuration value.
 * @param {string} key - Configuration key
 * @param {*} value - Configuration value
 */
function setConfig(key, value) {
  if (key in defaultConfig) {
    currentConfig[key] = value;
  } else {
    console.warn(`Unknown config key: ${key}`);
  }
}

/**
 * Configuration setters (Remotion-compatible API)
 */
export const Config = {
  // Rendering
  setConcurrency: (n) => setConfig('concurrency', n),
  setCodec: (codec) => setConfig('codec', codec),
  setPixelFormat: (format) => setConfig('pixelFormat', format),
  setCrf: (crf) => setConfig('crf', crf),
  setVideoBitrate: (bitrate) => setConfig('videoBitrate', bitrate),
  setAudioBitrate: (bitrate) => setConfig('audioBitrate', bitrate),
  setAudioCodec: (codec) => setConfig('audioCodec', codec),
  setScale: (scale) => setConfig('scale', scale),

  // Output
  setOutputLocation: (path) => setConfig('outputLocation', path),
  setImageFormat: (format) => setConfig('imageFormat', format),
  setJpegQuality: (quality) => setConfig('jpegQuality', quality),

  // Browser
  setBrowserExecutable: (path) => setConfig('browserExecutable', path),
  setChromiumDisableWebSecurity: (disable) => setConfig('chromiumDisableWebSecurity', disable),
  setChromiumHeadlessMode: (headless) => setConfig('headless', headless),

  // Timeouts
  setDelayRenderTimeoutInMilliseconds: (ms) => setConfig('delayRenderTimeout', ms),
  setPuppeteerTimeout: (ms) => setConfig('puppeteerTimeout', ms),

  // Studio
  setStudioPort: (port) => setConfig('studioPort', port),
  setRendererPort: (port) => setConfig('rendererPort', port),
  setShouldOpenBrowser: (open) => setConfig('openBrowser', open),
  setKeyboardShortcutsEnabled: (enabled) => setConfig('keyboardShortcutsEnabled', enabled),
  setMaxTimelineTracks: (max) => setConfig('maxTimelineTracks', max),

  // Logging
  setLevel: (level) => setConfig('logLevel', level),

  // Advanced
  setEnableMultiprocessOnLinux: (enable) => setConfig('enableMultiprocessOnLinux', enable),
  setHardwareAcceleration: (mode) => setConfig('hardwareAcceleration', mode),

  // Bulk configuration
  setAll: (config) => {
    Object.entries(config).forEach(([key, value]) => {
      setConfig(key, value);
    });
  },
};

/**
 * Get the current configuration.
 * @returns {object} Current configuration object
 */
export function getConfig() {
  return { ...currentConfig };
}

/**
 * Get a specific configuration value.
 * @param {string} key - Configuration key
 * @returns {*} Configuration value
 */
export function getConfigValue(key) {
  return currentConfig[key];
}

/**
 * Reset configuration to defaults.
 */
export function resetConfig() {
  currentConfig = { ...defaultConfig };
}

/**
 * Load configuration from an object (used by config file loader).
 * @param {object} config - Configuration object
 */
export function loadConfig(config) {
  currentConfig = { ...defaultConfig, ...config };
}

/**
 * Get FFmpeg arguments based on current config.
 * @param {object} [overrides] - Override specific settings
 * @returns {string[]} FFmpeg arguments array
 */
export function getFfmpegArgs(overrides = {}) {
  const config = { ...currentConfig, ...overrides };
  const args = [];

  // Codec-specific settings
  const codecSettings = {
    h264: {
      codec: 'libx264',
      ext: 'mp4',
      pixelFormat: config.pixelFormat || 'yuv420p',
    },
    h265: {
      codec: 'libx265',
      ext: 'mp4',
      pixelFormat: config.pixelFormat || 'yuv420p',
    },
    vp8: {
      codec: 'libvpx',
      ext: 'webm',
      pixelFormat: config.pixelFormat || 'yuv420p',
    },
    vp9: {
      codec: 'libvpx-vp9',
      ext: 'webm',
      pixelFormat: config.pixelFormat || 'yuv420p',
    },
    prores: {
      codec: 'prores_ks',
      ext: 'mov',
      pixelFormat: 'yuva444p10le',
    },
    gif: {
      codec: 'gif',
      ext: 'gif',
      pixelFormat: 'rgb8',
    },
  };

  const settings = codecSettings[config.codec] || codecSettings.h264;

  // Video codec
  args.push('-c:v', settings.codec);

  // Pixel format
  args.push('-pix_fmt', settings.pixelFormat);

  // Quality (CRF or bitrate)
  if (config.videoBitrate) {
    args.push('-b:v', config.videoBitrate);
  } else if (config.crf !== null && config.codec !== 'gif') {
    args.push('-crf', String(config.crf));
  }

  // Audio codec
  if (config.audioCodec) {
    args.push('-c:a', config.audioCodec);
  }

  // Audio bitrate
  if (config.audioBitrate) {
    args.push('-b:a', config.audioBitrate);
  }

  return args;
}

/**
 * Get the file extension for the current codec.
 * @returns {string} File extension (e.g., 'mp4', 'webm')
 */
export function getOutputExtension() {
  const extensions = {
    h264: 'mp4',
    h265: 'mp4',
    vp8: 'webm',
    vp9: 'webm',
    prores: 'mov',
    gif: 'gif',
  };
  return extensions[currentConfig.codec] || 'mp4';
}

/**
 * Validate configuration values.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateConfig() {
  const errors = [];

  if (currentConfig.concurrency < 1) {
    errors.push('concurrency must be at least 1');
  }

  if (currentConfig.crf !== null && (currentConfig.crf < 0 || currentConfig.crf > 51)) {
    errors.push('crf must be between 0 and 51');
  }

  if (currentConfig.scale <= 0) {
    errors.push('scale must be positive');
  }

  if (currentConfig.jpegQuality < 0 || currentConfig.jpegQuality > 100) {
    errors.push('jpegQuality must be between 0 and 100');
  }

  const validCodecs = ['h264', 'h265', 'vp8', 'vp9', 'prores', 'gif'];
  if (!validCodecs.includes(currentConfig.codec)) {
    errors.push(`codec must be one of: ${validCodecs.join(', ')}`);
  }

  const validLogLevels = ['error', 'warn', 'info', 'verbose'];
  if (!validLogLevels.includes(currentConfig.logLevel)) {
    errors.push(`logLevel must be one of: ${validLogLevels.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Expose config globally for the renderer
if (typeof window !== 'undefined') {
  window.__FRAMELY_CONFIG = currentConfig;
}

export default Config;
