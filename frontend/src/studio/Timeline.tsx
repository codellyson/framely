/**
 * Timeline Component
 *
 * Visual timeline for the Framely studio with draggable, resizable
 * sequences and frame-level navigation.
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type MouseEvent,
  type KeyboardEvent,
  type ChangeEvent,
  type FocusEvent,
  type UIEvent,
  type ReactNode,
} from 'react';
import styles from './Timeline.module.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const TRACK_HEIGHT = 32;
const TRACK_GAP = 4;
const RULER_HEIGHT = 24;
const EDGE_HANDLE_WIDTH = 8;
const MIN_SEQUENCE_FRAMES = 1;

const TRACK_COLORS: readonly string[] = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

// ─── Types ────────────────────────────────────────────────────────────────────

/** Represents a single sequence on the timeline. */
export interface SequenceData {
  id?: string | number;
  name?: string;
  from?: number;
  durationInFrames: number;
}

/** Represents an audio track on the timeline. */
export interface AudioTrackData {
  id: string;
  name: string;
  src: string;
  from: number;
  durationInFrames: number;
  volume: number;
}

/** Data passed when adding a new sequence. */
export interface NewSequenceData {
  name: string;
  from: number;
  durationInFrames: number;
}

/** Interaction modes for sequence manipulation. */
export type InteractionMode = 'none' | 'move' | 'resize-left' | 'resize-right';

/** Active drag mode (subset that excludes 'none'). */
type ActiveInteractionMode = Exclude<InteractionMode, 'none'>;

/** Internal state tracked during a drag operation. */
export interface DragState {
  mode: ActiveInteractionMode;
  index: number;
  startX: number;
  origFrom: number;
  origDuration: number;
  shiftKey: boolean;
}

/** Internal state for the context menu. */
interface ContextMenuState {
  x: number;
  y: number;
  index: number;
}

