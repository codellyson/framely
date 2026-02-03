/**
 * Audio Processing for Framely Renderer
 *
 * Handles audio extraction, mixing, and encoding for video renders.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getAudioEncodingArgs } from './codecs.js';

/**
 * Audio track information extracted from composition.
 * @typedef {object} AudioTrack
 * @property {string} src - Audio source path or URL
 * @property {number} startFrame - Frame where audio starts
 * @property {number} [endFrame] - Frame where audio ends (optional)
 * @property {number|function} volume - Volume level (0-1) or callback
 * @property {number} [playbackRate=1] - Playback speed
 * @property {boolean} [loop=false] - Whether audio loops
 * @property {boolean} [muted=false] - Whether audio is muted
 */

/**
 * Extract audio track information from page.
 *
 * Queries the page for all Audio components and their properties.
 *
 * @param {Page} page - Playwright page
 * @returns {Promise<AudioTrack[]>}
 */
export async function extractAudioTracks(page) {
  const tracks = await page.evaluate(() => {
    // Check for audio registry
    if (!window.__FRAMELY_AUDIO_TRACKS) {
      return [];
    }
    return window.__FRAMELY_AUDIO_TRACKS.map((track) => ({
      src: track.src,
      startFrame: track.startFrame || 0,
      endFrame: track.endFrame,
      volume: typeof track.volume === 'function' ? 1 : (track.volume ?? 1),
      playbackRate: track.playbackRate || 1,
      loop: track.loop || false,
      muted: track.muted || false,
    }));
  });

  return tracks.filter((t) => !t.muted && t.src);
}

/**
 * Download audio file to temp directory.
 *
 * @param {string} src - Audio source (URL or local path)
 * @param {string} tempDir - Temporary directory
 * @param {number} index - Track index for naming
 * @returns {Promise<string>} Local file path
 */
export async function downloadAudio(src, tempDir, index) {
  // Ensure temp directory exists
  fs.mkdirSync(tempDir, { recursive: true });

  const ext = path.extname(new URL(src, 'file://').pathname) || '.mp3';
  const localPath = path.join(tempDir, `audio-${index}${ext}`);

  if (src.startsWith('http://') || src.startsWith('https://')) {
    // Download from URL
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${src}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(localPath, buffer);
  } else if (src.startsWith('/') || src.startsWith('./')) {
    // Local file - copy or use directly
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, localPath);
    } else {
      throw new Error(`Audio file not found: ${src}`);
    }
  } else {
    // Assume it's already a valid path
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, localPath);
    } else {
      throw new Error(`Audio file not found: ${src}`);
    }
  }

  return localPath;
}

/**
 * Process audio track (apply playback rate, trim, etc.).
 *
 * @param {string} inputPath - Input audio file
 * @param {string} outputPath - Output audio file
 * @param {object} options
 * @param {number} [options.playbackRate=1] - Playback speed
 * @param {number} [options.startTime] - Start time in seconds
 * @param {number} [options.duration] - Duration in seconds
 * @param {number} [options.volume=1] - Volume level
 * @returns {Promise<void>}
 */
export async function processAudioTrack(inputPath, outputPath, options = {}) {
  const {
    playbackRate = 1,
    startTime,
    duration,
    volume = 1,
  } = options;

  const filters = [];

  // Adjust tempo/pitch for playback rate
  if (playbackRate !== 1) {
    // atempo filter only supports 0.5-2.0 range, chain multiple for extreme values
    let rate = playbackRate;
    const tempoFilters = [];
    while (rate > 2.0) {
      tempoFilters.push('atempo=2.0');
      rate /= 2.0;
    }
    while (rate < 0.5) {
      tempoFilters.push('atempo=0.5');
      rate /= 0.5;
    }
    tempoFilters.push(`atempo=${rate}`);
    filters.push(...tempoFilters);
  }

  // Adjust volume
  if (volume !== 1) {
    filters.push(`volume=${volume}`);
  }

  const args = ['-i', inputPath];

  // Trim input
  if (startTime !== undefined) {
    args.push('-ss', String(startTime));
  }
  if (duration !== undefined) {
    args.push('-t', String(duration));
  }

  // Apply filters
  if (filters.length > 0) {
    args.push('-af', filters.join(','));
  }

  args.push('-y', outputPath);

  await runFFmpeg(args);
}

