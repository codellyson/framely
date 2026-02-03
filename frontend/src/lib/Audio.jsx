import { useEffect, useRef, useState, useMemo } from 'react';
import { useTimeline } from './context';
import { delayRender, continueRender, cancelRender } from './delayRender';

/**
 * Audio component that syncs with the Framely timeline.
 *
 * The audio's playback position is controlled by the current frame,
 * ensuring perfect sync between audio and your composition.
 *
 * Note: During rendering, audio is handled separately by the backend
 * (FFmpeg muxing). This component is primarily for preview playback.
 *
 * Props:
 *   src            - Audio source URL (use staticFile() for local assets)
 *   volume         - Volume level 0-1, or a callback (frame) => number
 *   playbackRate   - Playback speed multiplier (default: 1)
 *   muted          - Whether to mute audio (default: false)
 *   loop           - Loop the audio (default: false)
 *   startFrom      - Frame to start playing from (default: 0)
 *   endAt          - Frame to stop playing at (optional)
 *   onError        - Callback when audio fails to load
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
}) {
  const { frame, fps, playing } = useTimeline();
  const audioRef = useRef(null);
  const handleRef = useRef(null);
  const [ready, setReady] = useState(false);

  // Calculate the actual volume (support callback)
  const actualVolume = useMemo(() => {
    if (typeof volume === 'function') {
      return Math.max(0, Math.min(1, volume(frame)));
    }
    return Math.max(0, Math.min(1, volume));
  }, [volume, frame]);

  // Calculate target time based on frame
  const targetTime = useMemo(() => {
    const relativeFrame = frame - startFrom;
    if (relativeFrame < 0) return 0;
    return relativeFrame / fps;
  }, [frame, startFrom, fps]);

  // Check if we're within the audio's active range
  const isActive = useMemo(() => {
    if (frame < startFrom) return false;
    if (endAt !== undefined && frame >= endAt) return false;
    return true;
  }, [frame, startFrom, endAt]);

  // Delay render until audio is ready
  useEffect(() => {
    handleRef.current = delayRender(`Loading audio: ${src}`, {
      timeoutInMilliseconds: 30000,
    });

    return () => {
      if (handleRef.current !== null) {
        continueRender(handleRef.current);
        handleRef.current = null;
      }
    };
  }, [src]);

  // Create audio element
  useEffect(() => {
    const audio = new window.Audio();
    audio.preload = 'auto';
    audio.src = src;
    audioRef.current = audio;

    const handleCanPlay = () => {
      setReady(true);
      if (handleRef.current !== null) {
        continueRender(handleRef.current);
        handleRef.current = null;
      }
    };

    const handleError = () => {
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
  }, [src, onError]);

  // Sync audio time with frame
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !ready) return;

    // Only seek if we're more than half a frame off
    const tolerance = 0.5 / fps;
    if (Math.abs(audio.currentTime - targetTime) > tolerance) {
      audio.currentTime = targetTime;
    }
  }, [targetTime, ready, fps]);

  // Sync volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = actualVolume;
  }, [actualVolume]);

  // Sync playback rate
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  // Sync muted state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
  }, [muted]);

  // Sync loop state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = loop;
  }, [loop]);

  // Handle play/pause (for preview mode)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !ready) return;

    if (playing && isActive) {
      audio.play().catch(() => {
        // Autoplay might be blocked, that's okay
      });
    } else {
      audio.pause();
    }
  }, [playing, ready, isActive]);

  // Audio doesn't render anything visible
  return null;
}

/**
 * Get audio metadata from a source.
 *
 * @param {string} src - Audio URL
 * @returns {Promise<{ duration: number, sampleRate: number }>}
 */
export async function getAudioMetadata(src) {
  return new Promise((resolve, reject) => {
    const audio = new window.Audio();

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
 * @param {string} src - Audio URL
 * @param {number} fps - Frames per second
 * @returns {Promise<number>} Duration in frames
 */
export async function getAudioDurationInFrames(src, fps) {
  const metadata = await getAudioMetadata(src);
  return Math.ceil(metadata.duration * fps);
}

export default Audio;
