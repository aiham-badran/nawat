/**
 * Nawat — Arabic Block Editor Core
 * Blok Adapter (PRD §7.1 / NFR-05).
 *
 * This is the ONLY file in Nawat that imports from @bloklabs/core.
 * Everything above this layer talks to the BlokAdapter interface,
 * never to Blok directly. Replacing the engine later means
 * rewriting this file only.
 */

import { Blok } from "@bloklabs/core";
import { Header, List, Paragraph, Quote } from "@bloklabs/core/tools";
import type { BlockType, Direction, DocumentModel, Locale } from "../types.js";

// ─────────────────────────────────────────────────────────────
// Public adapter interface
// ─────────────────────────────────────────────────────────────

export interface BlokAdapter {
  /** Resolves when Blok is fully mounted and ready. */
  readonly ready: Promise<void>;
  /** Serialize current content to Nawat's DocumentModel. */
  save: () => Promise<DocumentModel>;
  /** Replace the document with the given one. */
  render: (data: DocumentModel) => Promise<void>;
  /** Toggle read-only mode. */
  setReadOnly: (value: boolean) => void;
  /** Change the document direction (RTL/LTR). */
  setDirection: (direction: Direction) => Promise<void>;
  /** Change locale (i18n). */
  setLocale: (locale: Locale) => Promise<void>;
  /** Unmount and release resources. */
  destroy: () => void;
}

export interface CreateBlokAdapterOptions {
  /** DOM element to mount into (Blok accepts id or element). */
  container: HTMLElement;
  /** Primary locale. */
  locale: Locale;
  /** Initial document (optional). */
  data?: DocumentModel;
  /** Callback fired on every content change. */
  onChange?: (doc: DocumentModel) => void;
}

// ─────────────────────────────────────────────────────────────
// Built-in tools (Nawat's core block set)
// ─────────────────────────────────────────────────────────────

/**
 * The block tools Nawat registers by default.
 * Exported so upper layers can introspect available types
 * without importing @bloklabs/core themselves.
 */
export const BUILTIN_TOOL_MAP = {
  paragraph: Paragraph,
  header: Header,
  list: List,
  quote: Quote,
} as const;

/** Types of built-in blocks Nawat ships with. */
export const BUILTIN_BLOCK_TYPES: readonly BlockType[] = [
  "paragraph",
  "header",
  "list",
  "quote",
] as const;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Convert Blok's OutputData into Nawat's DocumentModel (flat map). */
function toDocumentModel(output: {
  blocks: Array<{ id?: string; type: string; data?: unknown }>;
}): DocumentModel {
  const rootBlockIds: string[] = [];
  const blocks: DocumentModel["blocks"] = {};

  for (const b of output.blocks) {
    const id = b.id ?? crypto.randomUUID();
    blocks[id] = {
      id,
      type: b.type,
      data: (b.data as Record<string, unknown>) ?? {},
    };
    rootBlockIds.push(id);
  }

  return { rootBlockIds, blocks };
}

/** Convert Nawat's DocumentModel into the shape Blok's render() accepts. */
function toBlokOutput(data: DocumentModel): {
  blocks: Array<{ id: string; type: string; data: Record<string, unknown> }>;
} {
  return {
    blocks: data.rootBlockIds
      .map((id) => data.blocks[id])
      .filter((b): b is NonNullable<typeof b> => b !== undefined)
      .map((b) => ({ id: b.id, type: b.type, data: b.data })),
  };
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

export function createBlokAdapter(
  options: CreateBlokAdapterOptions,
): BlokAdapter {
  const { container, locale, data, onChange } = options;

  const editor = new Blok({
    holder: container,
    tools: { ...BUILTIN_TOOL_MAP },
    data: data ? toBlokOutput(data) : undefined,
    i18n: { locale },
    onChange: onChange
      ? async () => {
          // Blok's onChange is sync; we emit after the microtask
          // so the editor's internal state is settled.
          try {
            const saved = await editor.save();
            onChange(toDocumentModel(saved));
          } catch {
            // Blok throws save() in read-only mode; ignore here.
          }
        }
      : undefined,
  });

  return {
    ready: editor.isReady.then(() => undefined),

    async save() {
      const out = await editor.save();
      return toDocumentModel(out);
    },

    async render(next) {
      await editor.render(toBlokOutput(next));
    },

    setReadOnly(value) {
      editor.readOnly.set(value);
    },

    async setDirection(direction) {
      container.setAttribute("dir", direction);
      await editor.i18n.update({ direction });
    },

    setLocale(next) {
      return editor.i18n.update({ locale: next });
    },

    destroy() {
      editor.destroy();
    },
  };
}
