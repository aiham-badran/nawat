/**
 * Nawat — Arabic Block Editor Core
 * Zustand store (vanilla, framework-agnostic). PRD §7.2 / FR-07.
 */

import { createStore } from "zustand/vanilla";
import { resolveDirection } from "./rtl.js";
import type {
  Block,
  BlockType,
  Direction,
  DocumentModel,
  Locale,
} from "./types.js";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function generateId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function snapshot<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

// ─────────────────────────────────────────────────────────────
// Public state shape
// ─────────────────────────────────────────────────────────────

export interface EditorStoreState {
  document: DocumentModel;
  activeBlockId: string | null;
  locale: Locale;
  direction: Direction;

  /** Append a block, or insert after a given id, or at a given index. Returns the new id. */
  addBlock: (
    type: BlockType,
    data?: Record<string, unknown>,
    opts?: { after?: string; atIndex?: number },
  ) => string;
  removeBlock: (id: string) => void;
  moveBlock: (id: string, toIndex: number) => void;
  updateBlock: (
    id: string,
    patch: { type?: BlockType; data?: Record<string, unknown> },
  ) => void;
  updateBlockData: (id: string, patch: Record<string, unknown>) => void;
  setActiveBlock: (id: string | null) => void;
  setLocale: (locale: Locale) => void;
  setDirection: (direction: Direction) => void;
  setDocument: (doc: DocumentModel) => void;
  /** Immutable snapshot of the current document. */
  getDocument: () => DocumentModel;
}

export type EditorStore = ReturnType<typeof createEditorStore>;

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

const EMPTY_DOCUMENT: DocumentModel = { rootBlockIds: [], blocks: {} };

export function createEditorStore(
  initial?: DocumentModel,
  locale: Locale = "ar",
) {
  return createStore<EditorStoreState>((set, get) => ({
    document: initial ? snapshot(initial) : snapshot(EMPTY_DOCUMENT),
    activeBlockId: null,
    locale,
    direction: resolveDirection(locale),

    addBlock(type, data, opts) {
      const id = generateId();
      const block: Block = {
        id,
        type,
        data: data ? snapshot(data) : {},
      };

      set((state) => {
        const rootBlockIds = [...state.document.rootBlockIds];

        if (opts?.after !== undefined) {
          const idx = rootBlockIds.indexOf(opts.after);
          if (idx === -1) {
            throw new Error(`addBlock: block "${opts.after}" not found`);
          }
          rootBlockIds.splice(idx + 1, 0, id);
        } else if (opts?.atIndex !== undefined) {
          const at = opts.atIndex;
          if (at < 0 || at > rootBlockIds.length) {
            throw new Error(
              `addBlock: atIndex ${at} out of bounds (0..${rootBlockIds.length})`,
            );
          }
          rootBlockIds.splice(at, 0, id);
        } else {
          rootBlockIds.push(id);
        }

        return {
          document: {
            rootBlockIds,
            blocks: { ...state.document.blocks, [id]: block },
          },
        };
      });

      return id;
    },

    removeBlock(id) {
      set((state) => {
        if (!state.document.blocks[id]) return state;
        const blocks = Object.fromEntries(
          Object.entries(state.document.blocks).filter(([k]) => k !== id),
        );
        return {
          document: {
            rootBlockIds: state.document.rootBlockIds.filter((b) => b !== id),
            blocks,
          },
          activeBlockId:
            state.activeBlockId === id ? null : state.activeBlockId,
        };
      });
    },

    moveBlock(id, toIndex) {
      set((state) => {
        const ids = [...state.document.rootBlockIds];
        const from = ids.indexOf(id);
        if (from === -1) {
          throw new Error(`moveBlock: block "${id}" not found`);
        }
        if (toIndex < 0 || toIndex >= ids.length) {
          throw new Error(
            `moveBlock: toIndex ${toIndex} out of bounds (0..${ids.length - 1})`,
          );
        }
        if (from === toIndex) return state;
        ids.splice(from, 1);
        ids.splice(toIndex, 0, id);
        return { document: { ...state.document, rootBlockIds: ids } };
      });
    },

    updateBlock(id, patch) {
      set((state) => {
        const existing = state.document.blocks[id];
        if (!existing) return state;
        const next: Block = {
          ...existing,
          ...(patch.type !== undefined ? { type: patch.type } : {}),
          ...(patch.data !== undefined ? { data: snapshot(patch.data) } : {}),
        };
        return {
          document: {
            ...state.document,
            blocks: { ...state.document.blocks, [id]: next },
          },
        };
      });
    },

    updateBlockData(id, patch) {
      set((state) => {
        const existing = state.document.blocks[id];
        if (!existing) return state;
        const next: Block = {
          ...existing,
          data: { ...existing.data, ...snapshot(patch) },
        };
        return {
          document: {
            ...state.document,
            blocks: { ...state.document.blocks, [id]: next },
          },
        };
      });
    },

    setActiveBlock(id) {
      set({ activeBlockId: id });
    },

    setLocale(locale) {
      set({ locale, direction: resolveDirection(locale) });
    },

    setDirection(direction) {
      set({ direction });
    },

    setDocument(doc) {
      set({ document: snapshot(doc), activeBlockId: null });
    },

    getDocument() {
      return snapshot(get().document);
    },
  }));
}
