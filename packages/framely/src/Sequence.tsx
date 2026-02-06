import React, { useMemo } from 'react';
import TimelineContext, { useTimeline, type TimelineContextValue } from './context';

export interface SequenceProps {
  /** Frame at which this sequence starts (default: 0). */
  from?: number;
  /** How many frames this sequence lasts (defaults to rest of composition). */
  durationInFrames?: number;
  /** Optional label for debugging. */
  name?: string;
  /** 'absolute-fill' (default) positions the sequence to cover its parent; 'none' applies no layout. */
  layout?: 'absolute-fill' | 'none';
  /** Additional inline CSS styles applied to the wrapper div. */
  style?: React.CSSProperties;
  /** Additional CSS class name(s) applied to the wrapper div. */
  className?: string;
  /** Child elements rendered inside the sequence. */
  children?: React.ReactNode;
}

/**
 * Sequence offsets the timeline for its children.
 *
 * Children inside a Sequence see frame 0 when the parent timeline
 * reaches `from`. The Sequence is hidden outside its active range.
 */
export function Sequence({
  from = 0,
  durationInFrames: duration,
  name,
  style,
  layout = 'absolute-fill',
  className,
  children,
}: SequenceProps): React.ReactElement | null {
  const parent = useTimeline() as TimelineContextValue;
  const actualDuration: number = duration ?? parent.durationInFrames - from;

  // Calculate the child's local frame
  const localFrame: number = parent.frame - from;

  const contextValue: TimelineContextValue = useMemo(
    () => ({
      ...parent,
      frame: localFrame,
      durationInFrames: actualDuration,
      playing: parent.playing ?? false,
    }),
    [parent, localFrame, actualDuration]
  );

  const containerStyle: React.CSSProperties | undefined =
    layout === 'absolute-fill'
      ? {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          ...style,
        }
      : style;

  // Don't render if we're outside this sequence's range
  if (localFrame < 0 || localFrame >= actualDuration) {
    return null;
  }

  return (
    <TimelineContext.Provider value={contextValue}>
      <div
        style={containerStyle}
        className={className}
        data-sequence-name={name}
      >
        {children}
      </div>
    </TimelineContext.Provider>
  );
}
