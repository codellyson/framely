import { useEffect, useRef } from 'react';
import type { Template } from '@codellyson/framely';
import { CATEGORY_LABELS } from '@codellyson/framely';

export interface TemplatePreviewDialogProps {
  open: boolean;
  template: Template | null;
  onClose: () => void;
  onUseTemplate: () => void;
}

/**
 * Dialog for previewing a template before using it
 */
export function TemplatePreviewDialog({
  open,
  template,
  onClose,
  onUseTemplate,
}: TemplatePreviewDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, [open]);

  if (!open || !template) return null;

  const duration = template.durationInFrames / template.fps;

  return (
    <div
      className="template-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={dialogRef} className="template-preview-dialog">
        {/* Header */}
        <div className="template-preview-header">
          <h2 id="preview-dialog-title">{template.name}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="template-dialog-close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="template-preview-content">
          {/* Preview Area */}
          <div className="template-preview-media">
            {template.preview.video ? (
              <video
                src={template.preview.video}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : template.preview.preview ? (
              <img src={template.preview.preview} alt={template.name} />
            ) : (
              <img src={template.preview.thumbnail} alt={template.name} />
            )}
          </div>

          {/* Details Panel */}
          <div className="template-preview-details">
            <p className="template-preview-description">{template.description}</p>

            <div className="template-preview-info-grid">
              <div className="template-preview-info-item">
                <span className="label">Resolution</span>
                <span className="value">
                  {template.width} x {template.height}
                </span>
              </div>
              <div className="template-preview-info-item">
                <span className="label">FPS</span>
                <span className="value">{template.fps}</span>
              </div>
              <div className="template-preview-info-item">
                <span className="label">Duration</span>
                <span className="value">{duration.toFixed(1)}s</span>
              </div>
              <div className="template-preview-info-item">
                <span className="label">Category</span>
                <span className="value">
                  {CATEGORY_LABELS[template.category] || template.category}
                </span>
              </div>
            </div>

            <div className="template-preview-author">
              <span className="label">Created by</span>
              <div className="template-preview-author-info">
                {template.author.avatar && (
                  <img
                    src={template.author.avatar}
                    alt=""
                    className="template-preview-author-avatar"
                  />
                )}
                <span className="template-preview-author-name">
                  {template.author.verified && (
                    <svg
                      className="template-verified-icon"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                  {template.author.name}
                </span>
              </div>
            </div>

            {template.tags.length > 0 && (
              <div className="template-preview-tags">
                {template.tags.map((tag) => (
                  <span key={tag} className="template-preview-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {template.downloads !== undefined && (
              <div className="template-preview-stats">
                <span className="template-preview-stat">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  {template.downloads.toLocaleString()} downloads
                </span>
                {template.rating && (
                  <span className="template-preview-stat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    {template.rating.toFixed(1)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="template-preview-footer">
          <button type="button" onClick={onClose} className="template-btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={onUseTemplate}
            className="template-btn-primary"
          >
            {template.installed ? 'Use Template' : 'Add to Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplatePreviewDialog;
