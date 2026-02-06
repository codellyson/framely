/**
 * TransitionSeries Component
 *
 * A container for sequences with transitions between them.
 * Unlike Series, TransitionSeries supports animated transitions
 * that can overlap between consecutive sequences.
 *
 * Usage:
 *   <TransitionSeries>
 *     <TransitionSeries.Sequence durationInFrames={60}>
 *       <SceneA />
 *     </TransitionSeries.Sequence>
 *     <TransitionSeries.Transition
 *       presentation={fade()}
 *       timing={{ durationInFrames: 30 }}
 *     />
 *     <TransitionSeries.Sequence durationInFrames={60}>
 *       <SceneB />
 *     </TransitionSeries.Sequence>
 *   </TransitionSeries>
 */

import React, {
  createContext,
  useContext,
  useMemo,
  Children,
} from 'react';
import { useTimeline, TimelineContext, type TimelineContextValue } from '../context';
import { AbsoluteFill } from '../AbsoluteFill';

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * The style object returned by a presentation's entering/exiting function.
 */
export interface TransitionPresentation {
  style: React.CSSProperties;
  transform?: string;
}

/**
 * A presentation object with entering and exiting animation functions.
 * Each function receives a progress value (0-1) and returns CSS styles.
 */
export interface TransitionPresentationConfig {
  entering?: (progress: number) => React.CSSProperties;
  exiting?: (progress: number) => React.CSSProperties;
}

/**
 * Timing configuration for a transition.
 */
export interface TransitionTimingConfig {
  /** Duration of the transition overlap in frames. */
  durationInFrames: number;
  /** Optional easing function. */
  easing?: (t: number) => number;
}

/**
 * The state provided via TransitionContext to children of a sequence.
 */
export interface TransitionState {
  /** Whether the sequence is currently entering (transition in progress). */
  entering: boolean;
  /** Whether the sequence is currently exiting (transition in progress). */
  exiting: boolean;
  /** Current transition progress (0-1). */
  progress: number;
  /** The current direction of the presentation. */
  presentationDirection: 'entering' | 'exiting' | 'stable';
}

/**
 * Props for TransitionSeries.
 */
export interface TransitionSeriesProps {
  /** The child elements (Sequence and Transition components). */
  children: React.ReactNode;
  /** Optional inline styles for the container. */
  style?: React.CSSProperties;
  /** Optional name for debugging / data attributes. */
  name?: string;
}

/**
 * Props for TransitionSeries.Sequence.
 */
export interface TransitionSequenceProps {
  /** Content to render within this sequence. */
  children: React.ReactNode;
  /** Duration of this sequence in frames. */
  durationInFrames: number;
  /** Frame offset to shift the start of this sequence. @default 0 */
  offset?: number;
  /** Optional inline styles. */
  style?: React.CSSProperties;
  /** Optional name for debugging. */
  name?: string;
}

/**
 * Props for TransitionSeries.Transition.
 */
export interface TransitionProps {
  /** Presentation object with entering/exiting animation functions. */
  presentation: TransitionPresentationConfig;
  /** Timing configuration for the transition. */
  timing: TransitionTimingConfig;
}

// ─── Internal types ──────────────────────────────────────────────────────────

interface ParsedSequence {
  element: React.ReactElement<TransitionSequenceProps>;
  index: number;
}

interface ParsedTransition {
  element: React.ReactElement<TransitionProps>;
  afterSequenceIndex: number;
}

