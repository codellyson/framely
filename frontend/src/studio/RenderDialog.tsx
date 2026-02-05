/**
 * RenderDialog Component
 *
 * Modal dialog for configuring and starting video renders.
 * Supports codec selection, quality settings, and progress tracking.
 */

import { useState, useCallback, useEffect, useRef, type MouseEvent, type KeyboardEvent as ReactKeyboardEvent, type ChangeEvent, type ReactElement } from 'react';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

/** Supported codec configuration. */
interface Codec {
  id: string;
  name: string;
  ext: string;
  description: string;
}

/** Quality preset configuration. */
interface QualityPreset {
  id: string;
  name: string;
  crf: number;
  description: string;
}

/** Composition configuration passed in from the parent. */
export interface Composition {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  _templateId?: string;
  _isTemplate?: boolean;
}

/** Render progress event received via NDJSON stream. */
interface RenderProgressEvent {
  type: 'progress';
  percent: number;
  frame: number;
  total: number;
}

/** Render status event received via NDJSON stream. */
interface RenderStatusEvent {
  type: 'status';
  message: string;
}

/** Render complete event received via NDJSON stream. */
interface RenderCompleteEvent {
  type: 'complete';
  durationMs?: number;
  downloadUrl?: string;
}

/** Render error event received via NDJSON stream. */
interface RenderErrorEvent {
  type: 'error';
  message: string;
}

/** Union of all NDJSON stream events. */
type RenderStreamEvent =
  | RenderProgressEvent
  | RenderStatusEvent
  | RenderCompleteEvent
  | RenderErrorEvent;

/** Result stored after a successful render. */
interface RenderResult {
  durationMs?: number;
  downloadUrl?: string;
}

/** Props accepted by the RenderDialog component. */
export interface RenderDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called to close the dialog. */
  onClose: () => void;
  /** Current composition configuration. */
  composition: Composition | null;
  /** Current input props forwarded to the composition. */
  inputProps?: Record<string, unknown>;
  /** Called when a render completes successfully. */
  onRender?: (event: RenderCompleteEvent) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Available codecs with their configurations.
 */
const CODECS: Codec[] = [
  { id: 'h264', name: 'H.264 (MP4)', ext: 'mp4', description: 'Most compatible, good quality' },
  { id: 'h265', name: 'H.265 (HEVC)', ext: 'mp4', description: 'Better compression, less compatible' },
  { id: 'vp9', name: 'VP9 (WebM)', ext: 'webm', description: 'Good for web' },
  { id: 'prores', name: 'ProRes (MOV)', ext: 'mov', description: 'Professional editing' },
  { id: 'gif', name: 'GIF', ext: 'gif', description: 'Animated image, limited colors' },
];

/**
 * Quality presets.
 */
