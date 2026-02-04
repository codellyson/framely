/**
 * useSpring Hook
 *
 * Declarative spring animation driven by the current frame.
 * Automatically animates between values using physics-based spring dynamics.
 */

import { useRef, useMemo, type MutableRefObject } from 'react';
import { useTimeline } from './context';
import { spring } from './interpolate';

/** Options for configuring spring physics behavior. */
export interface UseSpringOptions {
  /** Initial value (defaults to 0 on first render, then tracks previous) */
  from?: number;
  /** Spring mass */
  mass?: number;
  /** Spring stiffness */
  stiffness?: number;
  /** Damping coefficient */
  damping?: number;
  /** Clamp overshoot */
  overshootClamping?: boolean;
}

/** Options for configuring spring physics on a sequence of values. */
export interface UseSpringSequenceOptions {
  /** Initial values (defaults to all 0s on first render, then tracks previous) */
  from?: number[];
  /** Spring mass */
  mass?: number;
  /** Spring stiffness */
  stiffness?: number;
  /** Damping coefficient */
  damping?: number;
  /** Clamp overshoot */
  overshootClamping?: boolean;
}

/** Internal state for tracking target changes in useSpring. */
interface SpringState {
  prevTarget: number | undefined;
  triggerFrame: number;
  fromValue: number;
  initialized: boolean;
}

/** Internal state for tracking target changes in useSpringSequence. */
interface SpringSequenceState {
  prevTargets: number[] | undefined;
  triggerFrame: number;
  fromValues: number[] | null;
  initialized: boolean;
}

/**
 * Animate a value using spring physics.
 *
 * When the target value changes, the spring animates from the current
 * position to the new target starting from that frame.
 *
 * @param {number} target - The target value to spring toward
 * @param {object} [options]
 * @param {number} [options.from] - Initial value (defaults to 0 on first render, then tracks previous)
 * @param {number} [options.mass=1] - Spring mass
 * @param {number} [options.stiffness=100] - Spring stiffness
 * @param {number} [options.damping=10] - Damping coefficient
 * @param {boolean} [options.overshootClamping=false] - Clamp overshoot
 * @returns {number} Current animated value
 *
 * @example
 * const scale = useSpring(isVisible ? 1 : 0, { stiffness: 200, damping: 15 });
 *
 * @example
 * // Animate position based on frame
 * const frame = useCurrentFrame();
 * const x = useSpring(frame >= 30 ? 200 : 0, { damping: 12 });
 */
export function useSpring(target: number, options: UseSpringOptions = {}): number {
  const {
    from: initialFrom,
    mass = 1,
    stiffness = 100,
    damping = 10,
    overshootClamping = false,
  } = options;

  const { frame, fps } = useTimeline();

  // Track when the target changes and from what value
  const state: MutableRefObject<SpringState> = useRef<SpringState>({
    prevTarget: undefined,
    triggerFrame: 0,
    fromValue: initialFrom ?? 0,
    initialized: false,
  });

  // Detect target changes
  if (!state.current.initialized) {
    state.current.prevTarget = target;
    state.current.fromValue = initialFrom ?? 0;
    state.current.triggerFrame = 0;
    state.current.initialized = true;
  } else if (target !== state.current.prevTarget) {
    // Target changed — compute current value as the new "from"
    const elapsed = frame - state.current.triggerFrame;
    state.current.fromValue = spring(elapsed, {
      from: state.current.fromValue,
      to: state.current.prevTarget,
      fps,
      mass,
      stiffness,
      damping,
      overshootClamping,
    });
    state.current.prevTarget = target;
    state.current.triggerFrame = frame;
  }

  // Compute spring value
  const elapsed = frame - state.current.triggerFrame;

  return spring(elapsed, {
    from: state.current.fromValue,
    to: target,
    fps,
    mass,
    stiffness,
    damping,
    overshootClamping,
  });
}

/**
 * Animate multiple values using spring physics.
 *
 * Same as useSpring but for an array of values. All values share
 * the same spring configuration.
 *
 * @param {number[]} targets - Array of target values
 * @param {object} [options] - Same as useSpring options
 * @returns {number[]} Array of animated values
 *
 * @example
 * const [x, y, rotation] = useSpringSequence(
 *   isActive ? [200, 100, 45] : [0, 0, 0],
 *   { stiffness: 150, damping: 12 }
 * );
 */
export function useSpringSequence(targets: number[], options: UseSpringSequenceOptions = {}): number[] {
  const {
    from: initialFroms,
    mass = 1,
    stiffness = 100,
    damping = 10,
    overshootClamping = false,
  } = options;

  const { frame, fps } = useTimeline();

  const state: MutableRefObject<SpringSequenceState> = useRef<SpringSequenceState>({
    prevTargets: undefined,
    triggerFrame: 0,
    fromValues: null,
    initialized: false,
  });

  if (!state.current.initialized) {
    state.current.prevTargets = [...targets];
    state.current.fromValues = initialFroms
      ? [...initialFroms]
      : targets.map(() => 0);
    state.current.triggerFrame = 0;
    state.current.initialized = true;
  } else {
    // Check if any target changed
    const changed = targets.some((t, i) => t !== state.current.prevTargets![i]);
    if (changed) {
      const elapsed = frame - state.current.triggerFrame;
      state.current.fromValues = state.current.prevTargets!.map((prevTarget, i) =>
        spring(elapsed, {
          from: state.current.fromValues![i],
          to: prevTarget,
          fps,
          mass,
          stiffness,
          damping,
          overshootClamping,
        }),
      );
      state.current.prevTargets = [...targets];
      state.current.triggerFrame = frame;
    }
  }

  const elapsed = frame - state.current.triggerFrame;

  return useMemo(
    () =>
      targets.map((target, i) =>
        spring(elapsed, {
          from: state.current.fromValues![i],
          to: target,
          fps,
          mass,
          stiffness,
          damping,
          overshootClamping,
        }),
      ),
    [elapsed, ...targets, fps, mass, stiffness, damping, overshootClamping],
  );
}

export default { useSpring, useSpringSequence };
