/**
 * Audio Visualization Hooks
 *
 * Provides frequency and waveform data from audio elements
 * for creating audio-reactive animations.
 */

import { useState, useEffect, useRef, RefObject } from 'react';
import { useTimeline } from './context';

/**
 * Options for configuring the audio analyser node.
 */
export interface AudioDataOptions {
  /** FFT size (power of 2, 32-32768). Defaults to 256. */
  fftSize?: number;
  /** Smoothing time constant (0-1). Defaults to 0.8. */
  smoothingTimeConstant?: number;
  /** Minimum decibels for frequency data. Defaults to -100. */
  minDecibels?: number;
  /** Maximum decibels for frequency data. Defaults to -30. */
  maxDecibels?: number;
}

/**
 * Return value of the useAudioData hook.
 */
export interface AudioDataResult {
  /** Frequency amplitude data (0-255 per bin). */
  frequencyData: Uint8Array;
  /** Waveform (time-domain) data (0-255 per sample). */
  waveformData: Uint8Array;
  /** RMS volume level normalized to 0-1. */
  volume: number;
  /** Whether the audio analyser has been successfully connected. */
  isReady: boolean;
}

/**
 * A mapping of band names to [minHz, maxHz] frequency ranges.
 */
export type FrequencyBandRanges<K extends string = string> = Record<K, [number, number]>;

/**
 * Result of getFrequencyBands, mapping each band name to its average amplitude (0-1).
 */
export type FrequencyBandValues<K extends string = string> = Record<K, number>;

/** Augment the global Window interface for Framely render mode flag. */
declare global {
  interface Window {
    __FRAMELY_RENDER_MODE?: boolean;
    webkitAudioContext?: typeof AudioContext;
  }
}

/**
 * Extract audio frequency and waveform data from an audio element.
 *
 * In browser preview mode, connects to the Web Audio API to analyze
 * audio in real-time. In render mode (Playwright), returns empty data
 * since audio is not available during headless rendering.
 *
 * @param {RefObject<HTMLAudioElement>} audioRef - Ref to an audio element
 * @param {AudioDataOptions} [options]
 * @param {number} [options.fftSize=256] - FFT size (power of 2, 32-32768)
 * @param {number} [options.smoothingTimeConstant=0.8] - Smoothing (0-1)
 * @param {number} [options.minDecibels=-100] - Min dB for frequency data
 * @param {number} [options.maxDecibels=-30] - Max dB for frequency data
 * @returns {AudioDataResult}
 *
 * @example
 * const audioRef = useRef(null);
 * const { frequencyData, volume } = useAudioData(audioRef);
 *
 * // Use volume to drive animation
 * const scale = 1 + volume * 0.5;
 *
 * // Use frequency bands for visualizer bars
 * {Array.from(frequencyData).slice(0, 32).map((val, i) => (
 *   <div key={i} style={{ height: val }} />
 * ))}
 */
