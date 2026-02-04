/**
 * KeyframeEditor Component
 *
 * Canvas-based visual keyframe curve editor for animation properties.
 * Supports adding, moving, deleting keyframes and selecting easing presets.
 */

import { useRef, useState, useCallback, useEffect, useMemo, type MouseEvent as ReactMouseEvent } from 'react';
import { Easing, type EasingFunction } from '../lib/Easing';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface Keyframe {
  frame: number;
  value: number;
  easing?: string;
}

export interface KeyframeEditorProps {
  /** Array of keyframes to display and edit */
  keyframes?: Keyframe[];
  /** Property name being edited */
  property?: string;
  /** Min/max value range [min, max] */
  valueRange?: [number, number];
  /** Total composition duration in frames */
  durationInFrames: number;
  /** Frames per second */
  fps: number;
  /** Current frame for playhead display */
  currentFrame?: number;
  /** Component height in pixels */
  height?: number;
  /** Called when a keyframe is changed: (index, updatedKeyframe) => void */
  onKeyframeChange?: (index: number, keyframe: Keyframe) => void;
  /** Called when a new keyframe is added: (frame, value) => void */
  onKeyframeAdd?: (frame: number, value: number) => void;
  /** Called when a keyframe is deleted: (index) => void */
  onKeyframeDelete?: (index: number) => void;
}

interface DragState {
  index: number;
  startX: number;
  startY: number;
  origFrame: number;
  origValue: number;
}

interface EasingMenuState {
  index: number;
  x: number;
  y: number;
}

interface EasingPreset {
  label: string;
  value: string;
  fn: EasingFunction;
}

interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const DIAMOND_SIZE: number = 8;
const PADDING: Padding = { top: 20, right: 20, bottom: 30, left: 50 };
const EASING_PRESETS: EasingPreset[] = [
  { label: 'Linear', value: 'linear', fn: Easing.linear },
  { label: 'Ease In', value: 'easeIn', fn: Easing.in(Easing.ease) },
  { label: 'Ease Out', value: 'easeOut', fn: Easing.out(Easing.ease) },
  { label: 'Ease In-Out', value: 'easeInOut', fn: Easing.inOut(Easing.ease) },
  { label: 'Ease In Cubic', value: 'easeInCubic', fn: Easing.in(Easing.cubic) },
  { label: 'Ease Out Cubic', value: 'easeOutCubic', fn: Easing.out(Easing.cubic) },
  { label: 'Ease In-Out Cubic', value: 'easeInOutCubic', fn: Easing.inOut(Easing.cubic) },
  { label: 'Bounce', value: 'bounce', fn: Easing.bounce },
  { label: 'Elastic', value: 'elastic', fn: Easing.elastic(1) },
];

/**
 * Get an easing function by name.
 */
function getEasingFn(name: string): EasingFunction {
  const preset = EASING_PRESETS.find((p) => p.value === name);
  return preset ? preset.fn : Easing.linear;
}

/**
 * KeyframeEditor component.
 */
