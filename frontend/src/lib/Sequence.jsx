import { useMemo } from 'react';
import TimelineContext, { useTimeline } from './context';

/**
 * Sequence offsets the timeline for its children.
 *
 * Children inside a Sequence see frame 0 when the parent timeline
 * reaches `from`. The Sequence is hidden outside its active range.
 *
 * Props:
 *   from       - Frame at which this sequence starts (default: 0)
 *   duration   - How many frames this sequence lasts (optional, defaults to rest of video)
 *   name       - Optional label for debugging
 *   style      - Additional CSS styles
 *   layout     - 'absolute-fill' (default) or 'none'
 */
export function Sequence({
  from = 0,
  duration,
  name,
  style,
  layout = 'absolute-fill',
  children,
}) {
  const parent = useTimeline();
  const actualDuration = duration ?? parent.durationInFrames - from;

  // Calculate the child's local frame
  const localFrame = parent.frame - from;

  // Don't render if we're outside this sequence's range
  if (localFrame < 0 || localFrame >= actualDuration) {
    return null;
  }

  const contextValue = useMemo(
    () => ({
      ...parent,
      frame: localFrame,
      durationInFrames: actualDuration,
    }),
    [parent, localFrame, actualDuration]
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
    <TimelineContext.Provider value={contextValue}>
      <div
        style={containerStyle}
        data-sequence-name={name}
      >
        {children}
      </div>
    </TimelineContext.Provider>
  );
}
