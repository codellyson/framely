import { useState, useEffect, useRef } from 'react';
import type { Template } from '@codellyson/framely';
import { PropsEditor } from '../PropsEditor.tsx';
import { templatesApi } from './api.js';

export interface UseTemplateDialogProps {
  open: boolean;
  template: Template | null;
  onClose: () => void;
  onConfirm: (customId: string, customProps: Record<string, unknown>) => void;
}

/**
 * Dialog for confirming template usage and setting custom composition ID.
 * If the template is not installed, shows an install step first.
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
  const [installing, setInstalling] = useState(false);
  const [installLog, setInstallLog] = useState<string[]>([]);
  const [installDone, setInstallDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize customId and props when template changes
  useEffect(() => {
    if (template) {
      setCustomId(`${template.id}-copy`);
      setCustomProps({ ...template.defaultProps });
      setError(null);
      setInstalling(false);
      setInstallLog([]);
      setInstallDone(false);
    }
  }, [template]);

  // Focus input when dialog opens (and template is installed)
  useEffect(() => {
    if (open && inputRef.current && (template?.installed || installDone)) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open, installDone, template?.installed]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !installing) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, installing]);

  if (!open || !template) return null;

  const needsInstall = !template.installed && !installDone;

  const handleInstall = async () => {
    setInstalling(true);
    setInstallLog([]);
    setError(null);

    try {
      await templatesApi.installTemplate(template.id, (event) => {
        if (event.type === 'log') {
          setInstallLog((prev) => [...prev, event.text]);
        } else if (event.type === 'status') {
          setInstallLog((prev) => [...prev, event.message + '\n']);
        }
      });
      setInstallDone(true);
    } catch (err) {
      setError(err.message || 'Installation failed');
    } finally {
      setInstalling(false);
    }
  };

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
        if (e.target === e.currentTarget && !installing) onClose();
      }}
    >
      <div className="use-template-dialog">
        {/* Header */}
        <div className="template-preview-header">
          <h2 id="use-dialog-title">
            {needsInstall ? 'Add Template' : 'Use Template'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="template-dialog-close"
            disabled={installing}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Install step for non-installed templates */}
        {needsInstall ? (
          <div className="use-template-content">
            <p className="use-template-intro">
              <strong>{template.name}</strong> needs to be added before use.
              <span style={{ display: 'block', marginTop: 4, opacity: 0.7, fontSize: '0.9em' }}>
                Files will be added to src/templates/{template.id}/
              </span>
            </p>

            {installLog.length > 0 && (
              <pre className="use-template-install-log">
                {installLog.join('')}
              </pre>
            )}

            {error && <div className="use-template-error">{error}</div>}

            <div className="template-preview-footer">
              <button type="button" onClick={onClose} className="template-btn-secondary" disabled={installing}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInstall}
                className="template-btn-primary"
                disabled={installing}
              >
                {installing ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        ) : (
          /* Composition ID form (shown after install or for already-installed templates) */
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
        )}
      </div>
    </div>
  );
}

export default UseTemplateDialog;
