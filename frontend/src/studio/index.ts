/**
 * Framely Studio
 *
 * Studio UI components for the Framely editor.
 */

export { Timeline } from './Timeline';
export type {
  SequenceData,
  NewSequenceData,
  InteractionMode,
  DragState,
  TimelineProps,
} from './Timeline';

export { PropsEditor } from './PropsEditor';
export type { PropsEditorProps } from './PropsEditor';

export { RenderDialog } from './RenderDialog';
export type {
  Composition as RenderComposition,
  RenderDialogProps,
} from './RenderDialog';

export { ShareDialog } from './ShareDialog';
export type {
  Composition as ShareComposition,
  ShareDialogProps,
} from './ShareDialog';

export { useHistory, ActionTypes } from './useHistory';
export type {
  SequenceState,
  EditorState,
  UpdatePropAction,
  SetPropsAction,
  ResetPropsAction,
  MoveSequenceAction,
  ResizeSequenceAction,
  AddSequenceAction,
  DeleteSequenceAction,
  RenameSequenceAction,
  ReorderSequencesAction,
  SetStateAction,
  EditorAction,
  HistoryState,
  UseHistoryOptions,
  UseHistoryReturn,
} from './useHistory';

export { KeyframeEditor, evaluateAtFrame } from './KeyframeEditor';
export type { Keyframe, KeyframeEditorProps } from './KeyframeEditor';

export { AssetPanel } from './AssetPanel';
export type { Asset, AssetPanelProps } from './AssetPanel';
