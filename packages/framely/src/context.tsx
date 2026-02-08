import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';

// ─── Interfaces ──────────────────────────────────────────────────────────────

/**
 * The baseline shape stored in TimelineContext.
 * Contains the current frame and video configuration.
 */
export interface TimelineContextValue {
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
  /** Whether we are in render mode (controlled externally by Playwright). */
  renderMode: boolean;
  /** Set the current frame (clamped to valid range). */
  setFrame: (frame: number) => void;
  /** Start playback. */
  play: () => void;
  /** Pause playback. */
  pause: () => void;
  /** Toggle between play and pause. */
  toggle: () => void;
}

/**
 * Props accepted by the TimelineProvider component.
 */
export interface TimelineProviderProps {
  /** Frames per second. @default 30 */
  fps?: number;
  /** Composition width in pixels. @default 1920 */
  width?: number;
  /** Composition height in pixels. @default 1080 */
  height?: number;
  /** Total number of frames. @default 300 */
  durationInFrames?: number;
  /**
   * When true, the provider exposes `window.__setFrame()` for external
   * control (e.g. Playwright-based rendering).
   * @default false
   */
  renderMode?: boolean;
  /** Initial frame to display. @default 0 */
  initialFrame?: number;
  /** React children. */
  children: ReactNode;
  /** Called whenever the current frame changes. */
  onFrameChange?: (frame: number) => void;
}

// ─── Global augmentation for render-mode helpers ─────────────────────────────

declare global {
  interface Window {
    __setFrame?: (frame: number) => Promise<void>;
    __ready?: boolean;
    __renderedFrame?: number;
    __frameResolve?: (() => void) | null;
    __compositionWidth?: number;
    __compositionHeight?: number;
    __compositionFps?: number;
    __compositionDurationInFrames?: number;
    __FRAMELY_AUDIO_TRACKS?: Array<{ src: string; startFrame: number; volume: number }>;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

/**
 * TimelineContext holds the current frame and video configuration.
 * This is the core of the framework — every component that needs
 * to know "where in time we are" reads from this context.
 */
const TimelineContext = createContext<TimelineContextValue>({
  frame: 0,
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 300,
  playing: false,
  renderMode: false,
  setFrame: () => {},
  play: () => {},
  pause: () => {},
  toggle: () => {},
});

export function useTimeline(): TimelineContextValue {
  return useContext(TimelineContext);
}

export { TimelineContext };

// ─── Provider ────────────────────────────────────────────────────────────────

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
}: TimelineProviderProps): JSX.Element {
  const [frame, setFrameState] = useState<number>(initialFrame);
  const [playing, setPlaying] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number>(frame);

  // Keep ref in sync
  frameRef.current = frame;

  const setFrame = useCallback(
    (f: number): void => {
      const clamped = Math.max(0, Math.min(f, durationInFrames - 1));
      setFrameState(clamped);
      onFrameChange?.(clamped);
    },
    [durationInFrames, onFrameChange]
  );

  // In render mode, signal to the CLI that React has committed the current frame.
  // useEffect fires after the DOM has been updated, making this a reliable signal.
  useEffect(() => {
    if (renderMode) {
      window.__renderedFrame = frame;
      if (window.__frameResolve) {
        window.__frameResolve();
        window.__frameResolve = null;
      }
    }
  }, [renderMode, frame]);

  // Expose setFrame globally for the renderer (Playwright calls this)
  useEffect(() => {
    if (renderMode) {
      window.__setFrame = (f: number): Promise<void> => {
        return new Promise<void>((resolve) => {
          const clamped = Math.max(0, Math.min(f, durationInFrames - 1));
          // If already on this frame, resolve immediately
          if (window.__renderedFrame === clamped) {
            resolve();
            return;
          }
          // Store the resolve callback — the useEffect above will call it
          // once React commits the new frame to the DOM
          window.__frameResolve = resolve;
          setFrame(f);
        });
      };
      // Expose composition metadata for the CLI renderer
      window.__compositionWidth = width;
      window.__compositionHeight = height;
      window.__compositionFps = fps;
      window.__compositionDurationInFrames = durationInFrames;
      // Initialize audio tracks array for Audio components to register into
      window.__FRAMELY_AUDIO_TRACKS = [];
      window.__renderedFrame = initialFrame;
      window.__ready = true;
      return () => {
        delete window.__setFrame;
        delete window.__ready;
        delete window.__renderedFrame;
        delete window.__frameResolve;
        delete window.__compositionWidth;
        delete window.__compositionHeight;
        delete window.__compositionFps;
        delete window.__compositionDurationInFrames;
        delete window.__FRAMELY_AUDIO_TRACKS;
      };
    }
  }, [renderMode, setFrame, width, height, fps, durationInFrames, initialFrame]);

  // Playback loop
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = null;
      return;
    }

    const frameDuration = 1000 / fps;
    let accumulated = 0;

    const tick = (timestamp: number): void => {
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

  const play = useCallback((): void => setPlaying(true), []);
  const pause = useCallback((): void => setPlaying(false), []);
  const toggle = useCallback((): void => setPlaying((p) => !p), []);

  const value: TimelineContextValue = {
    frame,
    fps,
    width,
    height,
    durationInFrames,
    playing,
    renderMode,
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
