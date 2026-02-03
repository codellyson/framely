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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TimelineProvider } from './context';
import { AbsoluteFill } from './AbsoluteFill';

/**
 * Player component for rendering and playing Framely compositions.
 *
 * @param {object} props
 * @param {React.ComponentType} props.component - The composition component to render
 * @param {number} props.durationInFrames - Total frames in the composition
 * @param {number} [props.fps=30] - Frames per second
 * @param {number} [props.width=1920] - Video width
 * @param {number} [props.height=1080] - Video height
 * @param {object} [props.inputProps={}] - Props passed to the composition
 * @param {boolean} [props.autoPlay=false] - Start playing automatically
 * @param {boolean} [props.loop=false] - Loop playback
 * @param {boolean} [props.controls=true] - Show playback controls
 * @param {boolean} [props.showFrameCount=false] - Show frame counter
 * @param {number} [props.initialFrame=0] - Starting frame
 * @param {string} [props.style] - Additional styles for container
 * @param {string} [props.className] - CSS class for container
 * @param {function} [props.onFrameChange] - Called when frame changes
 * @param {function} [props.onPlay] - Called when playback starts
 * @param {function} [props.onPause] - Called when playback pauses
 * @param {function} [props.onEnded] - Called when playback ends
 * @param {function} [props.onError] - Called on error
 */
export function Player({
  component: Component,
  durationInFrames,
  fps = 30,
  width = 1920,
  height = 1080,
  inputProps = {},
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
}) {
  const [frame, setFrame] = useState(initialFrame);
  const [playing, setPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Calculate aspect ratio and scale
  const aspectRatio = width / height;

  // Animation loop
  useEffect(() => {
    if (!playing) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const frameDuration = 1000 / (fps * playbackRate);
    lastTimeRef.current = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - lastTimeRef.current;

      if (elapsed >= frameDuration) {
        const framesToAdvance = Math.floor(elapsed / frameDuration);
        lastTimeRef.current = currentTime - (elapsed % frameDuration);

        setFrame((prevFrame) => {
          let newFrame = prevFrame + framesToAdvance;

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
  const play = useCallback(() => {
    if (frame >= durationInFrames - 1) {
      setFrame(0);
    }
    setPlaying(true);
    onPlay?.();
  }, [frame, durationInFrames, onPlay]);

  const pause = useCallback(() => {
    setPlaying(false);
    onPause?.();
  }, [onPause]);

  const toggle = useCallback(() => {
    if (playing) {
      pause();
    } else {
      play();
    }
  }, [playing, play, pause]);

  const seekTo = useCallback((targetFrame) => {
    const clampedFrame = Math.max(0, Math.min(durationInFrames - 1, targetFrame));
    setFrame(clampedFrame);
  }, [durationInFrames]);

  const seekToPercent = useCallback((percent) => {
    const targetFrame = Math.floor((percent / 100) * durationInFrames);
    seekTo(targetFrame);
  }, [durationInFrames, seekTo]);

  const toggleFullscreen = useCallback(() => {
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
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

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
          setMuted((m) => !m);
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
  const contextValue = useMemo(() => ({
    frame,
    fps,
    width,
    height,
    durationInFrames,
    playing,
    volume: muted ? 0 : volume,
    playbackRate,
  }), [frame, fps, width, height, durationInFrames, playing, volume, muted, playbackRate]);

  // Format time display
  const formatTime = (f) => {
    const totalSeconds = f / fps;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentTime = formatTime(frame);
  const totalTime = formatTime(durationInFrames);
  const progress = (frame / (durationInFrames - 1)) * 100;

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
          <TimelineProvider value={contextValue}>
            <AbsoluteFill>
              <Component {...inputProps} />
            </AbsoluteFill>
          </TimelineProvider>
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
            {playing ? '⏸' : '▶'}
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
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = ((e.clientX - rect.left) / rect.width) * 100;
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
            onClick={() => setMuted((m) => !m)}
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
            {muted ? '🔇' : '🔊'}
          </button>

          {/* Playback rate */}
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
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
            {fullscreen ? '⛶' : '⛶'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Thumbnail component - renders a single frame.
 */
export function Thumbnail({
  component: Component,
  frame = 0,
  fps = 30,
  width = 1920,
  height = 1080,
  inputProps = {},
  style,
  className,
}) {
  const aspectRatio = width / height;

  const contextValue = useMemo(() => ({
    frame,
    fps,
    width,
    height,
    durationInFrames: frame + 1,
    playing: false,
    volume: 0,
    playbackRate: 1,
  }), [frame, fps, width, height]);

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
        <TimelineProvider value={contextValue}>
          <AbsoluteFill>
            <Component {...inputProps} />
          </AbsoluteFill>
        </TimelineProvider>
      </div>
    </div>
  );
}

export default Player;
