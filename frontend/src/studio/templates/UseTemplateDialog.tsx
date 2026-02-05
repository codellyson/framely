import { useState, useEffect, useRef } from 'react';
import type { Template } from '../../lib/templates/types';
import { PropsEditor } from '../PropsEditor';

export interface UseTemplateDialogProps {
  open: boolean;
  template: Template | null;
  onClose: () => void;
  onConfirm: (customId: string, customProps: Record<string, unknown>) => void;
}

/**
 * Dialog for confirming template usage and setting custom composition ID
 */
export function UseTemplateDialog({
  open,
  template,
  onClose,
  onConfirm,
}: UseTemplateDialogProps) {
  const [customId, setCustomId] = useState('');
  const [customProps, setCustomProps] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize customId and props when template changes
  useEffect(() => {
    if (template) {
      setCustomId(`${template.id}-copy`);
      setCustomProps({ ...template.defaultProps });
      setError(null);
    }
  }, [template]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !template) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate ID
    const trimmedId = customId.trim();
    if (!trimmedId) {
      setError('Composition ID is required');
      return;
    }
    if (!/^[a-z0-9-]+$/i.test(trimmedId)) {
      setError('ID can only contain letters, numbers, and hyphens');
      return;
    }

    onConfirm(trimmedId, customProps);
  };

  return (
    <div
      className="template-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="use-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="use-template-dialog">
        {/* Header */}
        <div className="template-preview-header">
          <h2 id="use-dialog-title">Use Template</h2>
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
        <form onSubmit={handleSubmit} className="use-template-content">
          <p className="use-template-intro">
            Add <strong>{template.name}</strong> as a new composition in your project.
          </p>

          <div className="use-template-form-group">
            <label htmlFor="composition-id">Composition ID</label>
            <input
              ref={inputRef}
              id="composition-id"
              type="text"
              value={customId}
              onChange={(e) => {
                setCustomId(e.target.value);
                setError(null);
              }}
              placeholder="my-custom-video"
              className={error ? 'has-error' : ''}
            />
            {error && <span className="use-template-error">{error}</span>}
            <span className="use-template-hint">
              This ID will be used to reference the composition in your code
            </span>
          </div>

          {/* Props Editor */}
          {Object.keys(template.defaultProps).length > 0 && (
            <div className="use-template-props">
              <h4>Customize Properties</h4>
              <PropsEditor
                defaultProps={template.defaultProps}
                onChange={setCustomProps}
              />
            </div>
          )}

          {/* Footer */}
          <div className="template-preview-footer">
            <button type="button" onClick={onClose} className="template-btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="template-btn-primary"
              disabled={!customId.trim()}
            >
              Add to Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UseTemplateDialog;
