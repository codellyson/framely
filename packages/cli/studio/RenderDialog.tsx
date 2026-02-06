/**
 * RenderDialog Component
 *
 * Modal dialog for configuring and starting video renders.
 * Supports codec selection, quality settings, and progress tracking.
 */

import { useState, useCallback, useEffect, useRef, type MouseEvent, type ChangeEvent, type ReactElement } from 'react';
import './styles/dialogs.css';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

interface Codec {
  id: string;
  name: string;
  ext: string;
  description: string;
}

interface QualityPreset {
  id: string;
  name: string;
  crf: number;
  description: string;
}

export interface Composition {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  _templateId?: string;
  _isTemplate?: boolean;
}

interface RenderProgressEvent {
  type: 'progress';
  percent: number;
  frame: number;
  total: number;
}

interface RenderStatusEvent {
  type: 'status';
  message: string;
}

interface RenderCompleteEvent {
  type: 'complete';
  durationMs?: number;
  downloadUrl?: string;
}

interface RenderErrorEvent {
  type: 'error';
  message: string;
}

type RenderStreamEvent =
  | RenderProgressEvent
  | RenderStatusEvent
  | RenderCompleteEvent
  | RenderErrorEvent;

interface RenderResult {
  durationMs?: number;
  downloadUrl?: string;
}

export interface RenderDialogProps {
  open: boolean;
  onClose: () => void;
  composition: Composition | null;
  inputProps?: Record<string, unknown>;
  onRender?: (event: RenderCompleteEvent) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CODECS: Codec[] = [
  { id: 'h264', name: 'H.264 (MP4)', ext: 'mp4', description: 'Most compatible, good quality' },
  { id: 'h265', name: 'H.265 (HEVC)', ext: 'mp4', description: 'Better compression, less compatible' },
  { id: 'vp9', name: 'VP9 (WebM)', ext: 'webm', description: 'Good for web' },
  { id: 'prores', name: 'ProRes (MOV)', ext: 'mov', description: 'Professional editing' },
  { id: 'gif', name: 'GIF', ext: 'gif', description: 'Animated image, limited colors' },
];

const QUALITY_PRESETS: QualityPreset[] = [
  { id: 'low', name: 'Low', crf: 28, description: 'Smaller file, lower quality' },
  { id: 'medium', name: 'Medium', crf: 23, description: 'Balanced' },
  { id: 'high', name: 'High', crf: 18, description: 'Recommended' },
  { id: 'lossless', name: 'Lossless', crf: 0, description: 'Best quality, large file' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RenderDialog({
  open,
  onClose,
  composition,
  inputProps = {},
  onRender,
}: RenderDialogProps): ReactElement | null {
  const [codec, setCodec] = useState<string>('h264');
  const [quality, setQuality] = useState<string>('high');
  const [customCrf, setCustomCrf] = useState<number>(18);
  const [scale, setScale] = useState<number>(1);
  const [startFrame, setStartFrame] = useState<number>(0);
  const [endFrame, setEndFrame] = useState<number>(composition?.durationInFrames ? composition.durationInFrames - 1 : 299);
  const [muted, setMuted] = useState<boolean>(false);
  const [parallel, setParallel] = useState<boolean>(false);
  const [concurrency, setConcurrency] = useState<number>(4);

  const [rendering, setRendering] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RenderResult | null>(null);

  useEffect(() => {
    if (composition?.durationInFrames) {
      setEndFrame(composition.durationInFrames - 1);
    }
  }, [composition?.durationInFrames]);

  const getCrf = (): number => {
    if (quality === 'custom') return customCrf;
    const preset = QUALITY_PRESETS.find((p) => p.id === quality);
    return preset ? preset.crf : 18;
  };

  const outputWidth: number = Math.round((composition?.width || 1920) * scale);
  const outputHeight: number = Math.round((composition?.height || 1080) * scale);
  const frameCount: number = endFrame - startFrame + 1;
  const duration: number = frameCount / (composition?.fps || 30);

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

      const reader: ReadableStreamDefaultReader<Uint8Array> = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines: string[] = buffer.split('\n');
        buffer = lines.pop()!;

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

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape' && !rendering) onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, rendering, onClose]);

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
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="render-dialog-title"
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !rendering) onClose?.();
      }}
    >
      <div ref={dialogRef} className="dialog-panel">
        {/* Header */}
        <div className="dialog-header">
          <h2 id="render-dialog-title" className="dialog-title">
            Render Video
          </h2>
          <button
            className="dialog-close-btn"
            onClick={onClose}
            disabled={rendering}
            aria-label="Close render dialog"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="dialog-body">
          {/* Composition info */}
          <div className="dialog-info-card">
            <div className="dialog-info-card-title">
              {composition?.id || 'Unknown'}
            </div>
            <div className="dialog-info-card-subtitle">
              {composition?.width}x{composition?.height} @ {composition?.fps}fps · {composition?.durationInFrames} frames
            </div>
          </div>

