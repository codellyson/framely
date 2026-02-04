/**
 * Framely Configuration System
 *
 * Manages configuration for rendering, encoding, and studio behavior.
 * Configuration can be set via:
 * - framely.config.js file
 * - Environment variables
 * - CLI flags (highest priority)
 */

/** Supported video codecs. */
export type Codec = 'h264' | 'h265' | 'vp8' | 'vp9' | 'prores' | 'gif';

/** Supported log levels. */
export type LogLevel = 'error' | 'warn' | 'info' | 'verbose';

/** Supported image output formats. */
export type ImageFormat = 'png' | 'jpeg';

/** Supported pixel formats. */
export type PixelFormat = 'yuv420p' | 'yuva444p10le' | 'rgb8';

/** Hardware acceleration mode. */
export type HardwareAcceleration = 'auto' | 'on' | 'off';

/** Audio codec identifier. */
export type AudioCodec = 'aac' | string;

/** The full Framely configuration shape. */
export interface FramelyConfig {
  // Rendering
  concurrency: number;
  codec: Codec;
  pixelFormat: PixelFormat;
  crf: number | null;
  videoBitrate: string | null;
  audioBitrate: string;
  audioCodec: AudioCodec;
  scale: number;

  // Output
  outputLocation: string;
  imageFormat: ImageFormat;
  jpegQuality: number;

  // Browser
  browserExecutable: string | null;
  chromiumDisableWebSecurity: boolean;
  headless: boolean;

  // Timeouts
  delayRenderTimeout: number;
  puppeteerTimeout: number;

  // Studio
  studioPort: number;
  rendererPort: number;
  openBrowser: boolean;
  keyboardShortcutsEnabled: boolean;
  maxTimelineTracks: number;

  // Logging
  logLevel: LogLevel;

  // Advanced
  enableMultiprocessOnLinux: boolean;
  hardwareAcceleration: HardwareAcceleration;
}

/** Codec-specific FFmpeg settings. */
interface CodecSettings {
  codec: string;
  ext: string;
  pixelFormat: string;
}

/** Validation result returned by {@link validateConfig}. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Remotion-compatible configuration setter API. */
export interface ConfigSetter {
  // Rendering
  setConcurrency: (n: number) => void;
  setCodec: (codec: Codec) => void;
  setPixelFormat: (format: PixelFormat) => void;
  setCrf: (crf: number | null) => void;
  setVideoBitrate: (bitrate: string | null) => void;
  setAudioBitrate: (bitrate: string) => void;
  setAudioCodec: (codec: AudioCodec) => void;
  setScale: (scale: number) => void;

  // Output
  setOutputLocation: (path: string) => void;
  setImageFormat: (format: ImageFormat) => void;
  setJpegQuality: (quality: number) => void;

  // Browser
  setBrowserExecutable: (path: string | null) => void;
  setChromiumDisableWebSecurity: (disable: boolean) => void;
  setChromiumHeadlessMode: (headless: boolean) => void;

  // Timeouts
  setDelayRenderTimeoutInMilliseconds: (ms: number) => void;
  setPuppeteerTimeout: (ms: number) => void;

  // Studio
  setStudioPort: (port: number) => void;
  setRendererPort: (port: number) => void;
  setShouldOpenBrowser: (open: boolean) => void;
  setKeyboardShortcutsEnabled: (enabled: boolean) => void;
  setMaxTimelineTracks: (max: number) => void;

  // Logging
  setLevel: (level: LogLevel) => void;

  // Advanced
  setEnableMultiprocessOnLinux: (enable: boolean) => void;
  setHardwareAcceleration: (mode: HardwareAcceleration) => void;

  // Bulk configuration
  setAll: (config: Partial<FramelyConfig>) => void;
}

// Augment the global Window interface so the renderer property is typed.
declare global {
  interface Window {
    __FRAMELY_CONFIG: FramelyConfig;
  }
}