interface SequenceTiming {
  startFrame: number;
  duration: number;
  overlapBefore: number;
  overlapAfter: number;
  transitionBefore: TransitionProps | undefined;
  transitionAfter: TransitionProps | undefined;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const TransitionContext = createContext<TransitionState>({
  entering: false,
  exiting: false,
  progress: 0,
  presentationDirection: 'entering',
});

/**
 * Hook to access transition state from within a sequence.
 */
export function useTransition(): TransitionState {
  return useContext(TransitionContext);
}

// ─── Compound component type ─────────────────────────────────────────────────

/**
 * The compound component type that includes Sequence and Transition
 * as static properties on TransitionSeries.
 */
interface TransitionSeriesComponent {
  (props: TransitionSeriesProps): React.JSX.Element;
  displayName: string;
  Sequence: React.FC<TransitionSequenceProps> & { displayName: string };
  Transition: React.FC<TransitionProps> & { displayName: string };
}

// ─── TransitionSeries ────────────────────────────────────────────────────────

/**
 * TransitionSeries - Container for sequences with transitions.
 */
const TransitionSeries: TransitionSeriesComponent = function TransitionSeries({
  children,
  style,
  name,
}: TransitionSeriesProps): React.JSX.Element {
  const parent: TimelineContextValue = useTimeline();
  const childArray = Children.toArray(children);

  // Parse children into sequences and transitions
  const { sequences, transitions } = useMemo(() => {
    const seqs: ParsedSequence[] = [];
    const trans: ParsedTransition[] = [];

    childArray.forEach((child, index) => {
      if (
        React.isValidElement(child) &&
        (child.type as React.FC & { displayName?: string })?.displayName ===
          'TransitionSeries.Sequence'
      ) {
        seqs.push({
          element: child as React.ReactElement<TransitionSequenceProps>,
          index,
        });
      } else if (
        React.isValidElement(child) &&
        (child.type as React.FC & { displayName?: string })?.displayName ===
          'TransitionSeries.Transition'
      ) {
        trans.push({
          element: child as React.ReactElement<TransitionProps>,
          afterSequenceIndex: seqs.length - 1,
        });
      }
    });

    return { sequences: seqs, transitions: trans };
  }, [childArray]);

  // Calculate timing for each sequence considering transitions
  const timings: SequenceTiming[] = useMemo(() => {
    let currentFrame = 0;
    const result: SequenceTiming[] = [];

    sequences.forEach((seq, seqIndex) => {
      const duration: number = seq.element.props.durationInFrames ?? 0;
      const offset: number = seq.element.props.offset ?? 0;

      // Find transition before this sequence
      const transitionBefore: ParsedTransition | undefined = transitions.find(
        (t) => t.afterSequenceIndex === seqIndex - 1
      );
      const transitionAfter: ParsedTransition | undefined = transitions.find(
        (t) => t.afterSequenceIndex === seqIndex
      );

      // Transition overlap reduces the start time
      const overlapBefore: number =
        transitionBefore?.element.props.timing?.durationInFrames ?? 0;
      const overlapAfter: number =
        transitionAfter?.element.props.timing?.durationInFrames ?? 0;

      const startFrame: number =
        currentFrame + offset - (seqIndex > 0 ? overlapBefore : 0);

      result.push({
        startFrame,
        duration,
        overlapBefore,
        overlapAfter,
        transitionBefore: transitionBefore?.element.props,
        transitionAfter: transitionAfter?.element.props,
      });

      // Next sequence starts after this one (minus any overlap)
      currentFrame = startFrame + duration;
    });

    return result;
  }, [sequences, transitions]);

  // Render sequences with transition effects
  return (
    <AbsoluteFill style={style} data-transition-series={name}>
      {sequences.map((seq, seqIndex) => {
        const timing: SequenceTiming = timings[seqIndex];
        const {
          startFrame,
          duration,
          overlapBefore,
          overlapAfter,
          transitionBefore,
          transitionAfter,
        } = timing;

        // Check if this sequence is currently visible
        const relativeFrame: number = parent.frame - startFrame;
        const isVisible: boolean =
          relativeFrame >= -overlapBefore &&
          relativeFrame < duration + overlapAfter;

        if (!isVisible) return null;

        // Calculate transition states
        const enteringProgress: number = transitionBefore
          ? Math.min(1, Math.max(0, relativeFrame / overlapBefore))
          : 1;

        const exitingProgress: number = transitionAfter
          ? Math.min(
              1,
              Math.max(
                0,
                (relativeFrame - (duration - overlapAfter)) / overlapAfter
              )
            )
          : 0;

        const isEntering: boolean = enteringProgress < 1;
        const isExiting: boolean = exitingProgress > 0;

        // Determine presentation
        let presentationStyle: React.CSSProperties = {};
        let presentationDirection: TransitionState['presentationDirection'] =
          'stable';

        if (isEntering && transitionBefore?.presentation) {
          presentationDirection = 'entering';
          presentationStyle =
            transitionBefore.presentation.entering?.(enteringProgress) ?? {};
        } else if (isExiting && transitionAfter?.presentation) {
          presentationDirection = 'exiting';
          presentationStyle =
            transitionAfter.presentation.exiting?.(exitingProgress) ?? {};
        }

        const transitionState: TransitionState = {
          entering: isEntering,
          exiting: isExiting,
          progress: isEntering
            ? enteringProgress
            : isExiting
              ? exitingProgress
              : 1,
          presentationDirection,
        };

        // Create modified timeline context for this sequence
        const sequenceFrame: number = Math.max(
          0,
          Math.min(duration - 1, relativeFrame)
        );
        const contextValue: TimelineContextValue = {
          ...parent,
          frame: sequenceFrame,
          durationInFrames: duration,
        };

        return (
          <TransitionContext.Provider key={seqIndex} value={transitionState}>
            <TimelineContext.Provider value={contextValue}>
              <AbsoluteFill
                style={{
                  ...presentationStyle,
                  zIndex: seqIndex,
                }}
              >
                {seq.element.props.children}
              </AbsoluteFill>
            </TimelineContext.Provider>
          </TransitionContext.Provider>
        );
      })}
    </AbsoluteFill>
  );
} as TransitionSeriesComponent;

TransitionSeries.displayName = 'TransitionSeries';

// ─── TransitionSeries.Sequence ───────────────────────────────────────────────

/**
 * TransitionSeries.Sequence - A scene within a TransitionSeries.
 * This component is used for configuration only.
 * The actual rendering is handled by TransitionSeries.
 */
const TransitionSequence: React.FC<TransitionSequenceProps> & {
  displayName: string;
} = function TransitionSequence(
  _props: TransitionSequenceProps
): React.JSX.Element | null {
  return null;
};

TransitionSequence.displayName = 'TransitionSeries.Sequence';
TransitionSeries.Sequence = TransitionSequence;

// ─── TransitionSeries.Transition ─────────────────────────────────────────────

/**
 * TransitionSeries.Transition - Defines a transition between sequences.
 * This component is used for configuration only.
 * The actual rendering is handled by TransitionSeries.
 */
const TransitionTransition: React.FC<TransitionProps> & {
  displayName: string;
} = function TransitionTransition(
  _props: TransitionProps
): React.JSX.Element | null {
  return null;
};

TransitionTransition.displayName = 'TransitionSeries.Transition';
TransitionSeries.Transition = TransitionTransition;

// ─── Helper functions ────────────────────────────────────────────────────────

/**
 * Helper to create a transition presentation object.
 */
export function createPresentation(config: TransitionPresentationConfig): TransitionPresentationConfig {
  return { entering: config.entering, exiting: config.exiting };
}

/**
 * Helper to create transition timing.
 */
export function createTiming(config: TransitionTimingConfig): TransitionTimingConfig {
  return { durationInFrames: config.durationInFrames, easing: config.easing };
}

export { TransitionSeries };
export default TransitionSeries;
