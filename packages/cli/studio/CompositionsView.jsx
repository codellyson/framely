import { useState, useEffect } from 'react';
import { TimelineProvider, getCompositionTree } from '@codellyson/framely';
import { PlayerView } from './player/Player';
import { RenderDialog } from './RenderDialog';
import { ExportDialog } from './ShareDialog';
import { TemplatesMarketplace } from './templates';
import { PropsEditor } from './PropsEditor';
import './CompositionsView.css';

/**
 * CompositionsView - Browse, preview, and export code-defined compositions.
 * Includes a marketplace tab for discovering and using templates.
 */
export function CompositionsView({
  compositions,
  selectedId,
  onSelectComposition,
  onUseTemplate,
}) {
  const [activeTab, setActiveTab] = useState('compositions');
  const [renderDialogOpen, setRenderDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['Tests', 'Templates']));
  const [customProps, setCustomProps] = useState({});

  const _compositionTree = getCompositionTree(); // For future use with folder tree
  const selectedComp = compositions[selectedId];

  // Reset custom props when composition changes
  useEffect(() => {
    if (selectedComp?.defaultProps) {
      setCustomProps({ ...selectedComp.defaultProps });
    } else {
      setCustomProps({});
    }
  }, [selectedId, selectedComp?.defaultProps]);

  // Current props = default props merged with custom edits
  const currentProps = { ...(selectedComp?.defaultProps || {}), ...customProps };

  // Toggle folder expansion
  const toggleFolder = (folderName) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderName)) {
        next.delete(folderName);
      } else {
        next.add(folderName);
      }
      return next;
    });
  };

  // Group compositions by folder
  const groupedComps = {};
  const rootComps = [];

  Object.values(compositions).forEach((comp) => {
    const folderPath = comp.folderPath || [];
    if (folderPath.length > 0) {
      const folder = folderPath[0];
      if (!groupedComps[folder]) {
        groupedComps[folder] = [];
      }
      groupedComps[folder].push(comp);
    } else {
      rootComps.push(comp);
    }
  });

  // Handle using a template
  const handleUseTemplate = (template, customId, customProps) => {
    onUseTemplate?.(template, customId, customProps);
    setActiveTab('compositions');
  };

  return (
    <div className="compositions-view">
      {/* Sidebar */}
      <aside className="compositions-sidebar">
        {/* Tab Switcher */}
        <div className="compositions-tabs">
          <button
            className={`compositions-tab ${activeTab === 'compositions' ? 'active' : ''}`}
            onClick={() => setActiveTab('compositions')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Compositions
          </button>
          <button
            className={`compositions-tab ${activeTab === 'marketplace' ? 'active' : ''}`}
            onClick={() => setActiveTab('marketplace')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
            Marketplace
          </button>
        </div>

        {activeTab === 'compositions' && (
          <>
            <div className="compositions-sidebar-header">
              <h3>My Compositions</h3>
              <span className="compositions-count">{Object.keys(compositions).length}</span>
            </div>

            <div className="compositions-list">
          {/* Root-level compositions */}
          {rootComps.map((comp) => (
            <button
              key={comp.id}
              className={`compositions-item ${comp.id === selectedId ? 'active' : ''}`}
              onClick={() => onSelectComposition(comp.id)}
            >
              <span className="compositions-item-icon">🎬</span>
              <div className="compositions-item-info">
                <div className="compositions-item-name">{comp.id}</div>
                <div className="compositions-item-meta">
                  {comp.width}×{comp.height} • {comp.fps}fps
                </div>
              </div>
            </button>
          ))}

          {/* Folders */}
          {Object.entries(groupedComps).map(([folder, comps]) => (
            <div key={folder} className="compositions-folder">
              <button
                className="compositions-folder-header"
                onClick={() => toggleFolder(folder)}
              >
                <span className="compositions-folder-icon">
                  {expandedFolders.has(folder) ? '▼' : '▶'}
                </span>
                <span className="compositions-folder-name">{folder}</span>
                <span className="compositions-folder-count">{comps.length}</span>
              </button>
              {expandedFolders.has(folder) && (
                <div className="compositions-folder-items">
                  {comps.map((comp) => (
                    <button
                      key={comp.id}
                      className={`compositions-item ${comp.id === selectedId ? 'active' : ''}`}
                      onClick={() => onSelectComposition(comp.id)}
                    >
                      <span className="compositions-item-icon">🎬</span>
                      <div className="compositions-item-info">
                        <div className="compositions-item-name">{comp.id}</div>
                        <div className="compositions-item-meta">
                          {comp.width}×{comp.height} • {comp.fps}fps
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
            </div>
          </>
        )}

        {activeTab === 'marketplace' && (
          <div className="compositions-sidebar-marketplace">
            <p>Browse templates in the main panel</p>
          </div>
        )}
      </aside>

      {/* Main - Preview or Marketplace */}
      <main className="compositions-main">
        {activeTab === 'marketplace' ? (
          <TemplatesMarketplace onUseTemplate={handleUseTemplate} />
        ) : selectedComp ? (
          selectedComp.component ? (
            <TimelineProvider
              fps={selectedComp.fps}
              width={selectedComp.width}
              height={selectedComp.height}
              durationInFrames={selectedComp.durationInFrames}
            >
              <PlayerView
                component={selectedComp.component}
                compositionWidth={selectedComp.width}
                compositionHeight={selectedComp.height}
                inputProps={currentProps}
              />
            </TimelineProvider>
          ) : (
            <div className="compositions-template-placeholder">
              <div className="template-placeholder-content">
                <div className="template-placeholder-icon">📦</div>
                <h3>{selectedComp._templateName || selectedComp.id}</h3>
                <p>Template from marketplace</p>
                <div className="template-placeholder-info">
                  <span>{selectedComp.width}×{selectedComp.height}</span>
                  <span>{selectedComp.fps} fps</span>
                  <span>{(selectedComp.durationInFrames / selectedComp.fps).toFixed(1)}s</span>
                </div>
                <p className="template-placeholder-note">
                  Remote template loading coming soon
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="compositions-empty">
            <p>Select a composition to preview</p>
          </div>
        )}
      </main>

      {/* Info Panel */}
      <aside className="compositions-info">
        {selectedComp ? (
          <>
            <div className="compositions-info-header">
              <h2>{selectedComp.id}</h2>
              {selectedComp.folderPath?.length > 0 && (
                <span className="compositions-info-folder">
                  {selectedComp.folderPath.join(' / ')}
                </span>
              )}
            </div>

            <div className="compositions-info-section">
              <h4>Dimensions</h4>
              <div className="compositions-info-grid">
                <div className="compositions-info-item">
                  <span className="label">Width</span>
                  <span className="value">{selectedComp.width}px</span>
                </div>
                <div className="compositions-info-item">
                  <span className="label">Height</span>
                  <span className="value">{selectedComp.height}px</span>
                </div>
              </div>
            </div>

            <div className="compositions-info-section">
              <h4>Timing</h4>
              <div className="compositions-info-grid">
                <div className="compositions-info-item">
                  <span className="label">FPS</span>
                  <span className="value">{selectedComp.fps}</span>
                </div>
                <div className="compositions-info-item">
                  <span className="label">Frames</span>
                  <span className="value">{selectedComp.durationInFrames}</span>
                </div>
                <div className="compositions-info-item full-width">
                  <span className="label">Duration</span>
                  <span className="value">
                    {(selectedComp.durationInFrames / selectedComp.fps).toFixed(2)}s
                  </span>
                </div>
              </div>
            </div>

            {/* Props Editor - Customize template properties */}
            {Object.keys(selectedComp.defaultProps || {}).length > 0 && (
              <div className="compositions-info-section">
                <h4>Customize</h4>
                <PropsEditor
                  defaultProps={selectedComp.defaultProps}
                  onChange={setCustomProps}
                />
              </div>
            )}

            <div className="compositions-info-actions">
              <button
                className="compositions-action-btn primary"
                onClick={() => setRenderDialogOpen(true)}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1v6h6M8 1L2 7l6 6V7" />
                </svg>
                Render Video
              </button>
              <button
                className="compositions-action-btn"
                onClick={() => setExportDialogOpen(true)}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 2v8M5 7l3 3 3-3M3 12v2h10v-2" />
                </svg>
                Export
              </button>
            </div>
          </>
        ) : (
          <div className="compositions-info-empty">
            <p>No composition selected</p>
          </div>
        )}
      </aside>

      {/* Dialogs */}
      {selectedComp && (
        <>
          <RenderDialog
            open={renderDialogOpen}
            onClose={() => setRenderDialogOpen(false)}
            composition={selectedComp}
            inputProps={currentProps}
          />
          <ExportDialog
            open={exportDialogOpen}
            onClose={() => setExportDialogOpen(false)}
            composition={selectedComp}
            inputProps={currentProps}
          />
        </>
      )}
    </div>
  );
}

export default CompositionsView;