// Default configuration values
const defaultConfig: FramelyConfig = {
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
let currentConfig: FramelyConfig = { ...defaultConfig };

/**
 * Set a configuration value.
 * @param {string} key - Configuration key
 * @param {*} value - Configuration value
 */
function setConfig<K extends keyof FramelyConfig>(key: K, value: FramelyConfig[K]): void {
  if (key in defaultConfig) {
    currentConfig[key] = value;
  } else {
    console.warn(`Unknown config key: ${key}`);
  }
}

/**
 * Configuration setters (Remotion-compatible API)
 */
export const Config: ConfigSetter = {
  // Rendering
  setConcurrency: (n: number): void => setConfig('concurrency', n),
  setCodec: (codec: Codec): void => setConfig('codec', codec),
  setPixelFormat: (format: PixelFormat): void => setConfig('pixelFormat', format),
  setCrf: (crf: number | null): void => setConfig('crf', crf),
  setVideoBitrate: (bitrate: string | null): void => setConfig('videoBitrate', bitrate),
  setAudioBitrate: (bitrate: string): void => setConfig('audioBitrate', bitrate),
  setAudioCodec: (codec: AudioCodec): void => setConfig('audioCodec', codec),
  setScale: (scale: number): void => setConfig('scale', scale),

  // Output
  setOutputLocation: (path: string): void => setConfig('outputLocation', path),
  setImageFormat: (format: ImageFormat): void => setConfig('imageFormat', format),
  setJpegQuality: (quality: number): void => setConfig('jpegQuality', quality),

  // Browser
  setBrowserExecutable: (path: string | null): void => setConfig('browserExecutable', path),
  setChromiumDisableWebSecurity: (disable: boolean): void => setConfig('chromiumDisableWebSecurity', disable),
  setChromiumHeadlessMode: (headless: boolean): void => setConfig('headless', headless),

  // Timeouts
  setDelayRenderTimeoutInMilliseconds: (ms: number): void => setConfig('delayRenderTimeout', ms),
  setPuppeteerTimeout: (ms: number): void => setConfig('puppeteerTimeout', ms),

  // Studio
  setStudioPort: (port: number): void => setConfig('studioPort', port),
  setRendererPort: (port: number): void => setConfig('rendererPort', port),
  setShouldOpenBrowser: (open: boolean): void => setConfig('openBrowser', open),
  setKeyboardShortcutsEnabled: (enabled: boolean): void => setConfig('keyboardShortcutsEnabled', enabled),
  setMaxTimelineTracks: (max: number): void => setConfig('maxTimelineTracks', max),

  // Logging
  setLevel: (level: LogLevel): void => setConfig('logLevel', level),

  // Advanced
  setEnableMultiprocessOnLinux: (enable: boolean): void => setConfig('enableMultiprocessOnLinux', enable),
  setHardwareAcceleration: (mode: HardwareAcceleration): void => setConfig('hardwareAcceleration', mode),

  // Bulk configuration
  setAll: (config: Partial<FramelyConfig>): void => {
    (Object.entries(config) as [keyof FramelyConfig, FramelyConfig[keyof FramelyConfig]][]).forEach(
      ([key, value]) => {
        setConfig(key, value as FramelyConfig[typeof key]);
      },
    );
  },
};

/**
 * Get the current configuration.
 * @returns {object} Current configuration object
 */
export function getConfig(): FramelyConfig {
  return { ...currentConfig };
}

/**
 * Get a specific configuration value.
 * @param {string} key - Configuration key
 * @returns {*} Configuration value
 */
export function getConfigValue<K extends keyof FramelyConfig>(key: K): FramelyConfig[K] {
  return currentConfig[key];
}

/**
 * Reset configuration to defaults.
 */
export function resetConfig(): void {
  currentConfig = { ...defaultConfig };
}

/**
 * Load configuration from an object (used by config file loader).
 * @param {object} config - Configuration object
 */
export function loadConfig(config: Partial<FramelyConfig>): void {
  currentConfig = { ...defaultConfig, ...config };
}

/**
 * Get FFmpeg arguments based on current config.
 * @param {object} [overrides] - Override specific settings
 * @returns {string[]} FFmpeg arguments array
 */
export function getFfmpegArgs(overrides: Partial<FramelyConfig> = {}): string[] {
  const config: FramelyConfig = { ...currentConfig, ...overrides };
  const args: string[] = [];

  // Codec-specific settings
  const codecSettings: Record<Codec, CodecSettings> = {
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

  const settings: CodecSettings = codecSettings[config.codec] || codecSettings.h264;

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
export function getOutputExtension(): string {
  const extensions: Record<Codec, string> = {
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
export function validateConfig(): ValidationResult {
  const errors: string[] = [];

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

  const validCodecs: Codec[] = ['h264', 'h265', 'vp8', 'vp9', 'prores', 'gif'];
  if (!validCodecs.includes(currentConfig.codec)) {
    errors.push(`codec must be one of: ${validCodecs.join(', ')}`);
  }

  const validLogLevels: LogLevel[] = ['error', 'warn', 'info', 'verbose'];
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
