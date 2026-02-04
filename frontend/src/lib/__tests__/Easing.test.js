import { describe, it, expect } from 'vitest';
import { Easing } from '../Easing';

describe('Easing', () => {
  // All standard easing functions should return 0 at t=0 and 1 at t=1
  const standardEasings = [
    'linear',
    'easeIn',
    'easeOut',
    'easeInOut',
    'easeInCubic',
    'easeOutCubic',
    'easeInOutCubic',
    'easeInQuart',
    'easeOutQuart',
    'easeInOutQuart',
    'easeInQuint',
    'easeOutQuint',
    'easeInOutQuint',
    'easeInSine',
    'easeOutSine',
    'easeInOutSine',
    'easeInExpo',
    'easeOutExpo',
    'easeInOutExpo',
    'easeInCirc',
    'easeOutCirc',
    'easeInOutCirc',
  ];

  for (const name of standardEasings) {
    it(`${name} returns 0 at t=0`, () => {
      expect(Easing[name](0)).toBeCloseTo(0, 5);
    });

    it(`${name} returns 1 at t=1`, () => {
      expect(Easing[name](1)).toBeCloseTo(1, 5);
    });

    it(`${name} returns a value between 0 and 1 at t=0.5`, () => {
      const result = Easing[name](0.5);
      expect(result).toBeGreaterThanOrEqual(-0.1);
      expect(result).toBeLessThanOrEqual(1.1);
    });
  }

  it('linear returns identity', () => {
    expect(Easing.linear(0.25)).toBe(0.25);
    expect(Easing.linear(0.5)).toBe(0.5);
    expect(Easing.linear(0.75)).toBe(0.75);
  });

  it('easeInCubic is cubic', () => {
    expect(Easing.easeInCubic(0.5)).toBeCloseTo(0.125, 5);
  });

  it('easeOutCubic is reversed cubic', () => {
    expect(Easing.easeOutCubic(0.5)).toBeCloseTo(0.875, 5);
  });

  describe('bezier', () => {
    it('creates a valid easing function', () => {
      const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
      expect(ease(0)).toBeCloseTo(0, 3);
      expect(ease(1)).toBeCloseTo(1, 3);
    });

    it('creates CSS ease-in-out equivalent', () => {
      const easeInOut = Easing.bezier(0.42, 0, 0.58, 1);
      expect(easeInOut(0.5)).toBeCloseTo(0.5, 1);
    });
  });

  describe('step functions', () => {
    it('step0 transitions at t=0', () => {
      expect(Easing.step0(0)).toBe(0);
      expect(Easing.step0(0.01)).toBe(1);
      expect(Easing.step0(1)).toBe(1);
    });

    it('step1 transitions at t=1', () => {
      expect(Easing.step1(0)).toBe(0);
      expect(Easing.step1(0.99)).toBe(0);
      expect(Easing.step1(1)).toBe(1);
    });
  });

  describe('bounce', () => {
    it('returns 0 at t=0 and 1 at t=1', () => {
      expect(Easing.easeOutBounce(0)).toBeCloseTo(0, 3);
      expect(Easing.easeOutBounce(1)).toBeCloseTo(1, 3);
    });
  });

  describe('back easing', () => {
    it('overshoots beyond 0-1 range', () => {
      // Back easing goes below 0 at the start
      const val = Easing.easeInBack(0.3);
      expect(val).toBeLessThan(0);
    });
  });

  describe('modifiers', () => {
    it('out() reverses an easing', () => {
      const easeOut = Easing.out(Easing.easeInCubic);
      expect(easeOut(0)).toBeCloseTo(0, 5);
      expect(easeOut(1)).toBeCloseTo(1, 5);
      // easeOutCubic at 0.5 should be > 0.5 (fast start, slow end)
      expect(easeOut(0.5)).toBeGreaterThan(0.5);
    });

    it('inOut() makes symmetric easing', () => {
      const easeInOut = Easing.inOut(Easing.easeInCubic);
      expect(easeInOut(0)).toBeCloseTo(0, 5);
      expect(easeInOut(0.5)).toBeCloseTo(0.5, 5);
      expect(easeInOut(1)).toBeCloseTo(1, 5);
    });
  });
});
