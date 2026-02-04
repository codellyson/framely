import { describe, it, expect } from 'vitest';
import { interpolate, spring } from '../interpolate';
import { Easing } from '../Easing';

describe('interpolate', () => {
  it('linearly maps between two ranges', () => {
    expect(interpolate(0, [0, 100], [0, 1])).toBe(0);
    expect(interpolate(50, [0, 100], [0, 1])).toBe(0.5);
    expect(interpolate(100, [0, 100], [0, 1])).toBe(1);
  });

  it('clamps by default', () => {
    expect(interpolate(-10, [0, 100], [0, 1])).toBe(0);
    expect(interpolate(200, [0, 100], [0, 1])).toBe(1);
  });

  it('extends when extrapolateLeft is "extend"', () => {
    const result = interpolate(-50, [0, 100], [0, 1], { extrapolateLeft: 'extend' });
    expect(result).toBe(-0.5);
  });

  it('extends when extrapolateRight is "extend"', () => {
    const result = interpolate(200, [0, 100], [0, 1], { extrapolateRight: 'extend' });
    expect(result).toBe(2);
  });

  it('returns identity value when identity extrapolation', () => {
    expect(interpolate(-10, [0, 100], [0, 1], { extrapolateLeft: 'identity' })).toBe(-10);
    expect(interpolate(200, [0, 100], [0, 1], { extrapolateRight: 'identity' })).toBe(200);
  });

  it('handles multi-segment interpolation', () => {
    // Fade in then out
    expect(interpolate(0, [0, 30, 60], [0, 1, 0])).toBe(0);
    expect(interpolate(15, [0, 30, 60], [0, 1, 0])).toBe(0.5);
    expect(interpolate(30, [0, 30, 60], [0, 1, 0])).toBe(1);
    expect(interpolate(45, [0, 30, 60], [0, 1, 0])).toBe(0.5);
    expect(interpolate(60, [0, 30, 60], [0, 1, 0])).toBe(0);
  });

  it('handles reverse ranges', () => {
    expect(interpolate(0, [0, 100], [1, 0])).toBe(1);
    expect(interpolate(100, [0, 100], [1, 0])).toBe(0);
  });

  it('handles negative output ranges', () => {
    expect(interpolate(50, [0, 100], [-100, 100])).toBe(0);
    expect(interpolate(0, [0, 100], [-100, 100])).toBe(-100);
  });

  it('applies easing', () => {
    const result = interpolate(50, [0, 100], [0, 1], { easing: Easing.easeInCubic });
    // Cubic easing at 0.5 progress: 0.5^3 = 0.125
    expect(result).toBeCloseTo(0.125, 2);
  });

  it('throws if ranges have different lengths', () => {
    expect(() => interpolate(0, [0, 100], [0])).toThrow();
  });

  it('throws if inputRange has fewer than 2 elements', () => {
    expect(() => interpolate(0, [0], [0])).toThrow();
  });

  it('throws if inputRange is not ascending', () => {
    expect(() => interpolate(0, [100, 0], [0, 1])).toThrow();
  });

  it('handles same input values (zero-width segment)', () => {
    expect(interpolate(5, [5, 5, 10], [0, 1, 2])).toBe(1);
  });
});

describe('spring', () => {
  it('returns "from" value at frame 0', () => {
    expect(spring(0)).toBe(0);
  });

  it('approaches "to" value at high frame numbers', () => {
    const result = spring(300, { fps: 30 });
    expect(result).toBeCloseTo(1, 2);
  });

  it('respects delay', () => {
    expect(spring(0, { delay: 10 })).toBe(0);
    expect(spring(5, { delay: 10 })).toBe(0);
    // After delay, should start moving
    expect(spring(15, { delay: 10 })).toBeGreaterThan(0);
  });

  it('respects from/to range', () => {
    expect(spring(0, { from: 100, to: 200 })).toBe(100);
    const result = spring(300, { from: 100, to: 200, fps: 30 });
    expect(result).toBeCloseTo(200, 0);
  });

  it('overshoots with low damping (underdamped)', () => {
    // With low damping, the spring should overshoot the target
    const values = [];
    for (let f = 0; f < 60; f++) {
      values.push(spring(f, { damping: 5, stiffness: 100 }));
    }
    // Should exceed 1 at some point
    expect(Math.max(...values)).toBeGreaterThan(1);
  });

  it('clamps overshoot when overshootClamping is true', () => {
    const values = [];
    for (let f = 0; f < 60; f++) {
      values.push(spring(f, { damping: 5, stiffness: 100, overshootClamping: true }));
    }
    // Should never exceed 1
    expect(Math.max(...values)).toBeLessThanOrEqual(1);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
  });

  it('does not oscillate with high damping (overdamped)', () => {
    const values = [];
    for (let f = 0; f < 60; f++) {
      values.push(spring(f, { damping: 50 }));
    }
    // Should monotonically increase (never overshoot)
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1] - 0.001);
    }
  });
});
