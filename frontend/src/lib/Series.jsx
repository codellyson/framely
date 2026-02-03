import { useMemo, Children, createContext, useContext } from 'react';
import TimelineContext, { useTimeline } from './context';

/**
 * Context for Series.Sequence to access its calculated timing
 */
const SeriesContext = createContext(null);

/**
 * Series renders children sequentially, auto-calculating `from` for each.
 *
 * Unlike Sequence (which requires explicit `from` values), Series automatically
 * places each child one after another in the timeline.
 *
 * Usage:
 *   <Series>
 *     <Series.Sequence durationInFrames={60}>
 *       <Scene1 />
 *     </Series.Sequence>
 *     <Series.Sequence durationInFrames={90}>
 *       <Scene2 />
 *     </Series.Sequence>
 *   </Series>
 */
export function Series({ children }) {
  const parent = useTimeline();
  const childArray = Children.toArray(children);

  // Calculate cumulative offsets for each child
  const timings = useMemo(() => {
    let currentOffset = 0;
    return childArray.map((child) => {
      const duration = child.props?.durationInFrames ?? 0;
      const offset = child.props?.offset ?? 0;
      const from = currentOffset + offset;
      currentOffset = from + duration;
      return { from, duration };
    });
  }, [childArray]);

  return (
    <>
      {childArray.map((child, index) => {
        const { from, duration } = timings[index];
        return (
          <SeriesContext.Provider key={index} value={{ from, duration, index }}>
            {child}
          </SeriesContext.Provider>
        );
      })}
    </>
  );
}

/**
 * Series.Sequence represents a scene within a Series.
 *
 * Props:
 *   durationInFrames - How many frames this sequence lasts (required unless last)
 *   offset           - Adjust timing: positive = delay, negative = overlap with previous
 *   layout           - 'absolute-fill' (default) or 'none'
 *   style            - Additional CSS styles
 *   name             - Optional label for debugging
 */
Series.Sequence = function SeriesSequence({
  durationInFrames,
  offset = 0,
  layout = 'absolute-fill',
  style,
  name,
  children,
}) {
  const parent = useTimeline();
  const seriesContext = useContext(SeriesContext);

  if (!seriesContext) {
    throw new Error('Series.Sequence must be used within a Series');
  }

  const { from, duration } = seriesContext;
  const actualDuration = durationInFrames ?? duration;

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
      <div style={containerStyle} data-series-sequence-name={name}>
        {children}
      </div>
    </TimelineContext.Provider>
  );
};

export default Series;
