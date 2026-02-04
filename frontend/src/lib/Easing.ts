/**
 * Easing functions for smooth animations.
 *
 * All functions take a value 0→1 and return a transformed 0→1.
 * Some functions (like back, elastic) may temporarily exceed this range.
 *
 * Remotion-compatible easing library with additional utilities.
 */

export type EasingFunction = (t: number) => number;

/**
 * Creates a cubic bezier easing function.
 *
 * @param {number} x1 - First control point X (0-1)
 * @param {number} y1 - First control point Y
 * @param {number} x2 - Second control point X (0-1)
 * @param {number} y2 - Second control point Y
 * @returns {function} Easing function
 *
 * Usage:
 *   const ease = Easing.bezier(0.25, 0.1, 0.25, 1); // CSS ease
 *   const value = ease(0.5);
 */
function bezier(x1: number, y1: number, x2: number, y2: number): EasingFunction {
  // Newton-Raphson iteration to find t for given x
  const NEWTON_ITERATIONS = 4;
  const NEWTON_MIN_SLOPE = 0.001;
  const SUBDIVISION_PRECISION = 0.0000001;
  const SUBDIVISION_MAX_ITERATIONS = 10;

  const kSplineTableSize = 11;
  const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

  const calcBezier = (t: number, a1: number, a2: number): number =>
    ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t * t + 3 * a1 * t;

  const getSlope = (t: number, a1: number, a2: number): number =>
    3 * (1 - 3 * a2 + 3 * a1) * t * t + 2 * (3 * a2 - 6 * a1) * t + 3 * a1;

  // Precompute samples
  const sampleValues = new Float32Array(kSplineTableSize);
  for (let i = 0; i < kSplineTableSize; ++i) {
    sampleValues[i] = calcBezier(i * kSampleStepSize, x1, x2);
  }

  const binarySubdivide = (x: number, a: number, b: number): number => {
    let currentX: number, currentT: number;
    let i = 0;
    do {
      currentT = a + (b - a) / 2;
      currentX = calcBezier(currentT, x1, x2) - x;
      if (currentX > 0) {
        b = currentT;
      } else {
        a = currentT;
      }
    } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
    return currentT;
  };

  const newtonRaphsonIterate = (x: number, guessT: number): number => {
    for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
      const currentSlope = getSlope(guessT, x1, x2);
      if (currentSlope === 0) return guessT;
      const currentX = calcBezier(guessT, x1, x2) - x;
      guessT -= currentX / currentSlope;
    }
    return guessT;
  };

  const getTForX = (x: number): number => {
    let intervalStart = 0;
    let currentSample = 1;
    const lastSample = kSplineTableSize - 1;

    for (; currentSample !== lastSample && sampleValues[currentSample] <= x; ++currentSample) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    const dist = (x - sampleValues[currentSample]) /
      (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    const guessForT = intervalStart + dist * kSampleStepSize;
    const initialSlope = getSlope(guessForT, x1, x2);

    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(x, guessForT);
    } else if (initialSlope === 0) {
      return guessForT;
    } else {
      return binarySubdivide(x, intervalStart, intervalStart + kSampleStepSize);
    }
  };

  return (t: number): number => {
    if (t === 0 || t === 1) return t;
    return calcBezier(getTForX(t), y1, y2);
  };
}

function poly(n = 4): EasingFunction {
  return (t: number) => Math.pow(t, n);
}

function back(overshoot = 1.70158): EasingFunction {
  return (t: number) => {
    const c3 = overshoot + 1;
    return c3 * t * t * t - overshoot * t * t;
  };
}

/**
 * Elastic easing - spring-like oscillation
 *
 * @param {number} bounciness - Oscillation amplitude (default: 1)
 * @returns {function} Easing function
 */
function elastic(bounciness = 1): EasingFunction {
  const p = 0.3 / bounciness;
  return (t: number): number => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
  };
}

function inFn(easing: EasingFunction): EasingFunction {
  return easing;
}

function out(easing: EasingFunction): EasingFunction {
  return (t: number) => 1 - easing(1 - t);
}

function inOut(easing: EasingFunction): EasingFunction {
  return (t: number) => {
    if (t < 0.5) {
      return easing(t * 2) / 2;
    }
    return 1 - easing((1 - t) * 2) / 2;
  };
}

/**
 * Complete Easing object with all functions
 */
export const Easing = {
  // Basic
  linear: (t: number): number => t,

  // Quadratic
  ease: bezier(0.25, 0.1, 0.25, 1), // CSS ease
  easeIn: (t: number): number => t * t,
  easeOut: (t: number): number => 1 - (1 - t) * (1 - t),
  easeInOut: (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),

  // Cubic
  cubic: (t: number): number => t * t * t,
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  // Quartic
  easeInQuart: (t: number): number => t * t * t * t,
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
  easeInOutQuart: (t: number): number =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,

  // Quintic
  easeInQuint: (t: number): number => t * t * t * t * t,
  easeOutQuint: (t: number): number => 1 - Math.pow(1 - t, 5),
  easeInOutQuint: (t: number): number =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,

  // Sine
  easeInSine: (t: number): number => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number): number => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,

  // Exponential
  exp: (t: number): number => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeInExpo: (t: number): number => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeOutExpo: (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // Circular
  circle: (t: number): number => 1 - Math.sqrt(1 - t * t),
  easeInCirc: (t: number): number => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t: number): number => Math.sqrt(1 - Math.pow(t - 1, 2)),
  easeInOutCirc: (t: number): number =>
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // Back (overshoot)
  easeInBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Elastic (spring-like)
  easeInElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t: number): number => {
    const c5 = (2 * Math.PI) / 4.5;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // Bounce
  bounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  easeInBounce: (t: number): number => {
    const bounceOut = Easing.bounce;
    return 1 - bounceOut(1 - t);
  },
  easeOutBounce: (t: number): number => Easing.bounce(t),
  easeInOutBounce: (t: number): number => {
    const bounceOut = Easing.bounce;
    return t < 0.5
      ? (1 - bounceOut(1 - 2 * t)) / 2
      : (1 + bounceOut(2 * t - 1)) / 2;
  },

  // Spring (damped oscillation)
  spring: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  // Step functions
  step0: (t: number): number => (t > 0 ? 1 : 0),
  step1: (t: number): number => (t >= 1 ? 1 : 0),

  // Factory functions for customizable easings
  poly,
  back,
  elastic,
  bezier,

  // Modifiers
  in: inFn,
  out,
  inOut,
};

export default Easing;
