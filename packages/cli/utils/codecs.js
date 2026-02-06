/**
 * Codec Configurations
 *
 * FFmpeg encoding settings for different video codecs.
 */

/**
 * Supported codec configurations.
 */
export const codecs = {
  h264: {
    name: 'H.264',
    ffmpegCodec: 'libx264',
    extension: 'mp4',
    pixelFormat: 'yuv420p',
    supportsCrf: true,
    supportsAudio: true,
    description: 'Most compatible format, good quality/size ratio',
    getArgs: (options) => [
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', options.preset || 'fast',
      '-crf', String(options.crf || 18),
      '-movflags', '+faststart',
    ],
  },

  h265: {
    name: 'H.265 (HEVC)',
    ffmpegCodec: 'libx265',
    extension: 'mp4',
    pixelFormat: 'yuv420p',
    supportsCrf: true,
    supportsAudio: true,
    description: 'Better compression than H.264, less compatible',
    getArgs: (options) => [
      '-c:v', 'libx265',
      '-pix_fmt', 'yuv420p',
      '-preset', options.preset || 'fast',
      '-crf', String(options.crf || 23),
      '-tag:v', 'hvc1', // For Apple compatibility
    ],
  },

  vp8: {
    name: 'VP8',
    ffmpegCodec: 'libvpx',
    extension: 'webm',
    pixelFormat: 'yuv420p',
    supportsCrf: true,
    supportsAudio: true,
    description: 'WebM format, good for web',
    getArgs: (options) => [
      '-c:v', 'libvpx',
      '-pix_fmt', 'yuv420p',
      '-crf', String(options.crf || 10),
      '-b:v', options.bitrate || '5M',
      '-deadline', 'good',
      '-cpu-used', '2',
    ],
  },

  vp9: {
    name: 'VP9',
    ffmpegCodec: 'libvpx-vp9',
    extension: 'webm',
    pixelFormat: 'yuv420p',
    supportsCrf: true,
    supportsAudio: true,
    description: 'WebM format, better compression than VP8',
    getArgs: (options) => [
      '-c:v', 'libvpx-vp9',
      '-pix_fmt', 'yuv420p',
      '-crf', String(options.crf || 31),
      '-b:v', '0', // Required for CRF mode
      '-deadline', 'good',
      '-cpu-used', '2',
      '-row-mt', '1',
    ],
  },

  prores: {
    name: 'ProRes',
    ffmpegCodec: 'prores_ks',
    extension: 'mov',
    pixelFormat: 'yuva444p10le',
    supportsCrf: false,
    supportsAudio: true,
    supportsAlpha: true,
    description: 'Professional editing format with alpha support',
    profiles: {
      proxy: 0,
      lt: 1,
      standard: 2,
      hq: 3,
      '4444': 4,
      '4444xq': 5,
    },
    getArgs: (options) => {
      const profile = options.profile || 'hq';
      const profileNum = codecs.prores.profiles[profile] != null ? codecs.prores.profiles[profile] : 3;
      return [
        '-c:v', 'prores_ks',
        '-profile:v', String(profileNum),
        '-pix_fmt', options.alpha ? 'yuva444p10le' : 'yuv422p10le',
        '-vendor', 'apl0',
      ];
    },
  },

  gif: {
    name: 'GIF',
    ffmpegCodec: 'gif',
    extension: 'gif',
    pixelFormat: 'rgb8',
    supportsCrf: false,
    supportsAudio: false,
    description: 'Animated GIF, limited colors',
    getArgs: (options) => {
      // GIF needs special handling with palette generation
      return [
        '-filter_complex',
        `[0:v] fps=${options.fps || 15},scale=${options.width || -1}:${options.height || -1}:flags=lanczos,split [a][b];[a] palettegen=max_colors=256:reserve_transparent=0 [p];[b][p] paletteuse=dither=sierra2_4a`,
        '-loop', String(options.loop != null ? options.loop : 0),
      ];
    },
    // GIF uses a two-pass approach for better quality
    requiresPalette: true,
  },
};

/**
 * Get configuration for a codec.
 *
 * @param {string} codecName - Codec identifier
 * @returns {object|null} Codec configuration or null
 */
export function getCodecConfig(codecName) {
  return codecs[codecName] || null;
}

/**
 * Get FFmpeg arguments for a codec.
 *
 * @param {string} codecName - Codec identifier
 * @param {object} options - Encoding options
 * @returns {string[]} FFmpeg arguments
 */
export function getCodecArgs(codecName, options = {}) {
  const config = getCodecConfig(codecName);
  if (!config) {
    throw new Error(`Unknown codec: ${codecName}`);
  }
  return config.getArgs(options);
}

/**
 * Get audio encoding arguments.
 *
 * @param {object} options
 * @param {string} [options.codec='aac'] - Audio codec
 * @param {string} [options.bitrate='320k'] - Audio bitrate
 * @param {number} [options.sampleRate=48000] - Sample rate
 * @returns {string[]} FFmpeg audio arguments
 */
export function getAudioArgs(options = {}) {
  const codec = options.codec || 'aac';
  const bitrate = options.bitrate || '320k';
  const sampleRate = options.sampleRate || 48000;

  return [
    '-c:a', codec,
    '-b:a', bitrate,
    '-ar', String(sampleRate),
  ];
}

/**
 * List all available codecs.
 *
 * @returns {Array<{ id: string, name: string, extension: string, description: string }>}
 */
export function listCodecs() {
  return Object.entries(codecs).map(([id, config]) => ({
    id,
    name: config.name,
    extension: config.extension,
    description: config.description,
    supportsAudio: config.supportsAudio,
    supportsAlpha: config.supportsAlpha || false,
  }));
}

export default {
  codecs,
  getCodecConfig,
  getCodecArgs,
  getAudioArgs,
  listCodecs,
};