          {/* Codec selection */}
          <div className="dialog-section">
            <label className="dialog-label">Format</label>
            <div className="dialog-option-grid dialog-option-grid--3col">
              {CODECS.map((c: Codec) => (
                <button
                  key={c.id}
                  className={`dialog-option-btn${codec === c.id ? ' active' : ''}`}
                  onClick={() => setCodec(c.id)}
                  disabled={rendering}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="dialog-option-hint">
              {selectedCodec?.description}
            </div>
          </div>

          {/* Quality selection (not for GIF) */}
          {codec !== 'gif' && (
            <div className="dialog-section">
              <label className="dialog-label">Quality</label>
              <div className="dialog-option-grid dialog-option-grid--4col">
                {QUALITY_PRESETS.map((p: QualityPreset) => (
                  <button
                    key={p.id}
                    className={`dialog-option-btn${quality === p.id ? ' active' : ''}`}
                    onClick={() => setQuality(p.id)}
                    disabled={rendering}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scale */}
          <div className="dialog-section">
            <label className="dialog-label">
              Scale ({outputWidth}x{outputHeight})
            </label>
            <input
              className="dialog-range"
              type="range"
              min="0.25"
              max="2"
              step="0.25"
              value={scale}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setScale(parseFloat(e.target.value))}
              disabled={rendering}
            />
            <div className="dialog-range-labels">
              <span>25%</span>
              <span>{scale * 100}%</span>
              <span>200%</span>
            </div>
          </div>

          {/* Frame range */}
          <div className="dialog-section">
            <label className="dialog-label">
              Frame Range ({frameCount} frames, {duration.toFixed(2)}s)
            </label>
            <div className="dialog-frame-range">
              <input
                className="dialog-input"
                type="number"
                value={startFrame}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setStartFrame(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={rendering}
              />
              <span className="dialog-frame-range-sep">to</span>
              <input
                className="dialog-input"
                type="number"
                value={endFrame}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEndFrame(Math.min(composition?.durationInFrames ? composition.durationInFrames - 1 : 299, parseInt(e.target.value) || 0))}
                disabled={rendering}
              />
            </div>
          </div>

          {/* Options */}
          <div className="dialog-section">
            <div className="dialog-checkbox-group">
              <label className="dialog-checkbox-label">
                <input
                  type="checkbox"
                  checked={muted}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setMuted(e.target.checked)}
                  disabled={rendering || codec === 'gif'}
                />
                Mute audio
              </label>
              <label className="dialog-checkbox-label">
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
            <div className="dialog-alert dialog-alert--error">
              {error}
            </div>
          )}

          {/* Result display */}
          {result && (
            <div className="dialog-alert dialog-alert--success">
              <div className="dialog-alert-title">
                Render complete!
              </div>
              <div className="dialog-alert-subtitle">
                {result.durationMs && `Completed in ${(result.durationMs / 1000).toFixed(1)}s`}
              </div>
              {result.downloadUrl && (
                <a
                  className="dialog-alert-link"
                  href={result.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              )}
            </div>
          )}

          {/* Progress bar */}
          {rendering && (
            <div className="dialog-progress">
              <div className="dialog-progress-track">
                <div
                  className="dialog-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="dialog-progress-text">
                {statusMessage || `Rendering... ${progress}%`}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dialog-footer">
          <button
            className="dialog-btn dialog-btn--secondary"
            onClick={onClose}
            disabled={rendering}
          >
            Cancel
          </button>
          <button
            className="dialog-btn dialog-btn--primary"
            onClick={handleRender}
            disabled={rendering}
          >
            {rendering ? 'Rendering...' : 'Start Render'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RenderDialog;
