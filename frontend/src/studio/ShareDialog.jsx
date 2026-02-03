/**
 * ShareDialog Component
 *
 * Modal dialog for sharing compositions via CLI command,
 * URL link, or config file download.
 */

import { useState, useCallback } from 'react';

/**
 * ShareDialog component.
 *
 * @param {object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {function} props.onClose - Called to close dialog
 * @param {object} props.composition - Current composition config
 * @param {object} props.inputProps - Current input props
 */
export function ShareDialog({
  open,
  onClose,
  composition,
  inputProps = {},
}) {
  const [copied, setCopied] = useState(null);

  const copyToClipboard = useCallback((text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  if (!open) return null;

  // Generate CLI command
  const propsJson = Object.keys(inputProps).length > 0
    ? ` --props '${JSON.stringify(inputProps)}'`
    : '';
  const cliCommand = `framely render ${composition.id} out.mp4 --codec h264 --crf 18${propsJson}`;

  // Generate share URL
  const shareUrl = (() => {
    const url = new URL(window.location.origin);
    url.searchParams.set('composition', composition.id);
    if (Object.keys(inputProps).length > 0) {
      url.searchParams.set('props', encodeURIComponent(JSON.stringify(inputProps)));
    }
    return url.toString();
  })();

  // Generate config JSON
  const configJson = JSON.stringify({
    compositionId: composition.id,
    width: composition.width,
    height: composition.height,
    fps: composition.fps,
    durationInFrames: composition.durationInFrames,
    inputProps,
  }, null, 2);

  const handleDownloadConfig = () => {
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${composition.id}.framely.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sectionStyle = {
    marginBottom: '16px',
  };

  const labelStyle = {
    display: 'block',
    color: '#aaa',
    fontSize: '13px',
    marginBottom: '8px',
    fontWeight: 500,
  };

  const codeStyle = {
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

  const copyBtnStyle = (label) => ({
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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
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
          <h2 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>
            Share
          </h2>
          <button
            onClick={onClose}
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
              onClick={(e) => e.target.select()}
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
              onClick={(e) => e.target.select()}
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
