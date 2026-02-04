/**
 * Input Validation Utilities
 *
 * Validates numeric CLI options and URLs to prevent invalid configurations.
 */

import chalk from 'chalk';

/**
 * Validate CRF value (0-51).
 * @param {number} crf
 * @param {string} codec
 * @returns {number} validated CRF
 */
export function validateCrf(crf, codec) {
  if (isNaN(crf)) {
    throw new Error(`Invalid CRF value: must be a number`);
  }
  if (codec === 'prores') {
    // ProRes doesn't use CRF
    return crf;
  }
  if (crf < 0 || crf > 51) {
    throw new Error(`CRF must be between 0 and 51, got ${crf}`);
  }
  return crf;
}

/**
 * Validate port number (1024-65535).
 * @param {number|string} port
 * @returns {number} validated port
 */
export function validatePort(port) {
  const num = typeof port === 'string' ? parseInt(port, 10) : port;
  if (isNaN(num) || num < 1024 || num > 65535) {
    throw new Error(`Port must be between 1024 and 65535, got ${port}`);
  }
  return num;
}

/**
 * Validate a dimension value (positive integer).
 * @param {number|string} value
 * @param {string} name - e.g., "width" or "height"
 * @returns {number} validated dimension
 */
export function validateDimension(value, name) {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(num) || num <= 0) {
    throw new Error(`${name} must be a positive integer, got ${value}`);
  }
  if (num > 7680) {
    throw new Error(`${name} exceeds maximum of 7680, got ${num}`);
  }
  return num;
}

/**
 * Validate FPS (1-120).
 * @param {number|string} fps
 * @returns {number} validated FPS
 */
export function validateFps(fps) {
  const num = typeof fps === 'string' ? parseInt(fps, 10) : fps;
  if (isNaN(num) || num < 1 || num > 120) {
    throw new Error(`FPS must be between 1 and 120, got ${fps}`);
  }
  return num;
}

/**
 * Validate JPEG quality (0-100).
 * @param {number|string} quality
 * @returns {number} validated quality
 */
export function validateQuality(quality) {
  const num = typeof quality === 'string' ? parseInt(quality, 10) : quality;
  if (isNaN(num) || num < 0 || num > 100) {
    throw new Error(`Quality must be between 0 and 100, got ${quality}`);
  }
  return num;
}

/**
 * Validate scale factor (0.1-10).
 * @param {number|string} scale
 * @returns {number} validated scale
 */
export function validateScale(scale) {
  const num = typeof scale === 'string' ? parseFloat(scale) : scale;
  if (isNaN(num) || num < 0.1 || num > 10) {
    throw new Error(`Scale must be between 0.1 and 10, got ${scale}`);
  }
  return num;
}

/**
 * Validate a frontend URL. Must be http/https and localhost/127.0.0.1
 * unless allowRemote is true.
 * @param {string} urlStr
 * @param {boolean} [allowRemote=false]
 * @returns {string} validated URL
 */
export function validateFrontendUrl(urlStr, allowRemote = false) {
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    throw new Error(`Invalid frontend URL: ${urlStr}`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Frontend URL must use http or https, got ${parsed.protocol}`);
  }

  const localHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
  if (!allowRemote && !localHosts.includes(parsed.hostname)) {
    throw new Error(
      `Frontend URL must be localhost for security. Got ${parsed.hostname}.\n` +
        `Use --allow-remote to render from remote URLs.`
    );
  }

  if (!allowRemote && !localHosts.includes(parsed.hostname)) {
    console.warn(chalk.yellow(`Warning: Rendering from remote URL: ${urlStr}`));
  }

  return urlStr;
}

/**
 * Validate frame range (start < end).
 * @param {number} startFrame
 * @param {number} endFrame
 * @param {number} durationInFrames
 */
export function validateFrameRange(startFrame, endFrame, durationInFrames) {
  if (startFrame < 0) {
    throw new Error(`Start frame must be >= 0, got ${startFrame}`);
  }
  if (endFrame >= durationInFrames) {
    throw new Error(`End frame must be < ${durationInFrames}, got ${endFrame}`);
  }
  if (startFrame > endFrame) {
    throw new Error(`Start frame (${startFrame}) must be <= end frame (${endFrame})`);
  }
}
