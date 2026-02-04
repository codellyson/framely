import { useTimeline } from './context';

/**
 * Video configuration returned by `useVideoConfig`.
 */
export interface VideoConfig {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
}

/**
 * Returns the current frame number.
 * This is the primary hook your compositions will use.
 */
export function useCurrentFrame(): number {
  const { frame } = useTimeline();
  return frame;
}

/**
 * Returns the video configuration (fps, dimensions, duration).
 */
export function useVideoConfig(): VideoConfig {
  const { fps, width, height, durationInFrames } = useTimeline();
  return { fps, width, height, durationInFrames };
}