export function useAudioData(
  audioRef: RefObject<HTMLAudioElement | null>,
  options: AudioDataOptions = {},
): AudioDataResult {
  const {
    fftSize = 256,
    smoothingTimeConstant = 0.8,
    minDecibels = -100,
    maxDecibels = -30,
  } = options;

  const { frame } = useTimeline();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  const frequencyBufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const waveformBufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array<ArrayBuffer>>(() => new Uint8Array(fftSize / 2));
  const [waveformData, setWaveformData] = useState<Uint8Array<ArrayBuffer>>(() => new Uint8Array(fftSize));
  const [volume, setVolume] = useState<number>(0);

  // Set up audio context and analyser
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    // Don't set up in render mode
    if (typeof window !== 'undefined' && window.__FRAMELY_RENDER_MODE) {
      return;
    }

    let ctx: AudioContext;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return;
    }

    const analyser = ctx.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothingTimeConstant;
    analyser.minDecibels = minDecibels;
    analyser.maxDecibels = maxDecibels;

    let source: MediaElementAudioSourceNode;
    try {
      source = ctx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(ctx.destination);
    } catch {
      // Source may already be connected
      return;
    }

    contextRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;
    frequencyBufferRef.current = new Uint8Array(analyser.frequencyBinCount);
    waveformBufferRef.current = new Uint8Array(analyser.fftSize);
    setIsReady(true);

    return () => {
      try {
        source.disconnect();
        analyser.disconnect();
        ctx.close();
      } catch {
        // Ignore cleanup errors
      }
      contextRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
      setIsReady(false);
    };
  }, [audioRef?.current, fftSize, smoothingTimeConstant, minDecibels, maxDecibels]);

  // Update data on each frame
  useEffect(() => {
    const analyser = analyserRef.current;
    if (!analyser || !frequencyBufferRef.current || !waveformBufferRef.current) return;

    // Get frequency data
    analyser.getByteFrequencyData(frequencyBufferRef.current);
    const freqCopy = new Uint8Array(frequencyBufferRef.current.length);
    freqCopy.set(frequencyBufferRef.current);
    setFrequencyData(freqCopy);

    // Get waveform data
    analyser.getByteTimeDomainData(waveformBufferRef.current);
    const waveCopy = new Uint8Array(waveformBufferRef.current.length);
    waveCopy.set(waveformBufferRef.current);
    setWaveformData(waveCopy);

    // Calculate RMS volume (0-1)
    let sum = 0;
    for (let i = 0; i < frequencyBufferRef.current.length; i++) {
      const normalized = frequencyBufferRef.current[i] / 255;
      sum += normalized * normalized;
    }
    setVolume(Math.sqrt(sum / frequencyBufferRef.current.length));
  }, [frame]);

  return { frequencyData, waveformData, volume, isReady };
}

/**
 * Extract frequency bands from raw frequency data.
 *
 * Groups frequency bins into named bands based on frequency ranges.
 * Each band value is the average amplitude (0-1) of bins in that range.
 *
 * @param {Uint8Array} frequencyData - Raw frequency data from useAudioData
 * @param {FrequencyBandRanges<K>} bands - Named frequency ranges in Hz
 * @param {number} [sampleRate=44100] - Audio sample rate
 * @returns {FrequencyBandValues<K>} Object with same keys as bands, values 0-1
 *
 * @example
 * const { bass, mid, treble } = getFrequencyBands(frequencyData, {
 *   bass: [20, 250],
 *   mid: [250, 4000],
 *   treble: [4000, 20000],
 * });
 *
 * @example
 * const bands = getFrequencyBands(frequencyData, {
 *   sub: [20, 60],
 *   bass: [60, 250],
 *   lowMid: [250, 500],
 *   mid: [500, 2000],
 *   highMid: [2000, 4000],
 *   presence: [4000, 6000],
 *   brilliance: [6000, 20000],
 * });
 */
export function getFrequencyBands<K extends string>(
  frequencyData: Uint8Array,
  bands: FrequencyBandRanges<K>,
  sampleRate: number = 44100,
): FrequencyBandValues<K> {
  if (!frequencyData || frequencyData.length === 0) {
    const result = {} as FrequencyBandValues<K>;
    for (const key of Object.keys(bands) as K[]) {
      result[key] = 0;
    }
    return result;
  }

  const binCount = frequencyData.length;
  const binWidth = sampleRate / 2 / binCount; // Hz per bin

  const result = {} as FrequencyBandValues<K>;

  for (const [name, [minHz, maxHz]] of Object.entries(bands) as [K, [number, number]][]) {
    const startBin = Math.max(0, Math.floor(minHz / binWidth));
    const endBin = Math.min(binCount - 1, Math.ceil(maxHz / binWidth));

    if (startBin >= binCount || endBin < 0 || startBin > endBin) {
      result[name] = 0;
      continue;
    }

    let sum = 0;
    let count = 0;
    for (let i = startBin; i <= endBin; i++) {
      sum += frequencyData[i] / 255;
      count++;
    }

    result[name] = count > 0 ? sum / count : 0;
  }

  return result;
}

export default { useAudioData, getFrequencyBands };
