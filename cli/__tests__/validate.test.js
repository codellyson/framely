import { describe, it, expect } from 'vitest';
import {
  validateCrf,
  validatePort,
  validateDimension,
  validateFps,
  validateQuality,
  validateScale,
  validateFrontendUrl,
  validateFrameRange,
} from '../utils/validate.js';

describe('validateCrf', () => {
  it('accepts valid CRF values', () => {
    expect(validateCrf(0, 'h264')).toBe(0);
    expect(validateCrf(18, 'h264')).toBe(18);
    expect(validateCrf(51, 'h264')).toBe(51);
  });

  it('rejects out-of-range CRF', () => {
    expect(() => validateCrf(-1, 'h264')).toThrow('CRF must be between 0 and 51');
    expect(() => validateCrf(52, 'h264')).toThrow('CRF must be between 0 and 51');
  });

  it('rejects NaN', () => {
    expect(() => validateCrf(NaN, 'h264')).toThrow('must be a number');
  });

  it('passes through for ProRes (no CRF)', () => {
    expect(validateCrf(100, 'prores')).toBe(100);
  });
});

describe('validatePort', () => {
  it('accepts valid ports', () => {
    expect(validatePort(3000)).toBe(3000);
    expect(validatePort('8080')).toBe(8080);
    expect(validatePort(65535)).toBe(65535);
  });

  it('rejects invalid ports', () => {
    expect(() => validatePort(0)).toThrow();
    expect(() => validatePort(1023)).toThrow();
    expect(() => validatePort(70000)).toThrow();
    expect(() => validatePort('abc')).toThrow();
  });
});

describe('validateDimension', () => {
  it('accepts valid dimensions', () => {
    expect(validateDimension(1920, 'width')).toBe(1920);
    expect(validateDimension('1080', 'height')).toBe(1080);
  });

  it('rejects zero or negative', () => {
    expect(() => validateDimension(0, 'width')).toThrow('positive integer');
    expect(() => validateDimension(-100, 'height')).toThrow('positive integer');
  });

  it('rejects values over 7680', () => {
    expect(() => validateDimension(8000, 'width')).toThrow('maximum');
  });
});

describe('validateFps', () => {
  it('accepts valid FPS', () => {
    expect(validateFps(30)).toBe(30);
    expect(validateFps(60)).toBe(60);
    expect(validateFps('24')).toBe(24);
  });

  it('rejects out-of-range FPS', () => {
    expect(() => validateFps(0)).toThrow();
    expect(() => validateFps(121)).toThrow();
  });
});

describe('validateQuality', () => {
  it('accepts valid quality', () => {
    expect(validateQuality(0)).toBe(0);
    expect(validateQuality(80)).toBe(80);
    expect(validateQuality(100)).toBe(100);
  });

  it('rejects out-of-range', () => {
    expect(() => validateQuality(-1)).toThrow();
    expect(() => validateQuality(101)).toThrow();
  });
});

describe('validateScale', () => {
  it('accepts valid scales', () => {
    expect(validateScale(1)).toBe(1);
    expect(validateScale(0.5)).toBe(0.5);
    expect(validateScale(2)).toBe(2);
  });

  it('rejects out-of-range', () => {
    expect(() => validateScale(0)).toThrow();
    expect(() => validateScale(11)).toThrow();
  });
});

describe('validateFrontendUrl', () => {
  it('accepts localhost URLs', () => {
    expect(validateFrontendUrl('http://localhost:3000')).toBe('http://localhost:3000');
    expect(validateFrontendUrl('http://127.0.0.1:3000')).toBe('http://127.0.0.1:3000');
  });

  it('rejects non-localhost without allowRemote', () => {
    expect(() => validateFrontendUrl('http://example.com:3000')).toThrow('localhost');
  });

  it('accepts remote URLs with allowRemote', () => {
    expect(validateFrontendUrl('http://example.com:3000', true)).toBe('http://example.com:3000');
  });

  it('rejects non-http protocols', () => {
    expect(() => validateFrontendUrl('ftp://localhost:3000')).toThrow('http or https');
  });

  it('rejects invalid URLs', () => {
    expect(() => validateFrontendUrl('not-a-url')).toThrow('Invalid');
  });
});

describe('validateFrameRange', () => {
  it('accepts valid ranges', () => {
    expect(() => validateFrameRange(0, 99, 300)).not.toThrow();
    expect(() => validateFrameRange(0, 299, 300)).not.toThrow();
  });

  it('rejects negative start', () => {
    expect(() => validateFrameRange(-1, 99, 300)).toThrow('>= 0');
  });

  it('rejects end >= duration', () => {
    expect(() => validateFrameRange(0, 300, 300)).toThrow('< 300');
  });

  it('rejects start > end', () => {
    expect(() => validateFrameRange(100, 50, 300)).toThrow('<=');
  });
});
