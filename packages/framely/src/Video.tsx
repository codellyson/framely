import {
  useEffect,
  useRef,
  useState,
  useMemo,
  type CSSProperties,
  type SyntheticEvent,
} from 'react';
import { useTimeline } from './context';
import { delayRender, continueRender, cancelRender } from './delayRender';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A volume value can be a static number (0-1) or a callback that receives the
 * current frame and returns a number (0-1). The callback form is useful for
 * animating volume over time (e.g. fade-in/fade-out).
 */
export type VolumeCallback = (frame: number) => number;

/**
 * Props accepted by the Video component.
 *
 * Extends the standard HTML `<video>` attributes so that any native prop
 * (e.g. `crossOrigin`, `poster`, `preload`) can be forwarded directly.
 */
export interface VideoProps
  extends Omit<
    React.VideoHTMLAttributes<HTMLVideoElement>,
    'volume' | 'playbackRate' | 'muted' | 'loop' | 'onError'
  > {
  /** Video source URL. Use `staticFile()` for local assets. */
  src: string;

  /**
   * Volume level (0-1), or a callback `(frame) => number` for dynamic volume.
   * Clamped to the 0-1 range at runtime.
   * @default 1
   */
  volume?: number | VolumeCallback;

  /**
   * Playback speed multiplier.
   * @default 1
   */
  playbackRate?: number;

  /**
   * Whether to mute audio.
   * @default false
   */
  muted?: boolean;

  /**
   * Whether the video should loop.
   * @default false
   */
  loop?: boolean;

  /**
   * Frame index from which the video should start playing (0-based).
   * @default 0
   */
  startFrom?: number;

  /**
   * Frame index at which the video should stop (exclusive).
   * If omitted the video plays until its natural end.
   */
  endAt?: number;

  /** Optional CSS styles applied to the `<video>` element. */
  style?: CSSProperties;

  /** Optional CSS class name applied to the `<video>` element. */
  className?: string;

  /** Called when the video element encounters an error. */
  onError?: (event: SyntheticEvent<HTMLVideoElement, Event>) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Video component that syncs with the Framely timeline.
 *
 * The video's playback position is controlled by the current frame,
 * ensuring perfect sync between the video and your composition.
 *
 * Usage:
 *   import { Video, staticFile } from './lib';
 *
 *   <Video src={staticFile('videos/intro.mp4')} />
 *   <Video src={staticFile('videos/bg.mp4')} volume={0.5} muted />
 *   <Video
 *     src={staticFile('videos/clip.mp4')}
 *     startFrom={30}
 *     endAt={90}
 *     volume={(frame) => interpolate(frame, [0, 30], [0, 1])}
 *   />
 */
export function Video({
  src,
  volume = 1,
  playbackRate = 1,
  muted = false,
  loop = false,
  startFrom = 0,
  endAt,
  style,
  className,
  onError,
  ...rest
}: VideoProps): JSX.Element | null {
  const { frame, fps, playing } = useTimeline();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handleRef = useRef<number | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  // Calculate the actual volume (support callback)
  const actualVolume: number = useMemo(() => {
    if (typeof volume === 'function') {
      return Math.max(0, Math.min(1, volume(frame)));
    }
    return Math.max(0, Math.min(1, volume));
  }, [volume, frame]);

  // Calculate target time based on frame
  const targetTime: number = useMemo(() => {
    const relativeFrame: number = frame - startFrom;
    if (relativeFrame < 0) return 0;
    return relativeFrame / fps;
  }, [frame, startFrom, fps]);

  // Check if we're within the video's active range
  const isActive: boolean = useMemo(() => {
    if (frame < startFrom) return false;
    if (endAt !== undefined && frame >= endAt) return false;
    return true;
  }, [frame, startFrom, endAt]);

  // Delay render until video is ready
  useEffect(() => {
    handleRef.current = delayRender(`Loading video: ${src}`, {
      timeoutInMilliseconds: 30000,
    });

    return () => {
      if (handleRef.current !== null) {
        continueRender(handleRef.current);
        handleRef.current = null;
      }
    };
  }, [src]);

  // Handle video ready state
  const handleCanPlay = (): void => {
    setReady(true);
    if (handleRef.current !== null) {
      continueRender(handleRef.current);
      handleRef.current = null;
    }
  };

  // Handle video error
  const handleError = (event: SyntheticEvent<HTMLVideoElement, Event>): void => {
    const err = new Error(`Failed to load video: ${src}`);
    onError?.(event);

    if (handleRef.current !== null) {
      cancelRender(err);
      handleRef.current = null;
    }
  };

  // Sync video time with frame
  useEffect(() => {
    const video: HTMLVideoElement | null = videoRef.current;
    if (!video || !ready) return;

    // Only seek if we're more than half a frame off
    const tolerance: number = 0.5 / fps;
    if (Math.abs(video.currentTime - targetTime) > tolerance) {
      video.currentTime = targetTime;
    }
  }, [targetTime, ready, fps]);

  // Sync volume
  useEffect(() => {
    const video: HTMLVideoElement | null = videoRef.current;
    if (!video) return;
    video.volume = actualVolume;
  }, [actualVolume]);

  // Sync playback rate
  useEffect(() => {
    const video: HTMLVideoElement | null = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  // Sync muted state
  useEffect(() => {
    const video: HTMLVideoElement | null = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  // Handle play/pause (for preview mode)
  useEffect(() => {
    const video: HTMLVideoElement | null = videoRef.current;
    if (!video || !ready) return;

    if (playing && isActive) {
      video.play().catch(() => {
        // Autoplay might be blocked, that's okay
      });
    } else {
      video.pause();
    }
  }, [playing, ready, isActive]);

  // Don't render if outside active range
  if (!isActive) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      src={src}
      style={{
        ...style,
        opacity: ready ? (style?.opacity ?? 1) : 0,
      }}
      className={className}
      onCanPlayThrough={handleCanPlay}
      onError={handleError}
      playsInline
      preload="auto"
      loop={loop}
      {...rest}
    />
  );
}

export default Video;
