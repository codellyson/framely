/**
 * Codec Configurations for Backend Renderer
 *
 * Defines FFmpeg encoding settings for all supported video codecs.
 */

/**
 * Codec configuration definitions.
 */
export const codecs = {
  h264: {
    name: 'H.264 / AVC',
    ffmpegCodec: 'libx264',
    extension: 'mp4',
    pixelFormat: 'yuv420p',
    supportsCrf: true,
    supportsAudio: true,
    minCrf: 0,
    maxCrf: 51,
    defaultCrf: 18,
  },

  h265: {
    name: 'H.265 / HEVC',
    ffmpegCodec: 'libx265',
    extension: 'mp4',
    pixelFormat: 'yuv420p',
    supportsCrf: true,
    supportsAudio: true,
    minCrf: 0,
    maxCrf: 51,
    defaultCrf: 23,
  },

  vp8: {
    name: 'VP8',
    ffmpegCodec: 'libvpx',
    extension: 'webm',
    pixelFormat: 'yuv420p',
    supportsCrf: true,
    supportsAudio: true,
    minCrf: 4,
    maxCrf: 63,
    defaultCrf: 10,
  },

  vp9: {
    name: 'VP9',
    ffmpegCodec: 'libvpx-vp9',
    extension: 'webm',
    pixelFormat: 'yuv420p',
    supportsCrf: true,
    supportsAudio: true,
    minCrf: 0,
    maxCrf: 63,
    defaultCrf: 31,
  },

  prores: {
    name: 'Apple ProRes',
    ffmpegCodec: 'prores_ks',
    extension: 'mov',
    pixelFormat: 'yuva444p10le',
    supportsCrf: false,
    supportsAudio: true,
    supportsAlpha: true,
  },

  gif: {
    name: 'GIF',
    ffmpegCodec: 'gif',
    extension: 'gif',
    pixelFormat: 'rgb8',
    supportsCrf: false,
    supportsAudio: false,
    maxColors: 256,
  },
};

/**
 * ProRes profile levels.
 */
export const proresProfiles = {
  proxy: { value: 0, name: 'Proxy' },
  lt: { value: 1, name: 'LT' },
  standard: { value: 2, name: 'Standard' },
  hq: { value: 3, name: 'HQ' },
  '4444': { value: 4, name: '4444' },
  '4444xq': { value: 5, name: '4444 XQ' },
};

/**
 * Get codec configuration by name.
 *
 * @param {string} codecName
 * @returns {object|null}
 */
export function getCodec(codecName) {
  return codecs[codecName] || null;
}

/**
 * Get FFmpeg arguments for encoding with a specific codec.
 *
 * @param {string} codecName - Codec identifier
 * @param {object} options - Encoding options
 * @returns {string[]} FFmpeg arguments
 */
export function getEncodingArgs(codecName, options = {}) {
  const codec = getCodec(codecName);
  if (!codec) {
    throw new Error(`Unknown codec: ${codecName}`);
  }

  const args = [];
  const {
    crf,
    bitrate,
    preset = 'fast',
    profile,
    fps,
    width,
    height,
  } = options;

  switch (codecName) {
    case 'h264':
      args.push('-c:v', 'libx264');
      args.push('-pix_fmt', 'yuv420p');
      args.push('-preset', preset);
      if (bitrate) {
        args.push('-b:v', bitrate);
      } else {
        args.push('-crf', String(crf ?? codec.defaultCrf));
      }
      args.push('-movflags', '+faststart');
      break;

    case 'h265':
      args.push('-c:v', 'libx265');
      args.push('-pix_fmt', 'yuv420p');
      args.push('-preset', preset);
      if (bitrate) {
        args.push('-b:v', bitrate);
      } else {
        args.push('-crf', String(crf ?? codec.defaultCrf));
      }
      args.push('-tag:v', 'hvc1');
      break;

    case 'vp8':
      args.push('-c:v', 'libvpx');
      args.push('-pix_fmt', 'yuv420p');
      args.push('-crf', String(crf ?? codec.defaultCrf));
      args.push('-b:v', bitrate || '5M');
      args.push('-deadline', 'good');
      args.push('-cpu-used', '2');
      break;

    case 'vp9':
      args.push('-c:v', 'libvpx-vp9');
      args.push('-pix_fmt', 'yuv420p');
      args.push('-crf', String(crf ?? codec.defaultCrf));
      args.push('-b:v', '0');
      args.push('-deadline', 'good');
      args.push('-cpu-used', '2');
      args.push('-row-mt', '1');
      break;

    case 'prores':
      args.push('-c:v', 'prores_ks');
      const proresProfile = proresProfiles[profile] || proresProfiles.hq;
      args.push('-profile:v', String(proresProfile.value));
      args.push('-pix_fmt', options.alpha ? 'yuva444p10le' : 'yuv422p10le');
      args.push('-vendor', 'apl0');
      break;

    case 'gif':
      // GIF requires special filter chain for palette
      args.push('-filter_complex',
        `fps=${fps || 15},scale=${width || -1}:${height || -1}:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256[p];[s1][p]paletteuse=dither=sierra2_4a`
      );
      args.push('-loop', String(options.loop ?? 0));
      break;
  }

  return args;
}

/**
 * Get audio encoding arguments.
 *
 * @param {object} options
 * @returns {string[]}
 */
export function getAudioEncodingArgs(options = {}) {
  const {
    codec = 'aac',
    bitrate = '320k',
    sampleRate = 48000,
    channels = 2,
  } = options;

  return [
    '-c:a', codec,
    '-b:a', bitrate,
    '-ar', String(sampleRate),
    '-ac', String(channels),
  ];
}

/**
 * Get file extension for a codec.
 *
 * @param {string} codecName
 * @returns {string}
 */
export function getExtension(codecName) {
  const codec = getCodec(codecName);
  return codec?.extension || 'mp4';
}

/**
 * List all available codecs with their properties.
 *
 * @returns {Array}
 */
export function listCodecs() {
  return Object.entries(codecs).map(([id, config]) => ({
    id,
    ...config,
  }));
}

/**
 * Validate CRF value for a codec.
 *
 * @param {string} codecName
 * @param {number} crf
 * @returns {{ valid: boolean, clamped: number }}
 */
export function validateCrf(codecName, crf) {
  const codec = getCodec(codecName);
  if (!codec || !codec.supportsCrf) {
    return { valid: false, clamped: crf };
  }

  const clamped = Math.max(codec.minCrf, Math.min(codec.maxCrf, crf));
  return {
    valid: crf >= codec.minCrf && crf <= codec.maxCrf,
    clamped,
  };
}

export default {
  codecs,
  proresProfiles,
  getCodec,
  getEncodingArgs,
  getAudioEncodingArgs,
  getExtension,
  listCodecs,
  validateCrf,
};
