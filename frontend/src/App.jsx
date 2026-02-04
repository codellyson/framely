import { useState, useEffect, useMemo, useCallback } from 'react';
import { PlayerView } from './player/Player';
import { TimelineProvider, useTimeline } from './lib';
import { getCompositions } from './lib/registerRoot';
import { Timeline } from './studio/Timeline';
import { PropsEditor } from './studio/PropsEditor';
import { RenderDialog } from './studio/RenderDialog';
import { ShareDialog } from './studio/ShareDialog';
import { KeyframeEditor } from './studio/KeyframeEditor';
import { AssetPanel } from './studio/AssetPanel';
import { useHistory, ActionTypes } from './studio/useHistory';
import './App.css';

// Timeline sequence metadata (UI-only, not part of composition config)
const SEQUENCE_METADATA = {
  'sample-video': [
    { name: 'Intro', from: 0, durationInFrames: 90 },
    { name: 'Main Content', from: 90, durationInFrames: 120 },
    { name: 'Outro', from: 210, durationInFrames: 90 },
  ],
  'transitions-test': [
    { name: 'Fade', from: 0, durationInFrames: 70 },
    { name: 'Slide', from: 70, durationInFrames: 70 },
    { name: 'Wipe', from: 140, durationInFrames: 70 },
    { name: 'Clock Wipe', from: 210, durationInFrames: 70 },
  ],
  'loop-test': [
    { name: 'Loop Cycle', from: 0, durationInFrames: 300 },
  ],
  'series-test': [
    { name: 'Part 1', from: 0, durationInFrames: 70 },
    { name: 'Part 2', from: 70, durationInFrames: 70 },
    { name: 'Part 3', from: 140, durationInFrames: 70 },
  ],
  'animations-test': [
    { name: 'Animations', from: 0, durationInFrames: 120 },
  ],
  'color-test': [
    { name: 'Color Interpolation', from: 0, durationInFrames: 150 },
  ],
};

