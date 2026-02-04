/**
 * Undo/Redo History System
 *
 * Command-pattern history stack for all editor state changes.
 * Provides undo, redo, and action dispatch with configurable max history.
 */

import { useReducer, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// State interfaces
// ---------------------------------------------------------------------------

export interface SequenceState {
  name: string;
  from: number;
  durationInFrames: number;
  [key: string]: unknown;
}

export interface KeyframeState {
  frame: number;
  value: number;
  easing?: string;
}

export interface AudioTrackState {
  id: string;
  name: string;
  src: string;
  from: number;
  durationInFrames: number;
  volume: number;
}

export interface EditorState {
  props: Record<string, unknown>;
  defaultProps?: Record<string, unknown>;
  sequences: SequenceState[];
  keyframes: KeyframeState[];
  selectedProperty: string;
  audioTracks: AudioTrackState[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export const ActionTypes = {
  UPDATE_PROP: 'UPDATE_PROP',
  SET_PROPS: 'SET_PROPS',
  RESET_PROPS: 'RESET_PROPS',
  MOVE_SEQUENCE: 'MOVE_SEQUENCE',
  RESIZE_SEQUENCE: 'RESIZE_SEQUENCE',
  ADD_SEQUENCE: 'ADD_SEQUENCE',
  DELETE_SEQUENCE: 'DELETE_SEQUENCE',
  RENAME_SEQUENCE: 'RENAME_SEQUENCE',
  REORDER_SEQUENCES: 'REORDER_SEQUENCES',
  ADD_KEYFRAME: 'ADD_KEYFRAME',
  UPDATE_KEYFRAME: 'UPDATE_KEYFRAME',
  DELETE_KEYFRAME: 'DELETE_KEYFRAME',
  SET_KEYFRAMES: 'SET_KEYFRAMES',
  SET_SELECTED_PROPERTY: 'SET_SELECTED_PROPERTY',
  ADD_AUDIO_TRACK: 'ADD_AUDIO_TRACK',
  UPDATE_AUDIO_TRACK: 'UPDATE_AUDIO_TRACK',
  DELETE_AUDIO_TRACK: 'DELETE_AUDIO_TRACK',
  SET_STATE: 'SET_STATE',
} as const;

export interface UpdatePropAction {
  type: typeof ActionTypes.UPDATE_PROP;
  key: string;
  value: unknown;
}

export interface SetPropsAction {
  type: typeof ActionTypes.SET_PROPS;
  props: Record<string, unknown>;
}

export interface ResetPropsAction {
  type: typeof ActionTypes.RESET_PROPS;
}

export interface MoveSequenceAction {
  type: typeof ActionTypes.MOVE_SEQUENCE;
  index: number;
  from: number;
}

export interface ResizeSequenceAction {
  type: typeof ActionTypes.RESIZE_SEQUENCE;
  index: number;
  from?: number;
  durationInFrames?: number;
}

export interface AddSequenceAction {
  type: typeof ActionTypes.ADD_SEQUENCE;
  sequence: SequenceState;
}

export interface DeleteSequenceAction {
  type: typeof ActionTypes.DELETE_SEQUENCE;
  index: number;
}

export interface RenameSequenceAction {
  type: typeof ActionTypes.RENAME_SEQUENCE;
  index: number;
  name: string;
}

export interface ReorderSequencesAction {
  type: typeof ActionTypes.REORDER_SEQUENCES;
  fromIndex: number;
  toIndex: number;
}

export interface AddKeyframeAction {
  type: typeof ActionTypes.ADD_KEYFRAME;
  keyframe: KeyframeState;
}

export interface UpdateKeyframeAction {
  type: typeof ActionTypes.UPDATE_KEYFRAME;
  index: number;
  keyframe: KeyframeState;
}

export interface DeleteKeyframeAction {
  type: typeof ActionTypes.DELETE_KEYFRAME;
  index: number;
}

export interface SetKeyframesAction {
  type: typeof ActionTypes.SET_KEYFRAMES;
  keyframes: KeyframeState[];
}

export interface SetSelectedPropertyAction {
  type: typeof ActionTypes.SET_SELECTED_PROPERTY;
  property: string;
}

export interface AddAudioTrackAction {
  type: typeof ActionTypes.ADD_AUDIO_TRACK;
  track: AudioTrackState;
}

export interface UpdateAudioTrackAction {
  type: typeof ActionTypes.UPDATE_AUDIO_TRACK;
  id: string;
  updates: Partial<Omit<AudioTrackState, 'id'>>;
}

export interface DeleteAudioTrackAction {
  type: typeof ActionTypes.DELETE_AUDIO_TRACK;
  id: string;
}

export interface SetStateAction {
  type: typeof ActionTypes.SET_STATE;
  state: Partial<EditorState>;
}

export type EditorAction =
  | UpdatePropAction
  | SetPropsAction
  | ResetPropsAction
  | MoveSequenceAction
  | ResizeSequenceAction
  | AddSequenceAction
  | DeleteSequenceAction
  | RenameSequenceAction
  | ReorderSequencesAction
  | AddKeyframeAction
  | UpdateKeyframeAction
  | DeleteKeyframeAction
  | SetKeyframesAction
  | SetSelectedPropertyAction
  | AddAudioTrackAction
  | UpdateAudioTrackAction
  | DeleteAudioTrackAction
  | SetStateAction;

// ---------------------------------------------------------------------------
// History state & options
// ---------------------------------------------------------------------------

export interface HistoryState {
  past: EditorState[];
  pointer: number;
  current: EditorState;
  maxEntries: number;
}

export interface UseHistoryOptions {
  maxEntries?: number;
}

export interface UseHistoryReturn {
  state: EditorState;
  dispatch: (action: EditorAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  historyPointer: number;
}

// ---------------------------------------------------------------------------
// Internal meta-actions
// ---------------------------------------------------------------------------

const UNDO = '__HISTORY_UNDO__' as const;
const REDO = '__HISTORY_REDO__' as const;

interface UndoMetaAction {
  type: typeof UNDO;
}

interface RedoMetaAction {
  type: typeof REDO;
}

type HistoryAction = EditorAction | UndoMetaAction | RedoMetaAction;

// ---------------------------------------------------------------------------
// Reducers
// ---------------------------------------------------------------------------

/**
 * Apply an action to the editor state.
 */
function applyAction(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case ActionTypes.UPDATE_PROP: {
      return {
        ...state,
        props: { ...state.props, [action.key]: action.value },
      };
    }

    case ActionTypes.SET_PROPS: {
      return {
        ...state,
        props: { ...action.props },
      };
    }

    case ActionTypes.RESET_PROPS: {
      return {
        ...state,
        props: { ...state.defaultProps },
      };
    }

    case ActionTypes.MOVE_SEQUENCE: {
      return {
        ...state,
        sequences: state.sequences.map((seq, i) =>
          i === action.index ? { ...seq, from: action.from } : seq,
        ),
      };
    }

    case ActionTypes.RESIZE_SEQUENCE: {
      return {
        ...state,
        sequences: state.sequences.map((seq, i) =>
          i === action.index
            ? {
                ...seq,
                from: action.from !== undefined ? action.from : seq.from,
                durationInFrames:
                  action.durationInFrames !== undefined
                    ? action.durationInFrames
                    : seq.durationInFrames,
              }
            : seq,
        ),
      };
    }

    case ActionTypes.ADD_SEQUENCE: {
      return {
        ...state,
        sequences: [...state.sequences, action.sequence],
      };
    }

    case ActionTypes.DELETE_SEQUENCE: {
      return {
        ...state,
        sequences: state.sequences.filter((_, i) => i !== action.index),
      };
    }

    case ActionTypes.RENAME_SEQUENCE: {
      return {
        ...state,
        sequences: state.sequences.map((seq, i) =>
          i === action.index ? { ...seq, name: action.name } : seq,
        ),
      };
    }

    case ActionTypes.REORDER_SEQUENCES: {
      const reordered = [...state.sequences];
      const [moved] = reordered.splice(action.fromIndex, 1);
      reordered.splice(action.toIndex, 0, moved);
      return { ...state, sequences: reordered };
    }

    case ActionTypes.ADD_KEYFRAME: {
      return {
        ...state,
        keyframes: [...state.keyframes, action.keyframe],
      };
    }

    case ActionTypes.UPDATE_KEYFRAME: {
      return {
        ...state,
        keyframes: state.keyframes.map((kf, i) =>
          i === action.index ? action.keyframe : kf,
        ),
      };
    }

    case ActionTypes.DELETE_KEYFRAME: {
      return {
        ...state,
        keyframes: state.keyframes.filter((_, i) => i !== action.index),
      };
    }

    case ActionTypes.SET_KEYFRAMES: {
      return {
        ...state,
        keyframes: action.keyframes,
      };
    }

    case ActionTypes.SET_SELECTED_PROPERTY: {
      return {
        ...state,
        selectedProperty: action.property,
      };
    }

    case ActionTypes.ADD_AUDIO_TRACK: {
      return {
        ...state,
        audioTracks: [...state.audioTracks, action.track],
      };
    }

    case ActionTypes.UPDATE_AUDIO_TRACK: {
      return {
        ...state,
        audioTracks: state.audioTracks.map((t) =>
          t.id === action.id ? { ...t, ...action.updates } : t,
        ),
      };
    }

    case ActionTypes.DELETE_AUDIO_TRACK: {
      return {
        ...state,
        audioTracks: state.audioTracks.filter((t) => t.id !== action.id),
      };
    }

    case ActionTypes.SET_STATE: {
      return { ...state, ...action.state };
    }

    default:
      return state;
  }
}

/**
 * History-aware reducer. Wraps the state reducer with undo/redo stack.
 */
function historyReducer(history: HistoryState, action: HistoryAction): HistoryState {
  if (action.type === UNDO) {
    if (history.pointer <= 0) return history;

    const newPointer = history.pointer - 1;
    return {
      ...history,
      pointer: newPointer,
      current: history.past[newPointer],
    };
  }

  if (action.type === REDO) {
    if (history.pointer >= history.past.length - 1) return history;

    const newPointer = history.pointer + 1;
    return {
      ...history,
      pointer: newPointer,
      current: history.past[newPointer],
    };
  }

  // Regular action — apply to current state and push to history
  const newState = applyAction(history.current, action);

  // If state didn't change, don't push to history
  if (newState === history.current) return history;

  // Truncate any redo entries beyond current pointer
  const newPast = history.past.slice(0, history.pointer + 1);
  newPast.push(newState);

  // Enforce max history limit
  if (newPast.length > history.maxEntries) {
    newPast.shift();
    return {
      ...history,
      past: newPast,
      pointer: newPast.length - 1,
      current: newState,
    };
  }

  return {
    ...history,
    past: newPast,
    pointer: newPast.length - 1,
    current: newState,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook providing undo/redo history for editor state.
 *
 * @param initialState - Initial editor state
 * @param options - Configuration options
 * @param options.maxEntries - Maximum history entries (default: 100)
 * @returns History-managed state with dispatch, undo, redo, and status flags
 *
 * @example
 * const { state, dispatch, undo, redo, canUndo, canRedo } = useHistory({
 *   props: { color: '#fff' },
 *   sequences: [{ name: 'Intro', from: 0, durationInFrames: 90 }],
 * });
 *
 * dispatch({ type: ActionTypes.UPDATE_PROP, key: 'color', value: '#ff0000' });
 * undo(); // reverts color to #fff
 */
export function useHistory(
  initialState: EditorState,
  options: UseHistoryOptions = {},
): UseHistoryReturn {
  const { maxEntries = 100 } = options;

  const [history, rawDispatch] = useReducer(historyReducer, {
    past: [initialState],
    pointer: 0,
    current: initialState,
    maxEntries,
  });

  const dispatch = useCallback(
    (action: EditorAction) => rawDispatch(action),
    [],
  );

  const undo = useCallback(() => rawDispatch({ type: UNDO }), []);
  const redo = useCallback(() => rawDispatch({ type: REDO }), []);

  const canUndo = history.pointer > 0;
  const canRedo = history.pointer < history.past.length - 1;

  // Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state: history.current,
    dispatch,
    undo,
    redo,
    canUndo,
    canRedo,
    historyLength: history.past.length,
    historyPointer: history.pointer,
  };
}

export default useHistory;
