import { useState, useEffect } from 'react';
import { PlayerView } from './player/Player';
import { TimelineProvider, useTimeline } from './lib';
import { Timeline } from './studio/Timeline';
import { PropsEditor } from './studio/PropsEditor';
import { RenderDialog } from './studio/RenderDialog';
import { ShareDialog } from './studio/ShareDialog';
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
    sequences: [
      { name: 'Intro', from: 0, durationInFrames: 90 },
      { name: 'Main Content', from: 90, durationInFrames: 120 },
      { name: 'Outro', from: 210, durationInFrames: 90 },
    ],
  },
  'transitions-test': {
    id: 'transitions-test',
    component: TransitionsTest,
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 280,
    defaultProps: {},
    sequences: [
      { name: 'Fade', from: 0, durationInFrames: 70 },
      { name: 'Slide', from: 70, durationInFrames: 70 },
      { name: 'Wipe', from: 140, durationInFrames: 70 },
      { name: 'Clock Wipe', from: 210, durationInFrames: 70 },
    ],
  },
  'loop-test': {
    id: 'loop-test',
    component: LoopTest,
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 300,
    defaultProps: {},
    sequences: [
      { name: 'Loop Cycle', from: 0, durationInFrames: 300 },
    ],
  },
  'series-test': {
    id: 'series-test',
    component: SeriesTest,
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 210,
    defaultProps: {},
    sequences: [
      { name: 'Part 1', from: 0, durationInFrames: 70 },
      { name: 'Part 2', from: 70, durationInFrames: 70 },
      { name: 'Part 3', from: 140, durationInFrames: 70 },
    ],
  },
  'animations-test': {
    id: 'animations-test',
    component: AnimationsTest,
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 120,
    defaultProps: {},
    sequences: [
      { name: 'Animations', from: 0, durationInFrames: 120 },
    ],
  },
  'color-test': {
    id: 'color-test',
    component: ColorInterpolationTest,
    width: 1920,
    height: 1080,
    fps: 30,
    durationInFrames: 150,
    defaultProps: {},
    sequences: [
      { name: 'Color Interpolation', from: 0, durationInFrames: 150 },
    ],
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
 * Editor mode — 3-panel layout with player, timeline, and props editor.
 */
function EditorView({ composition, compositions }) {
  const [activeId, setActiveId] = useState(composition.id);
  const [renderDialogOpen, setRenderDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const activeComp = compositions[activeId];
  const [inputProps, setInputProps] = useState(activeComp.defaultProps || {});

  // Reset props when switching compositions
  useEffect(() => {
    setInputProps(compositions[activeId]?.defaultProps || {});
  }, [activeId]);

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
            className="framely-share-btn"
            onClick={() => setShareDialogOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13 5a2 2 0 100-4 2 2 0 000 4zM3 10a2 2 0 100-4 2 2 0 000 4zM13 15a2 2 0 100-4 2 2 0 000 4zM5.3 9.1l5.4 3.3M10.7 3.6L5.3 6.9" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
            Share
          </button>
          <button
            className="framely-render-btn"
            onClick={() => setRenderDialogOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1v6h6M8 1L2 7l6 6V7" />
            </svg>
            Render
          </button>
        </div>
      </header>

      <div className="framely-editor-body">
        {/* Left Sidebar — Compositions */}
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

        {/* Center — Player + Timeline (shared TimelineProvider) */}
        <div className="framely-center">
          <TimelineProvider
            fps={activeComp.fps}
            width={activeComp.width}
            height={activeComp.height}
            durationInFrames={activeComp.durationInFrames}
          >
            <main className="framely-main">
              <PlayerView
                component={activeComp.component}
                compositionWidth={activeComp.width}
                compositionHeight={activeComp.height}
                inputProps={inputProps}
              />
            </main>
            <div className="framely-timeline-panel">
              <TimelineConnector
                activeComp={activeComp}
              />
            </div>
          </TimelineProvider>
        </div>

        {/* Right Panel — Props Editor */}
        <aside className="framely-right-panel">
          <PropsEditor
            props={inputProps}
            defaultProps={activeComp.defaultProps || {}}
            onChange={setInputProps}
          />
        </aside>
      </div>

      {/* Render Dialog */}
      <RenderDialog
        open={renderDialogOpen}
        onClose={() => setRenderDialogOpen(false)}
        composition={activeComp}
        inputProps={inputProps}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        composition={activeComp}
        inputProps={inputProps}
      />
    </div>
  );
}

/**
 * Bridge between TimelineProvider context and the Timeline component.
 * This reads from the shared context so both PlayerView and Timeline stay in sync.
 */
function TimelineConnector({ activeComp }) {
  const { frame, durationInFrames, fps, playing, setFrame, play, pause } = useTimeline();

  return (
    <Timeline
      frame={frame}
      durationInFrames={durationInFrames}
      fps={fps}
      sequences={activeComp.sequences || []}
      onSeek={setFrame}
      playing={playing}
      onPlay={play}
      onPause={pause}
    />
  );
}

export default App;
