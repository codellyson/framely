import { useEffect, useRef, useState, useMemo } from 'react';
import { useTimeline } from './context';
import { delayRender, continueRender, cancelRender } from './delayRender';

/**
 * Volume can be a static number (0–1) or a function that receives
 * the current frame and returns a number (0–1).
 */
export type VolumeCallback = (frame: number) => number;

/**
 * Props accepted by the Audio component.
 *
 * Extends standard HTML audio attributes so callers can pass any
 * native audio prop (e.g. `crossOrigin`, `id`, `className`), but
 * the component itself only uses the subset listed here.
 */
export interface AudioProps
  extends Omit<
    React.AudioHTMLAttributes<HTMLAudioElement>,
    'volume' | 'onError'
  > {
  /** Audio source URL (use staticFile() for local assets). */
  src: string;
  /** Volume level 0–1, or a callback `(frame) => number`. */
  volume?: number | VolumeCallback;
  /** Playback speed multiplier. @default 1 */
  playbackRate?: number;
  /** Whether to mute audio. @default false */
  muted?: boolean;
  /** Loop the audio. @default false */
  loop?: boolean;
  /** Frame to start playing from. @default 0 */
  startFrom?: number;
  /** Frame to stop playing at (exclusive). */
  endAt?: number;
  /** Callback when audio fails to load. */
  onError?: (error: Error) => void;
}

/**
 * Metadata returned by {@link getAudioMetadata}.
 */
export interface AudioMetadata {
  /** Duration of the audio in seconds. */
  duration: number;
  /**
   * Sample rate of the audio.
   * `null` when using the HTMLAudioElement API (Web Audio API
   * would be needed for an accurate value).
   */
  sampleRate: number | null;
}

/**
 * Audio component that syncs with the Framely timeline.
 *
 * The audio's playback position is controlled by the current frame,
 * ensuring perfect sync between audio and your composition.
 *
 * Note: During rendering, audio is handled separately by the backend
 * (FFmpeg muxing). This component is primarily for preview playback.
 *
 * Usage:
 *   import { Audio, staticFile } from './lib';
 *
 *   <Audio src={staticFile('audio/background.mp3')} />
 *   <Audio src={staticFile('audio/sfx.wav')} volume={0.8} />
 *   <Audio
 *     src={staticFile('audio/voiceover.mp3')}
 *     volume={(frame) => interpolate(frame, [0, 30], [0, 1])}
 *   />
 */
