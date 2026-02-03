import { useMemo, createContext, useContext } from 'react';
import TimelineContext, { useTimeline } from './context';

/**
 * Context for accessing loop metadata
 */
const LoopContext = createContext(null);

/**
 * Hook to access loop metadata when inside a Loop component.
 *
 * Returns:
 *   { iteration, durationInFrames } - Current iteration (0-indexed) and loop duration
 *   null - If not inside a Loop
 *
 * Usage:
 *   const loop = Loop.useLoop();
 *   if (loop) {
 *     console.log(`Iteration ${loop.iteration + 1}`);
 *   }
 */
function useLoop() {
  return useContext(LoopContext);
}

/**
 * Loop repeats its children for a specified number of iterations.
 *
 * The frame counter resets at the start of each iteration, so children
 * always see frames 0 to durationInFrames-1.
 *
 * Props:
 *   durationInFrames - Frames per iteration (required)
 *   times            - Number of repetitions (default: Infinity)
 *   layout           - 'absolute-fill' (default) or 'none'
 *   style            - Additional CSS styles
 *   name             - Optional label for debugging
 *
 * Usage:
 *   <Loop durationInFrames={30} times={3}>
 *     <PulseAnimation />
 *   </Loop>
 */
export function Loop({
  durationInFrames,
  times = Infinity,
  layout = 'absolute-fill',
  style,
  name,
  children,
}) {
  const parent = useTimeline();

  if (durationInFrames === undefined || durationInFrames <= 0) {
    throw new Error('Loop requires a positive durationInFrames');
  }

  // Calculate which iteration we're on and the local frame within that iteration
  const iteration = Math.floor(parent.frame / durationInFrames);
  const localFrame = parent.frame % durationInFrames;

  // Check if we've exceeded the number of loops
  if (times !== Infinity && iteration >= times) {
    return null;
  }

  const contextValue = useMemo(
    () => ({
      ...parent,
      frame: localFrame,
      durationInFrames,
    }),
    [parent, localFrame, durationInFrames]
  );

  const loopValue = useMemo(
    () => ({
      iteration,
      durationInFrames,
    }),
    [iteration, durationInFrames]
  );

  const containerStyle =
    layout === 'absolute-fill'
      ? {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          ...style,
        }
      : style;

  return (
    <LoopContext.Provider value={loopValue}>
      <TimelineContext.Provider value={contextValue}>
        <div style={containerStyle} data-loop-name={name} data-loop-iteration={iteration}>
          {children}
        </div>
      </TimelineContext.Provider>
    </LoopContext.Provider>
  );
}

// Attach the hook to the Loop component for convenient access
Loop.useLoop = useLoop;

export { useLoop };
export default Loop;
