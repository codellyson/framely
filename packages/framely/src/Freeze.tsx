import { useMemo, type ReactNode } from 'react';
import TimelineContext, { useTimeline } from './context';

/**
 * Props for the Freeze component.
 */
export interface FreezeProps {
  /** The frame number children should see (required). */
  frame: number;
  /** Whether to freeze (default: true). If false, children see the normal frame. */
  active?: boolean;
  /** The content to render inside the freeze boundary. */
  children: ReactNode;
}

/**
 * Freeze pauses children at a specific frame.
 *
 * Children inside a Freeze component will always see the same frame value,
 * regardless of the actual timeline position. This is useful for:
 * - Pausing complex animations at a specific state
 * - Creating "freeze frame" effects
 * - Displaying a static frame from a video or animation
 *
 * Usage:
 *   // Freeze at frame 15
 *   <Freeze frame={15}>
 *     <MyAnimation />
 *   </Freeze>
 *
 *   // Conditional freeze
 *   <Freeze frame={30} active={shouldFreeze}>
 *     <MyAnimation />
 *   </Freeze>
 */
export function Freeze({ frame, active = true, children }: FreezeProps): ReactNode {
  const parent = useTimeline();

  if (frame === undefined) {
    throw new Error('Freeze requires a frame prop');
  }

  const contextValue = useMemo(
    () => ({
      ...parent,
      frame: active ? frame : parent.frame,
    }),
    [parent, frame, active]
  );

  // If not active, just render children without context override
  if (!active) {
    return children;
  }

  return (
    <TimelineContext.Provider value={contextValue}>
      {children}
    </TimelineContext.Provider>
  );
}

export default Freeze;
