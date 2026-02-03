import { useState, useEffect } from 'react';
import { Player } from './player/Player';
import { TimelineProvider } from './lib';
import SampleVideo from './compositions/SampleVideo';
import TransitionsTest from './compositions/TransitionsTest';
import LoopTest from './compositions/LoopTest';
import SeriesTest from './compositions/SeriesTest';
import AnimationsTest from './compositions/AnimationsTest';
import ColorInterpolationTest from './compositions/ColorInterpolationTest';
import './App.css';

// Registry of all compositions
const compositions = {
  'sample-video': {
    id: 'sample-video',
    component: SampleVideo,
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 300,
    defaultProps: {},
  },
  'transitions-test': {
    id: 'transitions-test',
    component: TransitionsTest,
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 280,
    defaultProps: {},
  },
  'loop-test': {
    id: 'loop-test',
    component: LoopTest,
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 300,
    defaultProps: {},
  },
  'series-test': {
    id: 'series-test',
    component: SeriesTest,
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 210,
    defaultProps: {},
  },
  'animations-test': {
    id: 'animations-test',
    component: AnimationsTest,
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 120,
    defaultProps: {},
  },
  'color-test': {
    id: 'color-test',
    component: ColorInterpolationTest,
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 150,
    defaultProps: {},
  },
};

function App() {
  const params = new URLSearchParams(window.location.search);
  const renderMode = params.get('renderMode') === 'true';
  const compositionId = params.get('composition') || 'sample-video';

  const composition = compositions[compositionId];

  if (!composition) {
    return <div style={{ color: 'white', padding: 40 }}>Composition "{compositionId}" not found.</div>;
  }

  // Render mode: show just the composition at full size (for Playwright screenshots)
  if (renderMode) {
    return <RenderView composition={composition} />;
  }

  // Normal mode: show the player + sidebar
  return <EditorView composition={composition} compositions={compositions} />;
}

/**
 * Render mode — bare composition at native resolution.
 * The renderer controls frames via window.__setFrame()
 */
function RenderView({ composition }) {
  const { component: Component, width, height, fps, durationInFrames, defaultProps } = composition;

  return (
    <div
      id="render-container"
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      <TimelineProvider
        fps={fps}
        width={width}
        height={height}
        durationInFrames={durationInFrames}
        renderMode={true}
      >
        <Component {...defaultProps} />
      </TimelineProvider>
    </div>
  );
}

/**
 * Editor mode — player with controls and composition list.
 */
function EditorView({ composition, compositions }) {
  const [activeId, setActiveId] = useState(composition.id);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState('');

  const activeComp = compositions[activeId];

  const handleRender = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    setRenderStatus('Starting render...');

    try {
      const res = await fetch('http://localhost:4000/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compositionId: activeId,
          width: activeComp.width,
          height: activeComp.height,
          fps: activeComp.fps,
          durationInFrames: activeComp.durationInFrames,
        }),
      });

      if (!res.ok) {
        throw new Error(`Render failed: ${res.statusText}`);
      }

      // Stream progress from SSE or just get the result
      const data = await res.json();
      setRenderStatus(`Done! Output: ${data.outputPath}`);
      setRenderProgress(100);

      // Download the video
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    } catch (err) {
      setRenderStatus(`Error: ${err.message}`);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="framely-editor">
      {/* Header */}
      <header className="framely-header">
        <div className="framely-logo">
          <span className="framely-logo-icon">▶</span>
          <span className="framely-logo-text">Framely</span>
        </div>
        <div className="framely-header-actions">
          <button
            className="framely-render-btn"
            onClick={handleRender}
            disabled={isRendering}
          >
            {isRendering ? (
              <>
                <span className="framely-spinner" />
                Rendering...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1v6h6M8 1L2 7l6 6V7" />
                </svg>
                Render Video
              </>
            )}
          </button>
        </div>
      </header>

      <div className="framely-editor-body">
        {/* Sidebar */}
        <aside className="framely-sidebar">
          <div className="framely-sidebar-section">
            <div className="framely-sidebar-label">Compositions</div>
            {Object.values(compositions).map((comp) => (
              <button
                key={comp.id}
                className={`framely-comp-item ${comp.id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(comp.id)}
              >
                <span className="framely-comp-icon">🎬</span>
                <div className="framely-comp-info">
                  <div className="framely-comp-name">{comp.id}</div>
                  <div className="framely-comp-meta">
                    {comp.width}×{comp.height} • {comp.fps}fps • {(comp.durationInFrames / comp.fps).toFixed(1)}s
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Render status */}
          {renderStatus && (
            <div className="framely-sidebar-section">
              <div className="framely-sidebar-label">Render Status</div>
              <div className="framely-render-status">
                {isRendering && (
                  <div className="framely-progress-bar">
                    <div
                      className="framely-progress-fill"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                )}
                <div className="framely-render-status-text">{renderStatus}</div>
              </div>
            </div>
          )}

          {/* Keyboard shortcuts */}
          <div className="framely-sidebar-section">
            <div className="framely-sidebar-label">Shortcuts</div>
            <div className="framely-shortcuts">
              <div className="framely-shortcut">
                <kbd>Space</kbd><span>Play / Pause</span>
              </div>
              <div className="framely-shortcut">
                <kbd>←</kbd><kbd>→</kbd><span>Prev / Next frame</span>
              </div>
              <div className="framely-shortcut">
                <kbd>⇧←</kbd><kbd>⇧→</kbd><span>Skip 10 frames</span>
              </div>
              <div className="framely-shortcut">
                <kbd>Home</kbd><kbd>End</kbd><span>First / Last</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main area: Player */}
        <main className="framely-main">
          <Player
            component={activeComp.component}
            compositionWidth={activeComp.width}
            compositionHeight={activeComp.height}
            fps={activeComp.fps}
            durationInFrames={activeComp.durationInFrames}
            inputProps={activeComp.defaultProps}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
