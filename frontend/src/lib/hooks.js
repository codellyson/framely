import { useTimeline } from './context';

/**
 * Returns the current frame number.
 * This is the primary hook your compositions will use.
 */
export function useCurrentFrame() {
  const { frame } = useTimeline();
  return frame;
}

/**
 * Returns the video configuration (fps, dimensions, duration).
 */
export function useVideoConfig() {
  const { fps, width, height, durationInFrames } = useTimeline();
  return { fps, width, height, durationInFrames };
}
