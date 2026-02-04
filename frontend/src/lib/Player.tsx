/**
 * Embeddable Player Component
 *
 * A drop-in video player for any React application.
 * Renders Framely compositions with playback controls.
 *
 * Usage:
 *   import { Player } from '@framely/core';
 *
 *   <Player
 *     component={MyVideoComponent}
 *     durationInFrames={300}
 *     fps={30}
 *     width={1920}
 *     height={1080}
 *     inputProps={{ title: 'Hello' }}
 *   />
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { TimelineContext } from './context';
import { AbsoluteFill } from './AbsoluteFill';

// ─── Player Context Value ─────────────────────────────────────────────────────

/**
 * The shape of the context value the Player injects into TimelineContext.
 * Extends the base timeline fields with playback-specific properties
 * (volume, playbackRate) that the Player manages internally.
 */
export interface PlayerTimelineContextValue {
  /** Current frame index (0-based). */
  frame: number;
  /** Frames per second. */
  fps: number;
  /** Composition width in pixels. */
  width: number;
  /** Composition height in pixels. */
  height: number;
  /** Total number of frames in the composition. */
  durationInFrames: number;
  /** Whether playback is currently active. */
  playing: boolean;
  /** Effective volume (0 when muted). */
  volume: number;
  /** Current playback rate multiplier. */
  playbackRate: number;
}

// ─── Player Props ─────────────────────────────────────────────────────────────

/**
 * Props accepted by the Player component.
 *
 * @typeParam T - The shape of the input props forwarded to the composition component.
 */
export interface PlayerProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** The composition component to render. */
  component: React.ComponentType<T>;
  /** Total number of frames in the composition. */
  durationInFrames: number;
  /** Frames per second. @default 30 */
  fps?: number;
  /** Composition width in pixels. @default 1920 */
  width?: number;
  /** Composition height in pixels. @default 1080 */
  height?: number;
  /** Props forwarded to the composition component. @default {} */
  inputProps?: T;
  /** Start playing automatically. @default false */
  autoPlay?: boolean;
  /** Loop playback when reaching the end. @default false */
  loop?: boolean;
  /** Show playback controls. @default true */
  controls?: boolean;
  /** Show frame counter in the controls bar. @default false */
  showFrameCount?: boolean;
  /** Initial frame to start on. @default 0 */
  initialFrame?: number;
  /** Additional inline styles for the outermost container. */
  style?: React.CSSProperties;
  /** CSS class name for the outermost container. */
  className?: string;
  /** Called whenever the current frame changes. */
  onFrameChange?: (frame: number) => void;
  /** Called when playback starts. */
  onPlay?: () => void;
  /** Called when playback pauses. */
  onPause?: () => void;
  /** Called when playback reaches the end (non-loop). */
  onEnded?: () => void;
  /** Called when an error occurs. */
  onError?: (error: Error) => void;
}

// ─── Player Component ─────────────────────────────────────────────────────────

/**
 * Player component for rendering and playing Framely compositions.
 */
