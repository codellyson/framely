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

import { createContext, useContext, useMemo, Children, cloneElement } from 'react';
import { useTimeline, TimelineContext } from '../context';
import { AbsoluteFill } from '../AbsoluteFill';

// Context for transition state
const TransitionContext = createContext({
  entering: false,
  exiting: false,
  progress: 0,
  presentationDirection: 'entering',
});

/**
 * Hook to access transition state from within a sequence.
 *
 * @returns {{ entering: boolean, exiting: boolean, progress: number, presentationDirection: string }}
 */
export function useTransition() {
  return useContext(TransitionContext);
}

/**
 * TransitionSeries - Container for sequences with transitions.
 */
export function TransitionSeries({ children, style, name }) {
  const parent = useTimeline();
  const childArray = Children.toArray(children);

  // Parse children into sequences and transitions
  const { sequences, transitions } = useMemo(() => {
    const seqs = [];
    const trans = [];

    childArray.forEach((child, index) => {
      if (child.type?.displayName === 'TransitionSeries.Sequence') {
        seqs.push({ element: child, index });
      } else if (child.type?.displayName === 'TransitionSeries.Transition') {
        trans.push({ element: child, afterSequenceIndex: seqs.length - 1 });
      }
    });

    return { sequences: seqs, transitions: trans };
  }, [childArray]);

  // Calculate timing for each sequence considering transitions
  const timings = useMemo(() => {
    let currentFrame = 0;
    const result = [];

    sequences.forEach((seq, seqIndex) => {
      const duration = seq.element.props.durationInFrames ?? 0;
      const offset = seq.element.props.offset ?? 0;

      // Find transition before this sequence
      const transitionBefore = transitions.find((t) => t.afterSequenceIndex === seqIndex - 1);
      const transitionAfter = transitions.find((t) => t.afterSequenceIndex === seqIndex);

      // Transition overlap reduces the start time
      const overlapBefore = transitionBefore?.element.props.timing?.durationInFrames ?? 0;
      const overlapAfter = transitionAfter?.element.props.timing?.durationInFrames ?? 0;

      const startFrame = currentFrame + offset - (seqIndex > 0 ? overlapBefore : 0);

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
        const timing = timings[seqIndex];
        const { startFrame, duration, overlapBefore, overlapAfter, transitionBefore, transitionAfter } = timing;

        // Check if this sequence is currently visible
        const relativeFrame = parent.frame - startFrame;
        const isVisible = relativeFrame >= -overlapBefore && relativeFrame < duration + overlapAfter;

        if (!isVisible) return null;

        // Calculate transition states
        const enteringProgress = transitionBefore
          ? Math.min(1, Math.max(0, relativeFrame / overlapBefore))
          : 1;

        const exitingProgress = transitionAfter
          ? Math.min(1, Math.max(0, (relativeFrame - (duration - overlapAfter)) / overlapAfter))
          : 0;

        const isEntering = enteringProgress < 1;
        const isExiting = exitingProgress > 0;

        // Determine presentation
        let presentationStyle = {};
        let presentationDirection = 'stable';

        if (isEntering && transitionBefore?.presentation) {
          presentationDirection = 'entering';
          presentationStyle = transitionBefore.presentation.entering?.(enteringProgress) ?? {};
        } else if (isExiting && transitionAfter?.presentation) {
          presentationDirection = 'exiting';
          presentationStyle = transitionAfter.presentation.exiting?.(exitingProgress) ?? {};
        }

        const transitionState = {
          entering: isEntering,
          exiting: isExiting,
          progress: isEntering ? enteringProgress : isExiting ? exitingProgress : 1,
          presentationDirection,
        };

        // Create modified timeline context for this sequence
        const sequenceFrame = Math.max(0, Math.min(duration - 1, relativeFrame));
        const contextValue = {
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
}

TransitionSeries.displayName = 'TransitionSeries';

/**
 * TransitionSeries.Sequence - A scene within a TransitionSeries.
 */
function TransitionSequence({ children, durationInFrames, offset = 0, style, name }) {
  // This component is used for configuration only.
  // The actual rendering is handled by TransitionSeries.
  return null;
}

TransitionSequence.displayName = 'TransitionSeries.Sequence';
TransitionSeries.Sequence = TransitionSequence;

/**
 * TransitionSeries.Transition - Defines a transition between sequences.
 *
 * Props:
 *   presentation - Object with entering/exiting functions that return styles
 *   timing - Object with durationInFrames (and optional easing)
 */
function TransitionTransition({ presentation, timing }) {
  // This component is used for configuration only.
  // The actual rendering is handled by TransitionSeries.
  return null;
}

TransitionTransition.displayName = 'TransitionSeries.Transition';
TransitionSeries.Transition = TransitionTransition;

/**
 * Helper to create a transition presentation object.
 *
 * @param {object} config
 * @param {function} config.entering - (progress: number) => CSSProperties
 * @param {function} config.exiting - (progress: number) => CSSProperties
 * @returns {{ entering: function, exiting: function }}
 */
export function createPresentation({ entering, exiting }) {
  return { entering, exiting };
}

/**
 * Helper to create transition timing.
 *
 * @param {object} config
 * @param {number} config.durationInFrames
 * @param {function} [config.easing]
 * @returns {{ durationInFrames: number, easing?: function }}
 */
export function createTiming({ durationInFrames, easing }) {
  return { durationInFrames, easing };
}

export default TransitionSeries;