export function Audio({
  src,
  volume = 1,
  playbackRate = 1,
  muted = false,
  loop = false,
  startFrom = 0,
  endAt,
  onError,
}: AudioProps): null {
  const { frame, fps, playing, renderMode } = useTimeline();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handleRef = useRef<number | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  // Calculate the actual volume (support callback)
  const actualVolume: number = useMemo(() => {
    if (typeof volume === 'function') {
      return Math.max(0, Math.min(1, volume(frame)));
    }
    return Math.max(0, Math.min(1, volume));
  }, [volume, frame]);

  // In render mode, register audio track metadata for FFmpeg mixing
  useEffect(() => {
    if (!renderMode) return;

    const trackInfo = {
      src,
      startFrame: startFrom,
      volume: typeof volume === 'number' ? volume : 1,
    };

    if (!window.__FRAMELY_AUDIO_TRACKS) {
      window.__FRAMELY_AUDIO_TRACKS = [];
    }
    window.__FRAMELY_AUDIO_TRACKS.push(trackInfo);

    return () => {
      if (window.__FRAMELY_AUDIO_TRACKS) {
        const idx = window.__FRAMELY_AUDIO_TRACKS.indexOf(trackInfo);
        if (idx !== -1) {
          window.__FRAMELY_AUDIO_TRACKS.splice(idx, 1);
        }
      }
    };
  }, [renderMode, src, startFrom, volume]);

  // Calculate target time based on frame
  const targetTime: number = useMemo(() => {
    const relativeFrame: number = frame - startFrom;
    if (relativeFrame < 0) return 0;
    return relativeFrame / fps;
  }, [frame, startFrom, fps]);

  // Check if we're within the audio's active range
  const isActive: boolean = useMemo(() => {
    if (frame < startFrom) return false;
    if (endAt !== undefined && frame >= endAt) return false;
    return true;
  }, [frame, startFrom, endAt]);

  // Delay render until audio is ready (skip in render mode)
  useEffect(() => {
    if (renderMode) return;
    handleRef.current = delayRender(`Loading audio: ${src}`, {
      timeoutInMilliseconds: 30000,
    });

    return () => {
      if (handleRef.current !== null) {
        continueRender(handleRef.current);
        handleRef.current = null;
      }
    };
  }, [src, renderMode]);

  // Create audio element (skip in render mode — audio is handled by FFmpeg)
  useEffect(() => {
    if (renderMode) return;
    const audio: HTMLAudioElement = new window.Audio();
    audio.preload = 'auto';
    audio.src = src;
    audioRef.current = audio;

    const handleCanPlay = (): void => {
      setReady(true);
      if (handleRef.current !== null) {
        continueRender(handleRef.current);
        handleRef.current = null;
      }
    };

    const handleError = (): void => {
      const err = new Error(`Failed to load audio: ${src}`);
      onError?.(err);

      if (handleRef.current !== null) {
        cancelRender(err);
        handleRef.current = null;
      }
    };

    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, [src, onError, renderMode]);

  // Sync audio time with frame
  useEffect(() => {
    if (renderMode) return;
    const audio: HTMLAudioElement | null = audioRef.current;
    if (!audio || !ready) return;

    // Only seek if we're more than half a frame off
    const tolerance: number = 0.5 / fps;
    if (Math.abs(audio.currentTime - targetTime) > tolerance) {
      audio.currentTime = targetTime;
    }
  }, [targetTime, ready, fps, renderMode]);

  // Sync volume
  useEffect(() => {
    if (renderMode) return;
    const audio: HTMLAudioElement | null = audioRef.current;
    if (!audio) return;
    audio.volume = actualVolume;
  }, [actualVolume, renderMode]);

  // Sync playback rate
  useEffect(() => {
    if (renderMode) return;
    const audio: HTMLAudioElement | null = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate, renderMode]);

  // Sync muted state
  useEffect(() => {
    if (renderMode) return;
    const audio: HTMLAudioElement | null = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
  }, [muted, renderMode]);

  // Sync loop state
  useEffect(() => {
    if (renderMode) return;
    const audio: HTMLAudioElement | null = audioRef.current;
    if (!audio) return;
    audio.loop = loop;
  }, [loop, renderMode]);

  // Handle play/pause (for preview mode)
  useEffect(() => {
    if (renderMode) return;
    const audio: HTMLAudioElement | null = audioRef.current;
    if (!audio || !ready) return;

    if (playing && isActive) {
      audio.play().catch(() => {
        // Autoplay might be blocked, that's okay
      });
    } else {
      audio.pause();
    }
  }, [playing, ready, isActive, renderMode]);

  // Audio doesn't render anything visible
  return null;
}

/**
 * Get audio metadata from a source.
 *
 * @param src - Audio URL
 * @returns A promise that resolves with duration and sampleRate info
 */
export async function getAudioMetadata(src: string): Promise<AudioMetadata> {
  return new Promise<AudioMetadata>((resolve, reject) => {
    const audio: HTMLAudioElement = new window.Audio();

    audio.addEventListener('loadedmetadata', () => {
      resolve({
        duration: audio.duration,
        // Note: Web Audio API would be needed for sampleRate
        sampleRate: null,
      });
    });

    audio.addEventListener('error', () => {
      reject(new Error(`Failed to load audio metadata: ${src}`));
    });

    audio.src = src;
  });
}

/**
 * Calculate the duration in frames for an audio file.
 *
 * @param src - Audio URL
 * @param fps - Frames per second
 * @returns Duration in frames (rounded up)
 */
export async function getAudioDurationInFrames(
  src: string,
  fps: number,
): Promise<number> {
  const metadata: AudioMetadata = await getAudioMetadata(src);
  return Math.ceil(metadata.duration * fps);
}

export default Audio;