export function Player<T extends Record<string, unknown> = Record<string, unknown>>({
  component: Component,
  durationInFrames,
  fps = 30,
  width = 1920,
  height = 1080,
  inputProps = {} as T,
  autoPlay = false,
  loop = false,
  controls = true,
  showFrameCount = false,
  initialFrame = 0,
  style,
  className,
  onFrameChange,
  onPlay,
  onPause,
  onEnded,
  onError,
}: PlayerProps<T>): React.JSX.Element {
  const [frame, setFrame] = useState<number>(initialFrame);
  const [playing, setPlaying] = useState<boolean>(autoPlay);
  const [volume, setVolume] = useState<number>(1);
  const [muted, setMuted] = useState<boolean>(false);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Calculate aspect ratio and scale
  const aspectRatio: number = width / height;

  // Animation loop
  useEffect(() => {
    if (!playing) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const frameDuration: number = 1000 / (fps * playbackRate);
    lastTimeRef.current = performance.now();

    const animate = (currentTime: number): void => {
      const elapsed: number = currentTime - (lastTimeRef.current ?? currentTime);

      if (elapsed >= frameDuration) {
        const framesToAdvance: number = Math.floor(elapsed / frameDuration);
        lastTimeRef.current = currentTime - (elapsed % frameDuration);

        setFrame((prevFrame: number) => {
          let newFrame: number = prevFrame + framesToAdvance;

          if (newFrame >= durationInFrames) {
            if (loop) {
              newFrame = newFrame % durationInFrames;
            } else {
              setPlaying(false);
              onEnded?.();
              return durationInFrames - 1;
            }
          }

          return newFrame;
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playing, fps, durationInFrames, loop, playbackRate, onEnded]);

  // Notify frame changes
  useEffect(() => {
    onFrameChange?.(frame);
  }, [frame, onFrameChange]);

  // Playback controls
  const play = useCallback((): void => {
    if (frame >= durationInFrames - 1) {
      setFrame(0);
    }
    setPlaying(true);
    onPlay?.();
  }, [frame, durationInFrames, onPlay]);

  const pause = useCallback((): void => {
    setPlaying(false);
    onPause?.();
  }, [onPause]);

  const toggle = useCallback((): void => {
    if (playing) {
      pause();
    } else {
      play();
    }
  }, [playing, play, pause]);

  const seekTo = useCallback(
    (targetFrame: number): void => {
      const clampedFrame: number = Math.max(0, Math.min(durationInFrames - 1, targetFrame));
      setFrame(clampedFrame);
    },
    [durationInFrames],
  );

  const seekToPercent = useCallback(
    (percent: number): void => {
      const targetFrame: number = Math.floor((percent / 100) * durationInFrames);
      seekTo(targetFrame);
    },
    [durationInFrames, seekTo],
  );

  const toggleFullscreen = useCallback((): void => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekTo(frame - (e.shiftKey ? 10 : 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekTo(frame + (e.shiftKey ? 10 : 1));
          break;
        case 'Home':
          e.preventDefault();
          seekTo(0);
          break;
        case 'End':
          e.preventDefault();
          seekTo(durationInFrames - 1);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          setMuted((m: boolean) => !m);
          break;
        case ',':
          e.preventDefault();
          if (!playing) seekTo(frame - 1);
          break;
        case '.':
          e.preventDefault();
          if (!playing) seekTo(frame + 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frame, playing, durationInFrames, toggle, seekTo, toggleFullscreen]);

  // Timeline context value
  const contextValue = useMemo<PlayerTimelineContextValue>(
    () => ({
      frame,
      fps,
      width,
      height,
      durationInFrames,
      playing,
      volume: muted ? 0 : volume,
      playbackRate,
    }),
    [frame, fps, width, height, durationInFrames, playing, volume, muted, playbackRate],
  );

  // Format time display
  const formatTime = (f: number): string => {
    const totalSeconds: number = f / fps;
    const minutes: number = Math.floor(totalSeconds / 60);
    const seconds: number = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentTime: string = formatTime(frame);
  const totalTime: string = formatTime(durationInFrames);
  const progress: number = (frame / (durationInFrames - 1)) * 100;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: width,
        backgroundColor: '#000',
        ...style,
      }}
    >
      {/* Video Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: `${(1 / aspectRatio) * 100}%`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <TimelineContext.Provider value={contextValue as any}>
            <AbsoluteFill>
              <Component {...inputProps} />
            </AbsoluteFill>
          </TimelineContext.Provider>
        </div>

        {/* Click to play/pause overlay */}
        <div
          onClick={toggle}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Controls */}
      {controls && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            fontSize: '14px',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Play/Pause */}
          <button
            onClick={toggle}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '16px',
            }}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? '\u23F8' : '\u25B6'}
          </button>

          {/* Time display */}
          <span style={{ minWidth: '80px', fontSize: '12px' }}>
            {currentTime} / {totalTime}
          </span>

          {/* Progress bar */}
          <div
            style={{
              flex: 1,
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '2px',
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent: number = ((e.clientX - rect.left) / rect.width) * 100;
              seekToPercent(percent);
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${progress}%`,
                backgroundColor: '#3b82f6',
                borderRadius: '2px',
                transition: 'width 0.1s',
              }}
            />
          </div>

          {/* Frame count */}
          {showFrameCount && (
            <span style={{ fontSize: '12px', opacity: 0.7 }}>
              {frame} / {durationInFrames - 1}
            </span>
          )}

          {/* Volume */}
          <button
            onClick={() => setMuted((m: boolean) => !m)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '14px',
            }}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
          </button>

          {/* Playback rate */}
          <select
            value={playbackRate}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setPlaybackRate(parseFloat(e.target.value))
            }
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              padding: '2px 4px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '14px',
            }}
            aria-label="Toggle fullscreen"
          >
            {fullscreen ? '\u26F6' : '\u26F6'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Thumbnail Props ──────────────────────────────────────────────────────────

/**
 * Props accepted by the Thumbnail component.
 *
 * @typeParam T - The shape of the input props forwarded to the composition component.
 */
export interface ThumbnailProps<T extends Record<string, unknown> = Record<string, unknown>> {
  /** The composition component to render. */
  component: React.ComponentType<T>;
  /** Frame index to render. @default 0 */
  frame?: number;
  /** Frames per second (used for timing hooks inside the component). @default 30 */
  fps?: number;
  /** Composition width in pixels. @default 1920 */
  width?: number;
  /** Composition height in pixels. @default 1080 */
  height?: number;
  /** Props forwarded to the composition component. @default {} */
  inputProps?: T;
  /** Additional inline styles for the container. */
  style?: React.CSSProperties;
  /** CSS class name for the container. */
  className?: string;
}

// ─── Thumbnail Component ──────────────────────────────────────────────────────

/**
 * Thumbnail component -- renders a single frame of a composition.
 */
export function Thumbnail<T extends Record<string, unknown> = Record<string, unknown>>({
  component: Component,
  frame = 0,
  fps = 30,
  width = 1920,
  height = 1080,
  inputProps = {} as T,
  style,
  className,
}: ThumbnailProps<T>): React.JSX.Element {
  const aspectRatio: number = width / height;

  const contextValue = useMemo<PlayerTimelineContextValue>(
    () => ({
      frame,
      fps,
      width,
      height,
      durationInFrames: frame + 1,
      playing: false,
      volume: 0,
      playbackRate: 1,
    }),
    [frame, fps, width, height],
  );

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: width,
        paddingTop: `${(1 / aspectRatio) * 100}%`,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <TimelineContext.Provider value={contextValue as any}>
          <AbsoluteFill>
            <Component {...inputProps} />
          </AbsoluteFill>
        </TimelineContext.Provider>
      </div>
    </div>
  );
}

export default Player;
