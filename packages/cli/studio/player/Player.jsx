import { useRef, useEffect, useCallback, useState } from 'react';
import { TimelineProvider, useTimeline, Sequence, Video, Img } from 'framely';
import './Player.css';

/**
 * Player renders a composition inside a preview viewport with
 * transport controls (play, pause, seek, scrub).
 */
export function Player({
  component: Component,
  compositionWidth = 1920,
  compositionHeight = 1080,
  fps = 30,
  durationInFrames = 300,
  inputProps = {},
  sequences = [],
  style,
  className,
}) {
  return (
    <TimelineProvider
      fps={fps}
      width={compositionWidth}
      height={compositionHeight}
      durationInFrames={durationInFrames}
    >
      <PlayerView
        component={Component}
        compositionWidth={compositionWidth}
        compositionHeight={compositionHeight}
        inputProps={inputProps}
        sequences={sequences}
        style={style}
        className={className}
      />
    </TimelineProvider>
  );
}

/**
 * PlayerView - Renders either a composition component or timeline sequences.
 *
 * If `component` is provided, renders the composition component.
 * If `sequences` is provided (and no component), renders sequences as timeline clips.
 */
export function PlayerView({
  component: Component,
  compositionWidth,
  compositionHeight,
  inputProps,
  sequences = [],
  style,
  className,
}) {
  const {
    frame,
    fps,
    durationInFrames,
    playing,
    setFrame,
    toggle,
    play: _play,
    pause: _pause,
  } = useTimeline();

  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Fit the composition into the available space
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const scaleX = width / compositionWidth;
      const scaleY = height / compositionHeight;
      setScale(Math.min(scaleX, scaleY));
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [compositionWidth, compositionHeight]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFrame(Math.max(0, frame - (e.shiftKey ? 10 : 1)));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFrame(Math.min(durationInFrames - 1, frame + (e.shiftKey ? 10 : 1)));
          break;
        case 'Home':
          e.preventDefault();
          setFrame(0);
          break;
        case 'End':
          e.preventDefault();
          setFrame(durationInFrames - 1);
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [frame, durationInFrames, toggle, setFrame]);

  // Timeline scrubbing
  const handleTimelineInteraction = useCallback(
    (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const progress = x / rect.width;
      setFrame(Math.round(progress * (durationInFrames - 1)));
    },
    [durationInFrames, setFrame]
  );

  const handleMouseDown = useCallback(
    (e) => {
      setIsDragging(true);
      handleTimelineInteraction(e);
    },
    [handleTimelineInteraction]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const timeline = document.querySelector('.framely-timeline-track');
      if (!timeline) return;
      const rect = timeline.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const progress = x / rect.width;
      setFrame(Math.round(progress * (durationInFrames - 1)));
    };
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, durationInFrames, setFrame]);

  const currentTime = (frame / fps).toFixed(2);
  const totalTime = ((durationInFrames - 1) / fps).toFixed(2);
  const progress = durationInFrames > 1 ? (frame / (durationInFrames - 1)) * 100 : 0;

  return (
    <div className={`framely-player ${className || ''}`} style={style}>
      {/* Viewport */}
      <div className="framely-viewport" ref={containerRef}>
        <div
          className="framely-canvas"
          style={{
            width: compositionWidth,
            height: compositionHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            position: 'relative',
            background: '#000',
          }}
        >
          {/* Render composition component if provided */}
          {Component && <Component {...inputProps} />}

          {/* Render timeline sequences if no component */}
          {!Component && sequences.map((seq, index) => (
            <Sequence
              key={seq.id || `seq-${index}`}
              from={seq.from}
              durationInFrames={seq.durationInFrames}
              name={seq.name}
              style={{ zIndex: index + 1 }}
            >
              {/* Video asset */}
              {seq.assetType === 'video' && seq.assetPath && (
                <Video
                  src={seq.assetPath}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              )}
              {/* Image asset */}
              {seq.assetType === 'image' && seq.assetPath && (
                <Img
                  src={seq.assetPath}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              )}
              {/* Solid color or default scene */}
              {!seq.assetPath && (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: seq.color || '#1a1a2e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 48,
                    fontFamily: 'system-ui, sans-serif',
                    fontWeight: 700,
                  }}
                >
                  {seq.name || `Scene ${index + 1}`}
                </div>
              )}
            </Sequence>
          ))}

          {/* Empty state for editor mode */}
          {!Component && sequences.length === 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.4)',
                fontSize: 16,
                fontFamily: 'system-ui, sans-serif',
                textAlign: 'center',
                padding: 40,
              }}
            >
              Add assets from the panel to start creating your video
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="framely-controls">
        {/* Timeline */}
        <div
          className="framely-timeline-track"
          onMouseDown={handleMouseDown}
        >
          <div
            className="framely-timeline-progress"
            style={{ width: `${progress}%` }}
          />
          <div
            className="framely-timeline-thumb"
            style={{ left: `${progress}%` }}
          />
          {/* Frame markers */}
          <div className="framely-timeline-markers">
            {Array.from({ length: 11 }, (_, i) => (
              <div
                key={i}
                className="framely-timeline-marker"
                style={{ left: `${i * 10}%` }}
              />
            ))}
          </div>
        </div>

        {/* Transport */}
        <div className="framely-transport">
          <div className="framely-transport-left">
            <button
              className="framely-btn framely-btn-transport"
              onClick={() => setFrame(0)}
              title="Go to start (Home)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="2" y="3" width="2" height="10" />
                <path d="M13 3L6 8l7 5V3z" />
              </svg>
            </button>

            <button
              className="framely-btn framely-btn-transport"
              onClick={() => setFrame(Math.max(0, frame - 1))}
              title="Previous frame (←)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12 3L5 8l7 5V3z" />
              </svg>
            </button>

            <button
              className="framely-btn framely-btn-play"
              onClick={toggle}
              title="Play/Pause (Space)"
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="3" y="2" width="4" height="12" rx="1" />
                  <rect x="9" y="2" width="4" height="12" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 2l10 6-10 6V2z" />
                </svg>
              )}
            </button>

            <button
              className="framely-btn framely-btn-transport"
              onClick={() => setFrame(Math.min(durationInFrames - 1, frame + 1))}
              title="Next frame (→)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 3l7 5-7 5V3z" />
              </svg>
            </button>

            <button
              className="framely-btn framely-btn-transport"
              onClick={() => setFrame(durationInFrames - 1)}
              title="Go to end (End)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3 3l7 5-7 5V3z" />
                <rect x="12" y="3" width="2" height="10" />
              </svg>
            </button>
          </div>

          <div className="framely-transport-right">
            <span className="framely-time">
              {currentTime}s / {totalTime}s
            </span>
            <span className="framely-frame-info">
              Frame {frame} / {durationInFrames - 1}
            </span>
            <span className="framely-fps-badge">{fps} fps</span>
          </div>
        </div>
      </div>
    </div>
  );
}