const QUALITY_PRESETS: QualityPreset[] = [
  { id: 'low', name: 'Low', crf: 28, description: 'Smaller file, lower quality' },
  { id: 'medium', name: 'Medium', crf: 23, description: 'Balanced' },
  { id: 'high', name: 'High', crf: 18, description: 'Recommended' },
  { id: 'lossless', name: 'Lossless', crf: 0, description: 'Best quality, large file' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * RenderDialog component.
 */
export function RenderDialog({
  open,
  onClose,
  composition,
  inputProps = {},
  onRender,
}: RenderDialogProps): ReactElement | null {
  // Render settings
  const [codec, setCodec] = useState<string>('h264');
  const [quality, setQuality] = useState<string>('high');
  const [customCrf, setCustomCrf] = useState<number>(18);
  const [scale, setScale] = useState<number>(1);
  const [startFrame, setStartFrame] = useState<number>(0);
  const [endFrame, setEndFrame] = useState<number>(composition?.durationInFrames ? composition.durationInFrames - 1 : 299);
  const [muted, setMuted] = useState<boolean>(false);
  const [parallel, setParallel] = useState<boolean>(false);
  const [concurrency, setConcurrency] = useState<number>(4);

  // Render state
  const [rendering, setRendering] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RenderResult | null>(null);

  // Update end frame when composition changes
  useEffect(() => {
    if (composition?.durationInFrames) {
      setEndFrame(composition.durationInFrames - 1);
    }
  }, [composition?.durationInFrames]);

  // Get CRF based on quality preset or custom
  const getCrf = (): number => {
    if (quality === 'custom') return customCrf;
    const preset = QUALITY_PRESETS.find((p) => p.id === quality);
    return preset ? preset.crf : 18;
  };

  // Calculate output dimensions
  const outputWidth: number = Math.round((composition?.width || 1920) * scale);
  const outputHeight: number = Math.round((composition?.height || 1080) * scale);

  // Calculate frame count
  const frameCount: number = endFrame - startFrame + 1;
  const duration: number = frameCount / (composition?.fps || 30);

  // Start render with NDJSON streaming
  const handleRender = useCallback(async (): Promise<void> => {
    if (!composition) return;

    setRendering(true);
    setProgress(0);
    setStatusMessage('Starting render...');
    setError(null);
    setResult(null);

    try {
      const response: Response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compositionId: composition.id,
          templateId: composition._templateId,
          isTemplate: composition._isTemplate,
          width: composition.width,
          height: composition.height,
          fps: composition.fps,
          durationInFrames: composition.durationInFrames,
          startFrame,
          endFrame,
          codec,
          crf: getCrf(),
          scale,
          inputProps,
          muted,
        }),
      });

      if (!response.ok) {
        throw new Error('Render request failed: ' + response.statusText);
      }

      // Read NDJSON stream
      const reader: ReadableStreamDefaultReader<Uint8Array> = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines: string[] = buffer.split('\n');
        buffer = lines.pop()!; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event: RenderStreamEvent = JSON.parse(line);
            if (event.type === 'progress') {
              setProgress(event.percent);
              setStatusMessage(`Frame ${event.frame}/${event.total}`);
            } else if (event.type === 'status') {
              setStatusMessage(event.message);
            } else if (event.type === 'complete') {
              setProgress(100);
              setResult(event);
              if (onRender) onRender(event);
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Invalid JSON') throw parseErr;
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRendering(false);
      setStatusMessage('');
    }
  }, [
    composition, codec, quality, customCrf, scale,
    startFrame, endFrame, muted, inputProps, onRender,
  ]);

  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape' && !rendering) onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, rendering, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const dialog: HTMLDivElement = dialogRef.current;
    const focusable: NodeListOf<HTMLElement> = dialog.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) focusable[0].focus();

    const handleTab = (e: globalThis.KeyboardEvent): void => {
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const first: HTMLElement = focusable[0];
      const last: HTMLElement = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  if (!open) return null;

  const selectedCodec: Codec | undefined = CODECS.find((c) => c.id === codec);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="render-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        fontFamily: 'system-ui, sans-serif',
      }}
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !rendering) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #333',
          }}
        >
          <h2 id="render-dialog-title" style={{ margin: 0, color: '#fff', fontSize: '18px' }}>
            Render Video
          </h2>
          <button
            onClick={onClose}
            disabled={rendering}
            aria-label="Close render dialog"
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: '24px',
              cursor: rendering ? 'not-allowed' : 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Composition info */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#252525',
              borderRadius: '8px',
              marginBottom: '20px',
            }}
          >
            <div style={{ color: '#fff', fontWeight: 500, marginBottom: '8px' }}>
              {composition?.id || 'Unknown'}
            </div>
            <div style={{ color: '#888', fontSize: '13px' }}>
              {composition?.width}x{composition?.height} @ {composition?.fps}fps • {composition?.durationInFrames} frames
            </div>
          </div>

          {/* Codec selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>
              Format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {CODECS.map((c: Codec) => (
                <button
                  key={c.id}
                  onClick={() => setCodec(c.id)}
                  disabled={rendering}
                  style={{
                    padding: '8px',
                    backgroundColor: codec === c.id ? '#3b82f6' : '#333',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: rendering ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
              {selectedCodec?.description}
            </div>
          </div>

          {/* Quality selection (not for GIF) */}
          {codec !== 'gif' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>
                Quality
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {QUALITY_PRESETS.map((p: QualityPreset) => (
                  <button
                    key={p.id}
                    onClick={() => setQuality(p.id)}
                    disabled={rendering}
                    style={{
                      padding: '8px',
                      backgroundColor: quality === p.id ? '#3b82f6' : '#333',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                      cursor: rendering ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scale */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>
              Scale ({outputWidth}x{outputHeight})
            </label>
            <input
              type="range"
              min="0.25"
              max="2"
              step="0.25"
              value={scale}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setScale(parseFloat(e.target.value))}
              disabled={rendering}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '11px' }}>
              <span>25%</span>
              <span>{scale * 100}%</span>
              <span>200%</span>
            </div>
          </div>

          {/* Frame range */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#aaa', fontSize: '13px', marginBottom: '8px' }}>
              Frame Range ({frameCount} frames, {duration.toFixed(2)}s)
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                value={startFrame}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setStartFrame(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={rendering}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#333',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#fff',
                }}
              />
              <span style={{ color: '#666' }}>to</span>
              <input
                type="number"
                value={endFrame}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEndFrame(Math.min(composition?.durationInFrames ? composition.durationInFrames - 1 : 299, parseInt(e.target.value) || 0))}
                disabled={rendering}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#333',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  color: '#fff',
                }}
              />
            </div>
          </div>

          {/* Options */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={muted}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setMuted(e.target.checked)}
                  disabled={rendering || codec === 'gif'}
                />
                Mute audio
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#aaa', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={parallel}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setParallel(e.target.checked)}
                  disabled={rendering}
                />
                Parallel rendering
              </label>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {/* Result display */}
          {result && (
            <div
              style={{
                padding: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10b981',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <div style={{ color: '#10b981', fontWeight: 500, marginBottom: '4px' }}>
                Render complete!
              </div>
              <div style={{ color: '#888', fontSize: '12px' }}>
                {result.durationMs && `Completed in ${(result.durationMs / 1000).toFixed(1)}s`}
              </div>
              {result.downloadUrl && (
                <a
                  href={result.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    padding: '6px 12px',
                    backgroundColor: '#10b981',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '12px',
                    textDecoration: 'none',
                  }}
                >
                  Download
                </a>
              )}
            </div>
          )}

          {/* Progress bar */}
          {rendering && (
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  height: '4px',
                  backgroundColor: '#333',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.2s',
                  }}
                />
              </div>
              <div style={{ color: '#888', fontSize: '12px', textAlign: 'center', marginTop: '4px' }}>
                {statusMessage || `Rendering... ${progress}%`}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '16px 20px',
            borderTop: '1px solid #333',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            disabled={rendering}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid #444',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '14px',
              cursor: rendering ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleRender}
            disabled={rendering}
            style={{
              padding: '10px 20px',
              backgroundColor: rendering ? '#1e40af' : '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              cursor: rendering ? 'not-allowed' : 'pointer',
            }}
          >
            {rendering ? 'Rendering...' : 'Start Render'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RenderDialog;
