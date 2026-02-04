/**
 * ShareDialog Component
 *
 * Modal dialog for sharing compositions via CLI command,
 * URL link, or config file download.
 */

import { useState, useCallback, useEffect, useRef, type MouseEvent, type CSSProperties, type ReactElement } from 'react';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

/** Composition configuration passed in from the parent. */
export interface Composition {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}

/** Label identifier for the copy-to-clipboard feedback. */
type CopyLabel = 'cli' | 'url' | 'config' | null;

/** Props accepted by the ShareDialog component. */
export interface ShareDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Called to close the dialog. */
  onClose: () => void;
  /** Current composition configuration. */
  composition: Composition;
  /** Current input props forwarded to the composition. */
  inputProps?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ShareDialog component.
 */
export function ShareDialog({
  open,
  onClose,
  composition,
  inputProps = {},
}: ShareDialogProps): ReactElement | null {
  const [copied, setCopied] = useState<CopyLabel>(null);

  const copyToClipboard = useCallback((text: string, label: CopyLabel): void => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

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

  // Generate CLI command
  const propsJson: string = Object.keys(inputProps).length > 0
    ? ` --props '${JSON.stringify(inputProps)}'`
    : '';
  const cliCommand: string = `framely render ${composition.id} out.mp4 --codec h264 --crf 18${propsJson}`;

  // Generate share URL
  const shareUrl: string = (() => {
    const url = new URL(window.location.origin);
    url.searchParams.set('composition', composition.id);
    if (Object.keys(inputProps).length > 0) {
      url.searchParams.set('props', encodeURIComponent(JSON.stringify(inputProps)));
    }
    return url.toString();
  })();

  // Generate config JSON
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

  const sectionStyle: CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: CSSProperties = {
    display: 'block',
    color: '#aaa',
    fontSize: '13px',
    marginBottom: '8px',
    fontWeight: 500,
  };

  const codeStyle: CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#252525',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    fontSize: '12px',
    lineHeight: 1.5,
    resize: 'none',
    outline: 'none',
  };

  const copyBtnStyle = (label: CopyLabel): CSSProperties => ({
    padding: '6px 14px',
    backgroundColor: copied === label ? '#10b981' : '#333',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    marginTop: '8px',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
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
          <h2 id="share-dialog-title" style={{ margin: 0, color: '#fff', fontSize: '18px' }}>
            Share
          </h2>
          <button
            onClick={onClose}
            aria-label="Close share dialog"
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: '24px',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* CLI Command */}
          <div style={sectionStyle}>
            <label style={labelStyle}>CLI Command</label>
            <textarea
              readOnly
              value={cliCommand}
              rows={2}
              style={codeStyle}
              onClick={(e: MouseEvent<HTMLTextAreaElement>) => (e.target as HTMLTextAreaElement).select()}
            />
            <button
              style={copyBtnStyle('cli')}
              onClick={() => copyToClipboard(cliCommand, 'cli')}
            >
              {copied === 'cli' ? 'Copied!' : 'Copy command'}
            </button>
          </div>

          {/* Share URL */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Share URL</label>
            <input
              readOnly
              value={shareUrl}
              style={{ ...codeStyle, height: 'auto' }}
              onClick={(e: MouseEvent<HTMLInputElement>) => (e.target as HTMLInputElement).select()}
            />
            <button
              style={copyBtnStyle('url')}
              onClick={() => copyToClipboard(shareUrl, 'url')}
            >
              {copied === 'url' ? 'Copied!' : 'Copy link'}
            </button>
          </div>

          {/* Download Config */}
          <div style={sectionStyle}>
            <label style={labelStyle}>Config File</label>
            <textarea
              readOnly
              value={configJson}
              rows={6}
              style={codeStyle}
            />
            <button
              style={copyBtnStyle('config')}
              onClick={handleDownloadConfig}
            >
              Download .framely.json
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #333',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid #444',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareDialog;
