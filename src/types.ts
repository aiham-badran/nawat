/**
 * Nawat — Arabic Block Editor Core
 * Public type definitions (PRD §7.2).
 */

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────

/** A block's type. Open string so custom types work via registerBlock. */
export type BlockType = string;

/** Text direction. */
export type Direction = "rtl" | "ltr";

/** Supported UI locales. English deferred to Phase 2 but typed now. */
export type Locale = "ar" | "en";

// ─────────────────────────────────────────────────────────────
// Block & document model
// ─────────────────────────────────────────────────────────────

/** A single block in the document. */
export interface Block {
  /** Unique block id (assigned by the editor). */
  id: string;
  /** Block type, e.g. "paragraph" | "heading" | custom. */
  type: BlockType;
  /** Type-specific payload. Always JSON-serializable. */
  data: Record<string, unknown>;
}

/** Full document state: flat block map + ordered root ids. */
export interface DocumentModel {
  /** Ordered list of root block ids (top-level order). */
  rootBlockIds: string[];
  /** All blocks keyed by id. */
  blocks: Record<string, Block>;
}

// ─────────────────────────────────────────────────────────────
// Block registration contract
// ─────────────────────────────────────────────────────────────

/**
 * API handed to a block's `render` so custom blocks can interact
 * with the editor without importing Nawat internals.
 */
export interface BlockApi {
  /** Merge a patch into this block's `data`. */
  update: (patch: Partial<Block["data"]>) => void;
  /** Remove this block from the document. */
  remove: () => void;
  /** Insert a sibling block right after this one. */
  insertAfter: (type: BlockType, data?: Record<string, unknown>) => void;
  /** Focus this block's editable region. */
  focus: () => void;
}

/** Contract for registering a new block type via registerBlock(). */
export interface BlockDefinition {
  /** Unique type id, e.g. "paragraph" or "contract-clause". */
  type: BlockType;
  /** Human-readable label. `ar` required; `en` optional (FR-14). */
  label: { ar: string; en?: string };
  /** Factory for a new block's initial `data`. */
  defaultData: () => Record<string, unknown>;
  /** Render the block into a DOM element. */
  render: (block: Block, api: BlockApi) => HTMLElement;
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/** Options for createEditor(). */
export interface EditorOptions {
  /** DOM container the editor mounts into. */
  container: HTMLElement;
  /** Primary locale; drives default direction (ar → rtl, en → ltr). */
  locale: Locale;
  /** Initial document. If omitted, editor starts with one empty paragraph. */
  data?: DocumentModel;
  /** Enable the "/" slash menu (optional, FR-11). */
  slashMenu?: boolean;
  /** Fires on every document change. */
  onChange?: (doc: DocumentModel) => void;
  /** Fires on save(). */
  onSave?: (doc: DocumentModel) => void;
  /** Fires once when the editor is ready. */
  onReady?: () => void;
}

/** Handle returned by createEditor(). */
export interface NawatEditor {
  /** Serialize current state to a DocumentModel. */
  save: () => DocumentModel;
  /** Replace the document with the given one. */
  render: (data: DocumentModel) => void;
  /** Get an immutable snapshot of the current document. */
  getDocument: () => DocumentModel;
  /** Toggle read-only mode. */
  setReadOnly: (value: boolean) => void;
  /** Change locale and direction without losing content. */
  setLocale: (locale: Locale) => void;
  /** Unmount and release all resources. */
  destroy: () => void;
}