/** Props for the Timeline component. */
export interface TimelineProps {
  /** Current frame position (0-indexed). */
  frame: number;
  /** Total duration in frames. */
  durationInFrames: number;
  /** Frames per second. */
  fps: number;
  /** Array of sequences to display on the timeline. */
  sequences?: SequenceData[];
  /** Callback fired when the user seeks to a specific frame. */
  onSeek?: (frame: number) => void;
  /** Whether playback is currently active. */
  playing?: boolean;
  /** Callback to start playback. */
  onPlay?: () => void;
  /** Callback to pause playback. */
  onPause?: () => void;
  /** Callback fired when a sequence is moved to a new start frame. */
  onSequenceMove?: (index: number, newFrom: number) => void;
  /** Callback fired when a sequence is resized. */
  onSequenceResize?: (index: number, newFrom: number, newDuration: number) => void;
  /** Callback fired to add a new sequence. */
  onSequenceAdd?: (sequence: NewSequenceData) => void;
  /** Callback fired to delete a sequence by index. */
  onSequenceDelete?: (index: number) => void;
  /** Callback fired to rename a sequence. */
  onSequenceRename?: (index: number, newName: string) => void;
  /** Audio tracks to display below sequences. */
  audioTracks?: AudioTrackData[];
  /** Callback fired to delete an audio track by id. */
  onAudioTrackDelete?: (id: string) => void;
  /** Callback fired when an audio track is moved. */
  onAudioTrackMove?: (id: string, newFrom: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Timeline visualization component with draggable sequences.
 */
export function Timeline({
  frame,
  durationInFrames,
  fps,
  sequences = [],
  onSeek,
  playing = false,
  onPlay,
  onPause,
  onSequenceMove,
  onSequenceResize,
  onSequenceAdd,
  onSequenceDelete,
  onSequenceRename,
  audioTracks = [],
  onAudioTrackDelete,
  onAudioTrackMove,
}: TimelineProps): ReactNode {
  const timelineRef = useRef<HTMLDivElement>(null);
  const tracksRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renaming, setRenaming] = useState<number | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const frameWidth: number = 2 * zoom;
  const totalWidth: number = durationInFrames * frameWidth;

  const formatTime = useCallback((f: number): string => {
    const totalSeconds = f / fps;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const frames = f % fps;
    return `${minutes}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }, [fps]);

  const xToFrame = useCallback((clientX: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left + timelineRef.current.scrollLeft;
    return Math.max(0, Math.min(durationInFrames - 1, Math.floor(x / frameWidth)));
  }, [frameWidth, durationInFrames]);

  const snapFrame = useCallback((f: number, shiftKey: boolean): number => {
    if (!shiftKey) return f;
    return Math.round(f / fps) * fps;
  }, [fps]);

  // ─── Playhead scrubbing ──────────────────────────────────────────────────────

  const handleRulerMouseDown = useCallback((e: MouseEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return;
    setIsScrubbing(true);
    onSeek?.(xToFrame(e.clientX));
  }, [xToFrame, onSeek]);

  const handleTracksMouseDown = useCallback((e: MouseEvent<HTMLDivElement>): void => {
    if (e.target !== tracksRef.current) return;
    if (e.button !== 0) return;
    setIsScrubbing(true);
    onSeek?.(xToFrame(e.clientX));
  }, [xToFrame, onSeek]);

  // ─── Sequence drag ───────────────────────────────────────────────────────────

  const handleSequenceMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>, index: number, mode: ActiveInteractionMode): void => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const seq = sequences[index];
      setDrag({
        mode,
        index,
        startX: e.clientX,
        origFrom: seq.from || 0,
        origDuration: seq.durationInFrames,
        shiftKey: e.shiftKey,
      });
    },
    [sequences],
  );

  const getSequenceEdge = useCallback(
    (e: MouseEvent<HTMLDivElement>, el: HTMLDivElement): ActiveInteractionMode => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      if (relX < EDGE_HANDLE_WIDTH) return 'resize-left';
      if (relX > rect.width - EDGE_HANDLE_WIDTH) return 'resize-right';
      return 'move';
    },
    [],
  );

  useEffect(() => {
    if (!drag && !isScrubbing) return;

    const handleMouseMove = (e: globalThis.MouseEvent): void => {
      if (isScrubbing) { onSeek?.(xToFrame(e.clientX)); return; }
      if (!drag) return;
      const deltaX = e.clientX - drag.startX;
      const deltaFrames = Math.round(deltaX / frameWidth);
      const shiftKey = e.shiftKey || drag.shiftKey;

      if (drag.mode === 'move') {
        let newFrom = Math.max(0, drag.origFrom + deltaFrames);
        newFrom = snapFrame(newFrom, shiftKey);
        onSequenceMove?.(drag.index, newFrom);
      } else if (drag.mode === 'resize-left') {
        let newFrom = Math.max(0, drag.origFrom + deltaFrames);
        newFrom = snapFrame(newFrom, shiftKey);
        newFrom = Math.min(newFrom, drag.origFrom + drag.origDuration - MIN_SEQUENCE_FRAMES);
        const newDuration = drag.origDuration - (newFrom - drag.origFrom);
        onSequenceResize?.(drag.index, newFrom, newDuration);
      } else if (drag.mode === 'resize-right') {
        let newDuration = Math.max(MIN_SEQUENCE_FRAMES, drag.origDuration + deltaFrames);
        const snappedEnd = snapFrame(drag.origFrom + newDuration, shiftKey);
        newDuration = Math.max(MIN_SEQUENCE_FRAMES, snappedEnd - drag.origFrom);
        onSequenceResize?.(drag.index, drag.origFrom, newDuration);
      }
    };

    const handleMouseUp = (): void => { setDrag(null); setIsScrubbing(false); };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [drag, isScrubbing, frameWidth, onSeek, onSequenceMove, onSequenceResize, snapFrame, xToFrame]);

  // ─── Context menu ────────────────────────────────────────────────────────────

  const handleContextMenu = useCallback((e: MouseEvent<HTMLDivElement>, index: number): void => {
    e.preventDefault(); e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, index });
  }, []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = (): void => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  // ─── Rename ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (renaming !== null && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renaming]);

  const handleRenameSubmit = useCallback((index: number, name: string): void => {
    if (name.trim()) onSequenceRename?.(index, name.trim());
    setRenaming(null);
  }, [onSequenceRename]);

  // ─── Add sequence ────────────────────────────────────────────────────────────

  const handleAddSequence = useCallback((): void => {
    const lastSeq = sequences[sequences.length - 1];
    const from = lastSeq ? (lastSeq.from || 0) + lastSeq.durationInFrames : 0;
    const dur = Math.min(fps * 3, durationInFrames - from);
    if (dur <= 0) return;
    onSequenceAdd?.({ name: `Sequence ${sequences.length + 1}`, from, durationInFrames: dur });
  }, [sequences, fps, durationInFrames, onSequenceAdd]);

  // ─── Ruler markers ───────────────────────────────────────────────────────────

  const rulerMarkers = useMemo((): ReactNode[] => {
    const markers: ReactNode[] = [];
    const interval = Math.max(1, Math.floor(fps / zoom));
    for (let f = 0; f < durationInFrames; f += interval) {
      const isMajor = f % fps === 0;
      markers.push(
        <div
          key={f}
          className={`${styles.rulerMarker} ${isMajor ? styles.rulerMarkerMajor : styles.rulerMarkerMinor}`}
          style={{ left: f * frameWidth, top: isMajor ? 0 : 12, height: isMajor ? '100%' : '50%' }}
        >
          {isMajor && <span className={styles.rulerLabel}>{Math.floor(f / fps)}s</span>}
        </div>,
      );
    }
    return markers;
  }, [durationInFrames, fps, frameWidth, zoom]);

  const sequenceTracksHeight: number = sequences.length * (TRACK_HEIGHT + TRACK_GAP) + TRACK_GAP;
  const audioTracksOffset: number = sequenceTracksHeight + (audioTracks.length > 0 ? 4 : 0);
  const tracksHeight: number = Math.max(100, audioTracksOffset + audioTracks.length * (TRACK_HEIGHT + TRACK_GAP) + 40);

  const dragCursor: string | undefined = drag
    ? drag.mode === 'move' ? 'grabbing' : 'ew-resize'
    : isScrubbing ? 'col-resize' : undefined;

  return (
    <div
      className={styles.container}
      style={{ cursor: dragCursor, userSelect: drag || isScrubbing ? 'none' : undefined }}
    >
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button
          onClick={() => (playing ? onPause?.() : onPlay?.())}
          aria-label={playing ? 'Pause playback' : 'Start playback'}
          className={styles.playBtn}
        >
          {playing ? '\u23F8' : '\u25B6'}
        </button>

        <div className={styles.timeDisplay}>{formatTime(frame)}</div>

        <input
          type="number"
          value={frame}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onSeek?.(parseInt(e.target.value, 10) || 0)}
          aria-label="Current frame"
          className={styles.frameInput}
        />

        <span className={styles.frameDivider}>/ {durationInFrames - 1}</span>

        {onSequenceAdd && (
          <button onClick={handleAddSequence} aria-label="Add sequence" title="Add sequence" className={styles.addSequenceBtn}>
            + Sequence
          </button>
        )}

        <div className={styles.zoomControls}>
          <span className={styles.zoomLabel}>Zoom:</span>
          <input
            type="range" min="0.5" max="4" step="0.5" value={zoom}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setZoom(parseFloat(e.target.value))}
            aria-label="Timeline zoom level"
            className={styles.zoomSlider}
          />
          <span className={styles.zoomValue}>{zoom}x</span>
        </div>
      </div>

      {/* Timeline area */}
      <div
        ref={timelineRef}
        role="slider"
        aria-label="Timeline scrubber"
        aria-valuemin={0}
        aria-valuemax={durationInFrames - 1}
        aria-valuenow={frame}
        aria-valuetext={formatTime(frame)}
        tabIndex={0}
        className={styles.timelineArea}
        onScroll={(e: UIEvent<HTMLDivElement>) => setScrollLeft(e.currentTarget.scrollLeft)}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          const step = e.shiftKey ? fps : 1;
          if (e.key === 'ArrowRight') { e.preventDefault(); onSeek?.(Math.min(durationInFrames - 1, frame + step)); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); onSeek?.(Math.max(0, frame - step)); }
          else if (e.key === 'Home') { e.preventDefault(); onSeek?.(0); }
          else if (e.key === 'End') { e.preventDefault(); onSeek?.(durationInFrames - 1); }
          else if ((e.key === 'Delete' || e.key === 'Backspace') && contextMenu) {
            e.preventDefault(); onSequenceDelete?.(contextMenu.index); setContextMenu(null);
          }
        }}
      >
        {/* Ruler */}
        <div className={styles.ruler} style={{ height: RULER_HEIGHT, width: totalWidth }} onMouseDown={handleRulerMouseDown}>
          {rulerMarkers}
        </div>

        {/* Tracks */}
        <div ref={tracksRef} style={{ position: 'relative', width: totalWidth, minHeight: tracksHeight }} onMouseDown={handleTracksMouseDown}>
          {sequences.map((seq: SequenceData, index: number) => {
            const seqFrom: number = seq.from || 0;
            const isDragging: boolean = drag?.index === index;

            return (
              <div
                key={seq.id || index}
                className={`${styles.sequence} ${isDragging ? styles.sequenceDragging : ''}`}
                style={{
                  top: index * (TRACK_HEIGHT + TRACK_GAP) + TRACK_GAP,
                  left: seqFrom * frameWidth,
                  width: seq.durationInFrames * frameWidth,
                  height: TRACK_HEIGHT,
                  backgroundColor: TRACK_COLORS[index % TRACK_COLORS.length],
                  zIndex: isDragging ? 5 : 1,
                }}
                onMouseDown={(e: MouseEvent<HTMLDivElement>) => handleSequenceMouseDown(e, index, getSequenceEdge(e, e.currentTarget))}
                onMouseMove={(e: MouseEvent<HTMLDivElement>) => {
                  if (drag) return;
                  const mode = getSequenceEdge(e, e.currentTarget);
                  e.currentTarget.style.cursor = mode === 'move' ? 'grab' : 'ew-resize';
                }}
                onContextMenu={(e: MouseEvent<HTMLDivElement>) => handleContextMenu(e, index)}
                onDoubleClick={() => setRenaming(index)}
              >
                <div className={`${styles.resizeHandle} ${styles.resizeHandleLeft} ${isDragging && drag?.mode === 'resize-left' ? styles.resizeHandleActive : ''}`} />

                {renaming === index ? (
                  <input
                    ref={renameInputRef}
                    defaultValue={seq.name || `Sequence ${index + 1}`}
                    onBlur={(e: FocusEvent<HTMLInputElement>) => handleRenameSubmit(index, e.target.value)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') handleRenameSubmit(index, (e.target as HTMLInputElement).value);
                      if (e.key === 'Escape') setRenaming(null);
                      e.stopPropagation();
                    }}
                    onClick={(e: MouseEvent<HTMLInputElement>) => e.stopPropagation()}
                    onMouseDown={(e: MouseEvent<HTMLInputElement>) => e.stopPropagation()}
                    className={styles.renameInput}
                  />
                ) : (
                  <span className={styles.sequenceLabel}>{seq.name || `Sequence ${index + 1}`}</span>
                )}

                <div className={`${styles.resizeHandle} ${styles.resizeHandleRight} ${isDragging && drag?.mode === 'resize-right' ? styles.resizeHandleActive : ''}`} />
              </div>
            );
          })}

          {/* Audio tracks */}
          {audioTracks.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: audioTracksOffset - 4,
                left: 0,
                width: totalWidth,
                height: 1,
                backgroundColor: '#555',
              }}
            />
          )}
          {audioTracks.map((track: AudioTrackData, index: number) => (
            <div
              key={track.id}
              className={styles.sequence}
              style={{
                top: audioTracksOffset + index * (TRACK_HEIGHT + TRACK_GAP),
                left: track.from * frameWidth,
                width: track.durationInFrames * frameWidth,
                height: TRACK_HEIGHT,
                backgroundColor: '#10b981',
                zIndex: 1,
              }}
              title={`${track.name} (volume: ${Math.round(track.volume * 100)}%)`}
              onContextMenu={(e: MouseEvent<HTMLDivElement>) => {
                e.preventDefault();
                e.stopPropagation();
                if (onAudioTrackDelete) onAudioTrackDelete(track.id);
              }}
            >
              <span style={{ fontSize: '10px', marginRight: 4, opacity: 0.7 }}>{'\uD83C\uDFB5'}</span>
              <span className={styles.sequenceLabel}>{track.name}</span>
            </div>
          ))}

          {sequences.length === 0 && audioTracks.length === 0 && (
            <div className={styles.emptyTrack} style={{ top: TRACK_GAP, left: 0, width: totalWidth, height: TRACK_HEIGHT }} />
          )}

          <div className={styles.playhead} style={{ left: frame * frameWidth }}>
            <div className={styles.playheadHead} style={{ top: -RULER_HEIGHT }} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span>{fps} FPS</span>
        <span>{(durationInFrames / fps).toFixed(2)}s total</span>
        <span>{sequences.length} sequence(s){audioTracks.length > 0 ? ` · ${audioTracks.length} audio` : ''}</span>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div className={styles.contextMenu} style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button
            className={styles.contextMenuItem}
            onClick={() => { setRenaming(contextMenu.index); setContextMenu(null); }}
          >
            Rename
          </button>
          <button
            className={styles.contextMenuItem}
            onClick={() => {
              const seq = sequences[contextMenu.index];
              onSequenceAdd?.({ name: `${seq.name || 'Sequence'} (copy)`, from: (seq.from || 0) + seq.durationInFrames, durationInFrames: seq.durationInFrames });
              setContextMenu(null);
            }}
          >
            Duplicate
          </button>
          <div className={styles.contextMenuDivider} />
          <button
            className={`${styles.contextMenuItem} ${styles.contextMenuDanger}`}
            onClick={() => { onSequenceDelete?.(contextMenu.index); setContextMenu(null); }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default Timeline;
