import { describe, it, expect } from 'vitest';
import { getCodecConfig, getCodecArgs, getAudioArgs, listCodecs } from '../utils/codecs.js';

describe('getCodecConfig', () => {
  it('returns config for valid codecs', () => {
    expect(getCodecConfig('h264')).toBeDefined();
    expect(getCodecConfig('h264').extension).toBe('mp4');
    expect(getCodecConfig('h265').extension).toBe('mp4');
    expect(getCodecConfig('vp9').extension).toBe('webm');
    expect(getCodecConfig('prores').extension).toBe('mov');
    expect(getCodecConfig('gif').extension).toBe('gif');
  });

  it('returns null for unknown codec', () => {
    expect(getCodecConfig('unknown')).toBeNull();
    expect(getCodecConfig('')).toBeNull();
  });
});

describe('getCodecArgs', () => {
  it('returns h264 args with libx264', () => {
    const args = getCodecArgs('h264', { crf: 18, fps: 30 });
    expect(args).toContain('libx264');
    expect(args).toContain('yuv420p');
    expect(args).toContain('18');
  });

  it('returns h265 args with libx265', () => {
    const args = getCodecArgs('h265', { crf: 23 });
    expect(args).toContain('libx265');
    expect(args).toContain('hvc1');
  });

  it('returns vp9 args', () => {
    const args = getCodecArgs('vp9', { crf: 31 });
    expect(args).toContain('libvpx-vp9');
    expect(args).toContain('-row-mt');
  });

  it('returns prores args', () => {
    const args = getCodecArgs('prores', {});
    expect(args).toContain('prores_ks');
  });

  it('throws for unknown codec', () => {
    expect(() => getCodecArgs('unknown', {})).toThrow('Unknown codec');
  });

  it('respects custom CRF', () => {
    const args = getCodecArgs('h264', { crf: 28 });
    expect(args).toContain('28');
  });
});

describe('getAudioArgs', () => {
  it('returns default audio args', () => {
    const args = getAudioArgs();
    expect(args).toContain('aac');
    expect(args).toContain('320k');
    expect(args).toContain('48000');
  });

  it('accepts custom options', () => {
    const args = getAudioArgs({ codec: 'libopus', bitrate: '128k', sampleRate: 44100 });
    expect(args).toContain('libopus');
    expect(args).toContain('128k');
    expect(args).toContain('44100');
  });
});

describe('listCodecs', () => {
  it('returns all codecs with required properties', () => {
    const codecs = listCodecs();
    expect(codecs.length).toBeGreaterThanOrEqual(6);

    for (const codec of codecs) {
      expect(codec).toHaveProperty('id');
      expect(codec).toHaveProperty('name');
      expect(codec).toHaveProperty('extension');
      expect(codec).toHaveProperty('description');
    }
  });

  it('includes h264 and gif', () => {
    const codecs = listCodecs();
    const ids = codecs.map((c) => c.id);
    expect(ids).toContain('h264');
    expect(ids).toContain('gif');
  });
});
