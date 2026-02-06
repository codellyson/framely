/**
 * ExportDialog Component
 *
 * Modal dialog for exporting compositions via CLI command
 * or config file download.
 */

import { useState, useCallback, useEffect, useRef, type MouseEvent, type ReactElement } from 'react';
import './styles/dialogs.css';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface Composition {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}

type CopyLabel = 'cli' | 'config' | null;

export interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  composition: Composition;
  inputProps?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ExportDialog({
  open,
  onClose,
  composition,
  inputProps = {},
}: ExportDialogProps): ReactElement | null {
  const [copied, setCopied] = useState<CopyLabel>(null);

  const copyToClipboard = useCallback((text: string, label: CopyLabel): void => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

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

  const propsJson: string = Object.keys(inputProps).length > 0
    ? ` --props '${JSON.stringify(inputProps)}'`
    : '';
  const cliCommand: string = `framely render ${composition.id} out.mp4 --codec h264 --crf 18${propsJson}`;

  const configJson: string = JSON.stringify({
    compositionId: composition.id,
    width: composition.width,
    height: composition.height,
    fps: composition.fps,
    durationInFrames: composition.durationInFrames,
    inputProps,
  }, null, 2);

  const handleDownloadConfig = (): void => {
    const blob = new Blob([configJson], { type: 'application/json' });
    const url: string = URL.createObjectURL(blob);
    const a: HTMLAnchorElement = document.createElement('a');
    a.href = url;
    a.download = `${composition.id}.framely.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      onClick={(e: MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} className="dialog-panel">
        {/* Header */}
        <div className="dialog-header">
          <h2 id="export-dialog-title" className="dialog-title">
            Export
          </h2>
          <button
            className="dialog-close-btn"
            onClick={onClose}
            aria-label="Close export dialog"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="dialog-body">
          {/* CLI Command */}
          <div className="dialog-section">
            <label className="dialog-label">Render Command</label>
            <textarea
              className="dialog-code"
              readOnly
              value={cliCommand}
              rows={2}
              onClick={(e: MouseEvent<HTMLTextAreaElement>) => (e.target as HTMLTextAreaElement).select()}
            />
            <div className="dialog-btn-row">
              <button
                className={`dialog-btn ${copied === 'cli' ? 'dialog-btn--success' : 'dialog-btn--subtle'}`}
                onClick={() => copyToClipboard(cliCommand, 'cli')}
              >
                {copied === 'cli' ? 'Copied!' : 'Copy command'}
              </button>
            </div>
          </div>

          {/* Config File */}
          <div className="dialog-section">
            <label className="dialog-label">Config File</label>
            <textarea
              className="dialog-code"
              readOnly
              value={configJson}
              rows={6}
              onClick={(e: MouseEvent<HTMLTextAreaElement>) => (e.target as HTMLTextAreaElement).select()}
            />
            <div className="dialog-btn-row">
              <button
                className={`dialog-btn ${copied === 'config' ? 'dialog-btn--success' : 'dialog-btn--subtle'}`}
                onClick={() => copyToClipboard(configJson, 'config')}
              >
                {copied === 'config' ? 'Copied!' : 'Copy config'}
              </button>
              <button
                className="dialog-btn dialog-btn--subtle"
                onClick={handleDownloadConfig}
              >
                Download .framely.json
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="dialog-footer">
          <button
            className="dialog-btn dialog-btn--secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
