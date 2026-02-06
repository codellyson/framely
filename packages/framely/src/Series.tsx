import {
  useMemo,
  Children,
  createContext,
  useContext,
  type ReactNode,
  type CSSProperties,
  type ReactElement,
} from 'react';
import TimelineContext, { useTimeline } from './context';

/**
 * Internal context value provided to each Series.Sequence.
 */
interface SeriesContextValue {
  from: number;
  duration: number;
  index: number;
}

/**
 * Context for Series.Sequence to access its calculated timing.
 */
const SeriesContext = createContext<SeriesContextValue | null>(null);

/**
 * Props for the Series.Sequence compound component.
 */
export interface SeriesSequenceProps {
  /** How many frames this sequence lasts (required unless last). */
  durationInFrames: number;
  /** Adjust timing: positive = delay, negative = overlap with previous. */
  offset?: number;
  /** Layout mode: 'absolute-fill' (default) positions the sequence absolutely, 'none' uses no special layout. */
  layout?: 'absolute-fill' | 'none';
  /** Additional CSS styles applied to the sequence container. */
  style?: CSSProperties;
  /** Optional label for debugging. */
  name?: string;
  /** Content to render inside this sequence. */
  children?: ReactNode;
}

/**
 * Props for the Series component.
 */
export interface SeriesProps {
  /** Series.Sequence elements to render sequentially. */
  children: ReactNode;
}

/**
 * Timing information calculated for each child in the series.
 */
interface SequenceTiming {
  from: number;
  duration: number;
}

/**
 * Compound component type that includes Series.Sequence.
 */
interface SeriesComponent {
  (props: SeriesProps): ReactElement;
  Sequence: (props: SeriesSequenceProps) => ReactElement | null;
}

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
const Series: SeriesComponent = function Series({ children }: SeriesProps): ReactElement {
  const parent = useTimeline();
  const childArray = Children.toArray(children) as ReactElement<SeriesSequenceProps>[];

  // Calculate cumulative offsets for each child
  const timings: SequenceTiming[] = useMemo(() => {
    let currentOffset = 0;
    return childArray.map((child) => {
      const duration: number = child.props?.durationInFrames ?? 0;
      const offset: number = child.props?.offset ?? 0;
      const from: number = currentOffset + offset;
      currentOffset = from + duration;
      return { from, duration };
    });
  }, [childArray]);

  return (
    <>
      {childArray.map((child, index: number) => {
        const { from, duration } = timings[index];
        return (
          <SeriesContext.Provider key={index} value={{ from, duration, index }}>
            {child}
          </SeriesContext.Provider>
        );
      })}
    </>
  );
};

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
}: SeriesSequenceProps): ReactElement | null {
  const parent = useTimeline();
  const seriesContext = useContext(SeriesContext);

  if (!seriesContext) {
    throw new Error('Series.Sequence must be used within a Series');
  }

  const { from, duration } = seriesContext;
  const actualDuration: number = durationInFrames ?? duration;

  // Calculate the child's local frame
  const localFrame: number = parent.frame - from;

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

  const containerStyle: CSSProperties | undefined =
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

  return (
    <TimelineContext.Provider value={contextValue}>
      <div style={containerStyle} data-series-sequence-name={name}>
        {children}
      </div>
    </TimelineContext.Provider>
  );
};

export { Series };
export default Series;