function App() {
  const params = new URLSearchParams(window.location.search);
  const renderMode = params.get('renderMode') === 'true';
  const compositionId = params.get('composition') || 'sample-video';

  const compositions = useMemo(() => {
    const map = getCompositions();
    const obj = {};
    for (const [id, comp] of map) {
      obj[id] = { ...comp, sequences: SEQUENCE_METADATA[id] || [] };
    }
    return obj;
  }, []);

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
 * Uses useHistory for undo/redo across props and sequence changes.
 */
function EditorView({ composition, compositions }) {
  const [activeId, setActiveId] = useState(composition.id);
  const [renderDialogOpen, setRenderDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('compositions');

  const activeComp = compositions[activeId];

  // Undo/redo-managed editor state (props + sequences + keyframes)
  const { state: editorState, dispatch, undo, redo, canUndo, canRedo } = useHistory({
    props: activeComp.defaultProps || {},
    defaultProps: activeComp.defaultProps || {},
    sequences: activeComp.sequences || [],
    keyframes: [],
    selectedProperty: 'opacity',
    audioTracks: [],
  });

  // Reset history when switching compositions
  useEffect(() => {
    const comp = compositions[activeId];
    if (comp) {
      dispatch({
        type: ActionTypes.SET_STATE,
        state: {
          props: comp.defaultProps || {},
          defaultProps: comp.defaultProps || {},
          sequences: comp.sequences || [],
          keyframes: [],
          selectedProperty: 'opacity',
          audioTracks: [],
        },
      });
    }
  }, [activeId, dispatch]);

  // Props change handler for PropsEditor
  const handlePropsChange = useCallback(
    (newProps) => dispatch({ type: ActionTypes.SET_PROPS, props: newProps }),
    [dispatch],
  );

  // Sequence handlers for Timeline
  const handleSequenceMove = useCallback(
    (index, from) => dispatch({ type: ActionTypes.MOVE_SEQUENCE, index, from }),
    [dispatch],
  );

  const handleSequenceResize = useCallback(
    (index, from, durationInFrames) =>
      dispatch({ type: ActionTypes.RESIZE_SEQUENCE, index, from, durationInFrames }),
    [dispatch],
  );

  const handleSequenceAdd = useCallback(
    (sequence) => dispatch({ type: ActionTypes.ADD_SEQUENCE, sequence }),
    [dispatch],
  );

  const handleSequenceDelete = useCallback(
    (index) => dispatch({ type: ActionTypes.DELETE_SEQUENCE, index }),
    [dispatch],
  );

  const handleSequenceRename = useCallback(
    (index, name) => dispatch({ type: ActionTypes.RENAME_SEQUENCE, index, name }),
    [dispatch],
  );

  // Keyframe handlers
  const handleKeyframeChange = useCallback(
    (index, keyframe) => dispatch({ type: ActionTypes.UPDATE_KEYFRAME, index, keyframe }),
    [dispatch],
  );

  const handleKeyframeAdd = useCallback(
    (frame, value) => dispatch({ type: ActionTypes.ADD_KEYFRAME, keyframe: { frame, value, easing: 'linear' } }),
    [dispatch],
  );

  const handleKeyframeDelete = useCallback(
    (index) => dispatch({ type: ActionTypes.DELETE_KEYFRAME, index }),
    [dispatch],
  );

  // Audio track handlers
  const handleAudioTrackDelete = useCallback(
    (id) => dispatch({ type: ActionTypes.DELETE_AUDIO_TRACK, id }),
    [dispatch],
  );

  const handleAudioTrackMove = useCallback(
    (id, newFrom) => dispatch({ type: ActionTypes.UPDATE_AUDIO_TRACK, id, updates: { from: newFrom } }),
    [dispatch],
  );

  // Asset add handler — adds audio/video/image assets to the timeline
  const handleAssetAdd = useCallback(
    (asset) => {
      const defaultDur = Math.min(activeComp.fps * 3, activeComp.durationInFrames);
      if (asset.type === 'audio') {
        // Add as an audio track at frame 0 (user can drag to reposition)
        dispatch({
          type: ActionTypes.ADD_AUDIO_TRACK,
          track: {
            id: `audio-${Date.now()}`,
            name: asset.name,
            src: asset.path,
            from: 0,
            durationInFrames: Math.min(activeComp.fps * 5, activeComp.durationInFrames),
            volume: 1,
          },
        });
      } else {
        // Add video/image as a sequence at frame 0
        dispatch({
          type: ActionTypes.ADD_SEQUENCE,
          sequence: {
            name: asset.name,
            from: 0,
            durationInFrames: defaultDur,
            assetPath: asset.path,
            assetType: asset.type,
          },
        });
      }
    },
    [dispatch, activeComp],
  );

  return (
    <div className="framely-editor">
      {/* Header */}
      <header className="framely-header">
        <div className="framely-logo">
          <span className="framely-logo-icon">▶</span>
          <span className="framely-logo-text">Framely</span>
        </div>
        <div className="framely-header-actions">
          {/* Undo/Redo */}
          <button
            className="framely-icon-btn"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 7h8a3 3 0 110 6H8" />
              <path d="M6 4L3 7l3 3" />
            </svg>
          </button>
          <button
            className="framely-icon-btn"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 7H5a3 3 0 100 6h3" />
              <path d="M10 4l3 3-3 3" />
            </svg>
          </button>

          <div className="framely-header-separator" />

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
        {/* Left Sidebar — Compositions / Assets */}
        <aside className="framely-sidebar">
          {/* Sidebar tabs */}
          <div className="framely-sidebar-tabs">
            <button
              className={`framely-sidebar-tab ${sidebarTab === 'compositions' ? 'active' : ''}`}
              onClick={() => setSidebarTab('compositions')}
            >
              Compositions
            </button>
            <button
              className={`framely-sidebar-tab ${sidebarTab === 'assets' ? 'active' : ''}`}
              onClick={() => setSidebarTab('assets')}
            >
              Assets
            </button>
          </div>

          {sidebarTab === 'compositions' && (
            <div className="framely-sidebar-section">
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
          )}

          {sidebarTab === 'assets' && (
            <div className="framely-sidebar-section" style={{ flex: 1, padding: 0 }}>
              <AssetPanel onAssetAdd={handleAssetAdd} />
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
              <div className="framely-shortcut">
                <kbd>Ctrl+Z</kbd><span>Undo</span>
              </div>
              <div className="framely-shortcut">
                <kbd>Ctrl+⇧Z</kbd><span>Redo</span>
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
                inputProps={editorState.props}
              />
            </main>
            <div className="framely-timeline-panel">
              <TimelineConnector
                activeComp={activeComp}
                sequences={editorState.sequences}
                onSequenceMove={handleSequenceMove}
                onSequenceResize={handleSequenceResize}
                onSequenceAdd={handleSequenceAdd}
                onSequenceDelete={handleSequenceDelete}
                onSequenceRename={handleSequenceRename}
                audioTracks={editorState.audioTracks}
                onAudioTrackDelete={handleAudioTrackDelete}
                onAudioTrackMove={handleAudioTrackMove}
              />
            </div>
            <div className="framely-keyframe-panel">
              <KeyframeConnector
                keyframes={editorState.keyframes}
                property={editorState.selectedProperty}
                onKeyframeChange={handleKeyframeChange}
                onKeyframeAdd={handleKeyframeAdd}
                onKeyframeDelete={handleKeyframeDelete}
              />
            </div>
          </TimelineProvider>
        </div>

        {/* Right Panel — Props Editor */}
        <aside className="framely-right-panel">
          <PropsEditor
            props={editorState.props}
            defaultProps={activeComp.defaultProps || {}}
            onChange={handlePropsChange}
          />
        </aside>
      </div>

      {/* Render Dialog */}
      <RenderDialog
        open={renderDialogOpen}
        onClose={() => setRenderDialogOpen(false)}
        composition={activeComp}
        inputProps={editorState.props}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        composition={activeComp}
        inputProps={editorState.props}
      />
    </div>
  );
}

/**
 * Bridge between TimelineProvider context and the Timeline component.
 * This reads from the shared context so both PlayerView and Timeline stay in sync.
 */
function TimelineConnector({
  activeComp,
  sequences,
  onSequenceMove,
  onSequenceResize,
  onSequenceAdd,
  onSequenceDelete,
  onSequenceRename,
  audioTracks,
  onAudioTrackDelete,
  onAudioTrackMove,
}) {
  const { frame, durationInFrames, fps, playing, setFrame, play, pause } = useTimeline();

  return (
    <Timeline
      frame={frame}
      durationInFrames={durationInFrames}
      fps={fps}
      sequences={sequences}
      onSeek={setFrame}
      playing={playing}
      onPlay={play}
      onPause={pause}
      onSequenceMove={onSequenceMove}
      onSequenceResize={onSequenceResize}
      onSequenceAdd={onSequenceAdd}
      onSequenceDelete={onSequenceDelete}
      onSequenceRename={onSequenceRename}
      audioTracks={audioTracks}
      onAudioTrackDelete={onAudioTrackDelete}
      onAudioTrackMove={onAudioTrackMove}
    />
  );
}

/**
 * Bridge between TimelineProvider context and the KeyframeEditor.
 * Reads currentFrame, durationInFrames, fps from context.
 */
function KeyframeConnector({
  keyframes,
  property,
  onKeyframeChange,
  onKeyframeAdd,
  onKeyframeDelete,
}) {
  const { frame, durationInFrames, fps } = useTimeline();

  return (
    <KeyframeEditor
      keyframes={keyframes}
      property={property}
      durationInFrames={durationInFrames}
      fps={fps}
      currentFrame={frame}
      height={140}
      onKeyframeChange={onKeyframeChange}
      onKeyframeAdd={onKeyframeAdd}
      onKeyframeDelete={onKeyframeDelete}
    />
  );
}

export default App;
