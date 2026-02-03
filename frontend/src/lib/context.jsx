import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

/**
 * TimelineContext holds the current frame and video configuration.
 * This is the core of the framework — every component that needs
 * to know "where in time we are" reads from this context.
 */
const TimelineContext = createContext({
  frame: 0,
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 300,
});

export function useTimeline() {
  return useContext(TimelineContext);
}

export { TimelineContext };

/**
 * TimelineProvider wraps a composition and manages playback state.
 * In "render mode" (controlled externally), it exposes window.__setFrame().
 */
export function TimelineProvider({
  fps = 30,
  width = 1920,
  height = 1080,
  durationInFrames = 300,
  renderMode = false,
  initialFrame = 0,
  children,
  onFrameChange,
}) {
  const [frame, setFrameState] = useState(initialFrame);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);
  const frameRef = useRef(frame);

  // Keep ref in sync
  frameRef.current = frame;

  const setFrame = useCallback(
    (f) => {
      const clamped = Math.max(0, Math.min(f, durationInFrames - 1));
      setFrameState(clamped);
      onFrameChange?.(clamped);
    },
    [durationInFrames, onFrameChange]
  );

  // Expose setFrame globally for the renderer (Playwright calls this)
  useEffect(() => {
    if (renderMode) {
      window.__setFrame = (f) => {
        return new Promise((resolve) => {
          setFrame(f);
          // Wait for React to render the new frame
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      };
      window.__ready = true;
      return () => {
        delete window.__setFrame;
        delete window.__ready;
      };
    }
  }, [renderMode, setFrame]);

  // Playback loop
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    const frameDuration = 1000 / fps;
    let accumulated = 0;

    const tick = (timestamp) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      accumulated += delta;

      while (accumulated >= frameDuration) {
        accumulated -= frameDuration;
        const next = frameRef.current + 1;
        if (next >= durationInFrames) {
          setFrame(0);
          setPlaying(false);
          return;
        }
        setFrame(next);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, fps, durationInFrames, setFrame]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => setPlaying((p) => !p), []);

  const value = {
    frame,
    fps,
    width,
    height,
    durationInFrames,
    playing,
    setFrame,
    play,
    pause,
    toggle,
  };

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}

export default TimelineContext;