export function KeyframeEditor({
  keyframes = [],
  property = 'value',
  valueRange = [0, 1],
  durationInFrames,
  fps,
  currentFrame,
  height = 160,
  onKeyframeChange,
  onKeyframeAdd,
  onKeyframeDelete,
}: KeyframeEditorProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(400);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [easingMenu, setEasingMenu] = useState<EasingMenuState | null>(null);

  const [minValue, maxValue] = valueRange;
  const valueSpan: number = maxValue - minValue || 1;

  // Graph area dimensions
  const graphLeft: number = PADDING.left;
  const graphTop: number = PADDING.top;
  const graphWidth: number = width - PADDING.left - PADDING.right;
  const graphHeight: number = height - PADDING.top - PADDING.bottom;

  // Conversions
  const frameToX = useCallback(
    (f: number): number => graphLeft + (f / durationInFrames) * graphWidth,
    [graphLeft, graphWidth, durationInFrames],
  );

  const valueToY = useCallback(
    (v: number): number => graphTop + graphHeight - ((v - minValue) / valueSpan) * graphHeight,
    [graphTop, graphHeight, minValue, valueSpan],
  );

  const xToFrame = useCallback(
    (x: number): number => Math.round(((x - graphLeft) / graphWidth) * durationInFrames),
    [graphLeft, graphWidth, durationInFrames],
  );

  const yToValue = useCallback(
    (y: number): number => {
      const normalized: number = 1 - (y - graphTop) / graphHeight;
      return minValue + normalized * valueSpan;
    },
    [graphTop, graphHeight, minValue, valueSpan],
  );

  // Sorted keyframes for rendering
  const sortedKeyframes = useMemo<Keyframe[]>(
    () => [...keyframes].sort((a, b) => a.frame - b.frame),
    [keyframes],
  );

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ─── Canvas rendering ────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) return;

    const dpr: number = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;

    // Vertical grid (time)
    const secondInterval: number = Math.max(1, Math.floor(durationInFrames / fps / 10));
    for (let s = 0; s <= durationInFrames / fps; s += secondInterval) {
      const x: number = frameToX(s * fps);
      ctx.beginPath();
      ctx.moveTo(x, graphTop);
      ctx.lineTo(x, graphTop + graphHeight);
      ctx.stroke();
    }

    // Horizontal grid (value)
    const valueSteps: number = 4;
    for (let i = 0; i <= valueSteps; i++) {
      const v: number = minValue + (i / valueSteps) * valueSpan;
      const y: number = valueToY(v);
      ctx.beginPath();
      ctx.moveTo(graphLeft, y);
      ctx.lineTo(graphLeft + graphWidth, y);
      ctx.stroke();

      // Value labels
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(
        Number.isInteger(v) ? v.toString() : v.toFixed(2),
        graphLeft - 6,
        y + 3,
      );
    }

    // Time labels
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let s = 0; s <= durationInFrames / fps; s += secondInterval) {
      const x: number = frameToX(s * fps);
      ctx.fillText(`${s}s`, x, height - 6);
    }

    // Draw interpolated curve
    if (sortedKeyframes.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;

      for (let px = graphLeft; px <= graphLeft + graphWidth; px++) {
        const f: number = ((px - graphLeft) / graphWidth) * durationInFrames;
        const v: number = evaluateAtFrame(sortedKeyframes, f, minValue, maxValue);
        const y: number = valueToY(v);
        if (px === graphLeft) {
          ctx.moveTo(px, y);
        } else {
          ctx.lineTo(px, y);
        }
      }
      ctx.stroke();
    } else if (sortedKeyframes.length === 1) {
      // Single keyframe: draw horizontal line at that value
      const y: number = valueToY(sortedKeyframes[0].value);
      ctx.beginPath();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(graphLeft, y);
      ctx.lineTo(graphLeft + graphWidth, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw keyframe diamonds
    sortedKeyframes.forEach((kf: Keyframe) => {
      const x: number = frameToX(kf.frame);
      const y: number = valueToY(kf.value);
      const originalIndex: number = keyframes.indexOf(kf);
      const isHovered: boolean = hovered === originalIndex;
      const isDragging: boolean = dragging?.index === originalIndex;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);

      const size: number = isHovered || isDragging ? DIAMOND_SIZE + 2 : DIAMOND_SIZE;
      ctx.fillStyle = isDragging ? '#fff' : isHovered ? '#818cf8' : '#6366f1';
      ctx.fillRect(-size / 2, -size / 2, size, size);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-size / 2, -size / 2, size, size);

      ctx.restore();
    });

    // Draw playhead
    if (currentFrame !== undefined) {
      const px: number = frameToX(currentFrame);
      ctx.beginPath();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.moveTo(px, graphTop);
      ctx.lineTo(px, graphTop + graphHeight);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw graph border
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(graphLeft, graphTop, graphWidth, graphHeight);
  }, [
    width, height, sortedKeyframes, keyframes, hovered, dragging,
    currentFrame, durationInFrames, fps,
    frameToX, valueToY, graphLeft, graphTop, graphWidth, graphHeight,
    minValue, maxValue, valueSpan,
  ]);

  // ─── Mouse interaction ───────────────────────────────────────────────────────

  const findKeyframeAt = useCallback(
    (clientX: number, clientY: number): number => {
      const canvas = canvasRef.current;
      if (!canvas) return -1;
      const rect: DOMRect = canvas.getBoundingClientRect();
      const mx: number = clientX - rect.left;
      const my: number = clientY - rect.top;

      for (let i = 0; i < keyframes.length; i++) {
        const kf: Keyframe = keyframes[i];
        const x: number = frameToX(kf.frame);
        const y: number = valueToY(kf.value);
        const dist: number = Math.sqrt((mx - x) ** 2 + (my - y) ** 2);
        if (dist < DIAMOND_SIZE + 4) return i;
      }
      return -1;
    },
    [keyframes, frameToX, valueToY],
  );

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>): void => {
      if (e.button !== 0) return;
      const idx: number = findKeyframeAt(e.clientX, e.clientY);
      if (idx >= 0) {
        e.preventDefault();
        setDragging({
          index: idx,
          startX: e.clientX,
          startY: e.clientY,
          origFrame: keyframes[idx].frame,
          origValue: keyframes[idx].value,
        });
      }
    },
    [findKeyframeAt, keyframes],
  );

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>): void => {
      if (!dragging) {
        // Hover detection
        const idx: number = findKeyframeAt(e.clientX, e.clientY);
        setHovered(idx >= 0 ? idx : null);
        return;
      }
    },
    [dragging, findKeyframeAt],
  );

  // Double-click to add keyframe
  const handleDoubleClick = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect: DOMRect = canvas.getBoundingClientRect();
      const mx: number = e.clientX - rect.left;
      const my: number = e.clientY - rect.top;

      // Only add if clicking within the graph area
      if (
        mx >= graphLeft &&
        mx <= graphLeft + graphWidth &&
        my >= graphTop &&
        my <= graphTop + graphHeight
      ) {
        const f: number = xToFrame(mx);
        const v: number = yToValue(my);
        const clampedV: number = Math.max(minValue, Math.min(maxValue, v));
        onKeyframeAdd?.(Math.max(0, Math.min(durationInFrames - 1, f)), clampedV);
      }
    },
    [graphLeft, graphWidth, graphTop, graphHeight, xToFrame, yToValue, minValue, maxValue, durationInFrames, onKeyframeAdd],
  );

  // Right-click for easing menu
  const handleContextMenu = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>): void => {
      e.preventDefault();
      const idx: number = findKeyframeAt(e.clientX, e.clientY);
      if (idx >= 0) {
        setEasingMenu({ index: idx, x: e.clientX, y: e.clientY });
      }
    },
    [findKeyframeAt],
  );

  // Global drag handling
  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e: globalThis.MouseEvent): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect: DOMRect = canvas.getBoundingClientRect();
      const mx: number = e.clientX - rect.left;
      const my: number = e.clientY - rect.top;

      const newFrame: number = Math.max(0, Math.min(durationInFrames - 1, xToFrame(mx)));
      const newValue: number = Math.max(minValue, Math.min(maxValue, yToValue(my)));

      onKeyframeChange?.(dragging.index, {
        ...keyframes[dragging.index],
        frame: newFrame,
        value: newValue,
      });
    };

    const handleUp = (): void => setDragging(null);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, keyframes, durationInFrames, minValue, maxValue, xToFrame, yToValue, onKeyframeChange]);

  // Close easing menu on click
  useEffect(() => {
    if (!easingMenu) return;
    const close = (): void => setEasingMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [easingMenu]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          borderBottom: '1px solid #333',
          backgroundColor: '#252525',
        }}
      >
        <span style={{ color: '#aaa', fontSize: '12px', fontWeight: 500 }}>
          {property}
        </span>
        <span style={{ color: '#666', fontSize: '11px' }}>
          {keyframes.length} keyframe{keyframes.length !== 1 ? 's' : ''}
          {' | Double-click to add'}
        </span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height,
          cursor: dragging ? 'grabbing' : hovered !== null ? 'grab' : 'crosshair',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => !dragging && setHovered(null)}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />

      {/* Easing preset menu */}
      {easingMenu && (
        <div
          style={{
            position: 'fixed',
            top: easingMenu.y,
            left: easingMenu.x,
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '6px',
            padding: '4px 0',
            zIndex: 100,
            minWidth: '160px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <div
            style={{
              padding: '4px 12px 6px',
              fontSize: '10px',
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Easing
          </div>
          {EASING_PRESETS.map((preset: EasingPreset) => (
            <button
              key={preset.value}
              onClick={() => {
                onKeyframeChange?.(easingMenu.index, {
                  ...keyframes[easingMenu.index],
                  easing: preset.value,
                });
                setEasingMenu(null);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '5px 16px',
                background:
                  keyframes[easingMenu.index]?.easing === preset.value
                    ? 'rgba(99,102,241,0.2)'
                    : 'none',
                border: 'none',
                color: '#ddd',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e: ReactMouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={(e: ReactMouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor =
                  keyframes[easingMenu.index]?.easing === preset.value
                    ? 'rgba(99,102,241,0.2)'
                    : 'transparent';
              }}
            >
              {preset.label}
            </button>
          ))}
          <div style={{ borderTop: '1px solid #444', margin: '4px 0' }} />
          <button
            onClick={() => {
              onKeyframeDelete?.(easingMenu.index);
              setEasingMenu(null);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '5px 16px',
              background: 'none',
              border: 'none',
              color: '#ef4444',
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e: ReactMouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e: ReactMouseEvent<HTMLButtonElement>) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Delete Keyframe
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Evaluate the interpolated value at a given frame based on keyframes.
 */
function evaluateAtFrame(
  sortedKeyframes: Keyframe[],
  frame: number,
  minValue: number,
  maxValue: number,
): number {
  if (sortedKeyframes.length === 0) return minValue;
  if (sortedKeyframes.length === 1) return sortedKeyframes[0].value;

  // Before first keyframe
  if (frame <= sortedKeyframes[0].frame) return sortedKeyframes[0].value;
  // After last keyframe
  if (frame >= sortedKeyframes[sortedKeyframes.length - 1].frame) {
    return sortedKeyframes[sortedKeyframes.length - 1].value;
  }

  // Find segment
  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    const kf1: Keyframe = sortedKeyframes[i];
    const kf2: Keyframe = sortedKeyframes[i + 1];
    if (frame >= kf1.frame && frame <= kf2.frame) {
      const span: number = kf2.frame - kf1.frame;
      if (span === 0) return kf1.value;
      const t: number = (frame - kf1.frame) / span;
      const easingFn: EasingFunction = getEasingFn(kf1.easing || 'linear');
      const eased: number = easingFn(t);
      return kf1.value + eased * (kf2.value - kf1.value);
    }
  }

  return sortedKeyframes[sortedKeyframes.length - 1].value;
}

export { evaluateAtFrame };
export default KeyframeEditor;