/**
 * Mix multiple audio tracks into a single track.
 *
 * @param {Array<{ path: string, delayMs: number, volume: number }>} tracks
 * @param {string} outputPath
 * @param {number} durationMs - Total duration in milliseconds
 * @returns {Promise<void>}
 */
export async function mixAudioTracks(tracks, outputPath, durationMs) {
  if (tracks.length === 0) {
    // Create silent audio
    await createSilentAudio(outputPath, durationMs / 1000);
    return;
  }

  if (tracks.length === 1) {
    // Single track - just copy with delay
    const track = tracks[0];
    await processAudioTrack(track.path, outputPath, {
      volume: track.volume,
    });
    return;
  }

  // Multiple tracks - use amerge/amix filter
  const inputs = [];
  const filterParts = [];

  tracks.forEach((track, i) => {
    inputs.push('-i', track.path);

    const delay = Math.round(track.delayMs);
    const vol = track.volume ?? 1;

    // Apply delay and volume to each input
    filterParts.push(`[${i}:a]adelay=${delay}|${delay},volume=${vol}[a${i}]`);
  });

  // Mix all tracks
  const mixInputs = tracks.map((_, i) => `[a${i}]`).join('');
  filterParts.push(`${mixInputs}amix=inputs=${tracks.length}:duration=longest[out]`);

  const args = [
    ...inputs,
    '-filter_complex', filterParts.join(';'),
    '-map', '[out]',
    ...getAudioEncodingArgs(),
    '-y', outputPath,
  ];

  await runFFmpeg(args);
}

/**
 * Create a silent audio track.
 *
 * @param {string} outputPath
 * @param {number} durationSeconds
 * @returns {Promise<void>}
 */
export async function createSilentAudio(outputPath, durationSeconds) {
  const args = [
    '-f', 'lavfi',
    '-i', `anullsrc=r=48000:cl=stereo`,
    '-t', String(durationSeconds),
    ...getAudioEncodingArgs(),
    '-y', outputPath,
  ];

  await runFFmpeg(args);
}

/**
 * Mux video and audio into final output.
 *
 * @param {string} videoPath - Video file (no audio)
 * @param {string} audioPath - Audio file
 * @param {string} outputPath - Final output path
 * @param {object} options
 * @returns {Promise<void>}
 */
export async function muxVideoAudio(videoPath, audioPath, outputPath, options = {}) {
  const args = [
    '-i', videoPath,
    '-i', audioPath,
    '-c:v', 'copy',
    ...getAudioEncodingArgs(options),
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-shortest',
    '-y', outputPath,
  ];

  await runFFmpeg(args);
}

/**
 * Get audio duration in seconds.
 *
 * @param {string} audioPath
 * @returns {Promise<number>}
 */
export async function getAudioDuration(audioPath) {
  return new Promise((resolve, reject) => {
    const process = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      audioPath,
    ]);

    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(parseFloat(output.trim()));
      } else {
        reject(new Error('Failed to get audio duration'));
      }
    });

    process.on('error', reject);
  });
}

/**
 * Run FFmpeg command.
 *
 * @param {string[]} args
 * @returns {Promise<void>}
 */
function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    const process = spawn('ffmpeg', args);

    let stderr = '';
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg failed (code ${code}): ${stderr.slice(-500)}`));
      }
    });

    process.on('error', reject);
  });
}

export default {
  extractAudioTracks,
  downloadAudio,
  processAudioTrack,
  mixAudioTracks,
  createSilentAudio,
  muxVideoAudio,
  getAudioDuration,
};
