/**
 * Timeline Component
 *
 * Visual timeline for the Framely studio showing sequences,
 * their durations, and allowing frame-level navigation.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Timeline visualization component.
 *
 * @param {object} props
 * @param {number} props.frame - Current frame
 * @param {number} props.durationInFrames - Total frames
 * @param {number} props.fps - Frames per second
 * @param {Array} [props.sequences=[]] - Sequence data for visualization
 * @param {function} props.onSeek - Called when user seeks to a frame
 * @param {boolean} [props.playing=false] - Whether playback is active
 * @param {function} [props.onPlay] - Called to start playback
 * @param {function} [props.onPause] - Called to pause playback
 */
export function Timeline({
  frame,
  durationInFrames,
  fps,
  sequences = [],
  onSeek,
  playing = false,
  onPlay,
  onPause,
}) {
  const timelineRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Calculate dimensions
  const frameWidth = 2 * zoom; // pixels per frame
  const totalWidth = durationInFrames * frameWidth;
  const trackHeight = 32;
  const rulerHeight = 24;

  // Format time for display
  const formatTime = (f) => {
    const totalSeconds = f / fps;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const frames = f % fps;
    return `${minutes}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  // Handle click/drag on timeline
  const handleTimelineClick = useCallback((e) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const clickedFrame = Math.floor(x / frameWidth);
    const clampedFrame = Math.max(0, Math.min(durationInFrames - 1, clickedFrame));
    onSeek?.(clampedFrame);
  }, [frameWidth, durationInFrames, scrollLeft, onSeek]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    handleTimelineClick(e);
  }, [handleTimelineClick]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleTimelineClick(e);
  }, [isDragging, handleTimelineClick]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Generate ruler markers
  const generateRulerMarkers = () => {
    const markers = [];
    const markerInterval = Math.max(1, Math.floor(fps / zoom)); // Show markers at reasonable intervals

    for (let f = 0; f < durationInFrames; f += markerInterval) {
      const isMajor = f % fps === 0;
      markers.push(
        <div
          key={f}
          style={{
            position: 'absolute',
            left: f * frameWidth,
            top: isMajor ? 0 : 12,
            height: isMajor ? '100%' : '50%',
            width: 1,
            backgroundColor: isMajor ? '#666' : '#444',
          }}
        >
          {isMajor && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                left: 4,
                fontSize: '10px',
                color: '#888',
                whiteSpace: 'nowrap',
              }}
            >
              {Math.floor(f / fps)}s
            </span>
          )}
        </div>
      );
    }
    return markers;
  };

  // Track colors
  const trackColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 12px',
          borderBottom: '1px solid #333',
          backgroundColor: '#252525',
        }}
      >
        {/* Play/Pause */}
        <button
          onClick={() => playing ? onPause?.() : onPlay?.()}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px 8px',
          }}
        >
          {playing ? '⏸' : '▶'}
        </button>

        {/* Time display */}
        <div style={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}>
          {formatTime(frame)}
        </div>

        {/* Frame input */}
        <input
          type="number"
          value={frame}
          onChange={(e) => onSeek?.(parseInt(e.target.value, 10) || 0)}
          style={{
            width: '60px',
            padding: '4px 8px',
            backgroundColor: '#333',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
          }}
        />

        <span style={{ color: '#666', fontSize: '12px' }}>
          / {durationInFrames - 1}
        </span>

        {/* Zoom controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#888', fontSize: '12px' }}>Zoom:</span>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.5"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ width: '80px' }}
          />
          <span style={{ color: '#888', fontSize: '12px', width: '30px' }}>
            {zoom}x
          </span>
        </div>
      </div>

      {/* Timeline area */}
      <div
        ref={timelineRef}
        style={{
          position: 'relative',
          overflowX: 'auto',
          overflowY: 'hidden',
          cursor: 'pointer',
        }}
        onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
        onMouseDown={handleMouseDown}
      >
        {/* Ruler */}
        <div
          style={{
            position: 'relative',
            height: rulerHeight,
            width: totalWidth,
            backgroundColor: '#222',
            borderBottom: '1px solid #333',
          }}
        >
          {generateRulerMarkers()}
        </div>

        {/* Tracks */}
        <div
          style={{
            position: 'relative',
            width: totalWidth,
            minHeight: 100,
          }}
        >
          {/* Sequence tracks */}
          {sequences.length > 0 ? (
            sequences.map((seq, index) => (
              <div
                key={seq.id || index}
                style={{
                  position: 'absolute',
                  top: index * (trackHeight + 4) + 4,
                  left: (seq.from || 0) * frameWidth,
                  width: seq.durationInFrames * frameWidth,
                  height: trackHeight,
                  backgroundColor: trackColors[index % trackColors.length],
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                  fontSize: '11px',
                  color: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  opacity: 0.9,
                }}
              >
                {seq.name || `Sequence ${index + 1}`}
              </div>
            ))
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 4,
                left: 0,
                width: totalWidth,
                height: trackHeight,
                backgroundColor: '#3b82f6',
                borderRadius: '4px',
                opacity: 0.5,
              }}
            />
          )}

          {/* Playhead */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: frame * frameWidth,
              width: 2,
              height: '100%',
              backgroundColor: '#ef4444',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -rulerHeight,
                left: -5,
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '8px solid #ef4444',
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer with info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          borderTop: '1px solid #333',
          backgroundColor: '#222',
          fontSize: '11px',
          color: '#888',
        }}
      >
        <span>{fps} FPS</span>
        <span>{(durationInFrames / fps).toFixed(2)}s total</span>
        <span>{sequences.length} sequence(s)</span>
      </div>
    </div>
  );
}

export default Timeline;
