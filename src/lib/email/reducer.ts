import { createBlock } from "./blocks";
import type { Block, BlockType, EmailDoc, EmailSettings } from "./types";

/**
 * Editor state: the document plus undo/redo history. The reducer is pure — ids are supplied by the
 * caller, so every transition is deterministic and unit-testable.
 */
export interface EditorState {
  doc: EmailDoc;
  selectedId: string | null;
  past: EmailDoc[];
  future: EmailDoc[];
  /** Consecutive edits of the same field are merged into one undo step. */
  lastEditKey: string | null;
}

export type EditorAction =
  | { type: "add"; blockType: BlockType; id: string; afterId?: string | null }
  | { type: "update"; id: string; patch: Record<string, string | number> }
  | { type: "move"; id: string; toIndex: number }
  | { type: "moveBy"; id: string; delta: -1 | 1 }
  | { type: "duplicate"; id: string; newId: string }
  | { type: "delete"; id: string }
  | { type: "select"; id: string | null }
  | { type: "settings"; patch: Partial<EmailSettings> }
  | { type: "load"; doc: EmailDoc }
  | { type: "undo" }
  | { type: "redo" };

export const HISTORY_LIMIT = 100;

export function createEditorState(doc: EmailDoc): EditorState {
  return { doc, selectedId: null, past: [], future: [], lastEditKey: null };
}

function commit(
  state: EditorState,
  doc: EmailDoc,
  selectedId: string | null,
  editKey: string | null = null,
): EditorState {
  const merge = editKey !== null && editKey === state.lastEditKey;
  const past = merge ? state.past : [...state.past, state.doc].slice(-HISTORY_LIMIT);
  return { doc, selectedId, past, future: [], lastEditKey: editKey };
}

function withBlocks(doc: EmailDoc, blocks: Block[]): EmailDoc {
  return { ...doc, blocks };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const { doc } = state;
  const blocks = doc.blocks;

  switch (action.type) {
    case "add": {
      const block = createBlock(action.blockType, action.id);
      const at = action.afterId ? blocks.findIndex((b) => b.id === action.afterId) : -1;
      const next = [...blocks];
      next.splice(at === -1 ? next.length : at + 1, 0, block);
      return commit(state, withBlocks(doc, next), block.id);
    }

    case "update": {
      const idx = blocks.findIndex((b) => b.id === action.id);
      if (idx === -1) return state;
      const patch = { ...action.patch };
      // Never let a patch change identity.
      delete patch.id;
      delete patch.type;
      const updated = { ...blocks[idx], ...patch } as Block;
      const next = [...blocks];
      next[idx] = updated;
      return commit(
        state,
        withBlocks(doc, next),
        state.selectedId,
        `block:${action.id}:${Object.keys(patch).sort().join(",")}`,
      );
    }

    case "move": {
      const from = blocks.findIndex((b) => b.id === action.id);
      if (from === -1) return state;
      const to = Math.max(0, Math.min(blocks.length - 1, action.toIndex));
      if (from === to) return state;
      const next = [...blocks];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return commit(state, withBlocks(doc, next), state.selectedId);
    }

    case "moveBy": {
      const from = blocks.findIndex((b) => b.id === action.id);
      if (from === -1) return state;
      const to = from + action.delta;
      if (to < 0 || to >= blocks.length) return state;
      return editorReducer(state, { type: "move", id: action.id, toIndex: to });
    }

    case "duplicate": {
      const idx = blocks.findIndex((b) => b.id === action.id);
      if (idx === -1) return state;
      const copy = { ...blocks[idx], id: action.newId } as Block;
      const next = [...blocks];
      next.splice(idx + 1, 0, copy);
      return commit(state, withBlocks(doc, next), copy.id);
    }

    case "delete": {
      const idx = blocks.findIndex((b) => b.id === action.id);
      if (idx === -1) return state;
      const next = blocks.filter((b) => b.id !== action.id);
      const selectedId =
        state.selectedId === action.id
          ? (next[idx] ?? next[idx - 1] ?? null)?.id ?? null
          : state.selectedId;
      return commit(state, withBlocks(doc, next), selectedId);
    }

    case "select":
      return state.selectedId === action.id
        ? state
        : { ...state, selectedId: action.id, lastEditKey: null };

    case "settings": {
      const settings = { ...doc.settings, ...action.patch };
      return commit(
        state,
        { ...doc, settings },
        state.selectedId,
        `settings:${Object.keys(action.patch).sort().join(",")}`,
      );
    }

    case "load":
      return commit(state, action.doc, null);

    case "undo": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        doc: previous,
        selectedId: previous.blocks.some((b) => b.id === state.selectedId)
          ? state.selectedId
          : null,
        past: state.past.slice(0, -1),
        future: [state.doc, ...state.future],
        lastEditKey: null,
      };
    }

    case "redo": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return {
        doc: next,
        selectedId: next.blocks.some((b) => b.id === state.selectedId)
          ? state.selectedId
          : null,
        past: [...state.past, state.doc],
        future: rest,
        lastEditKey: null,
      };
    }
  }
}
