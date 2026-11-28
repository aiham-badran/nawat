/**
 * Nawat — Arabic Block Editor Core
 * Block Registry (PRD §7.2 / FR-06 / FR-14).
 *
 * The registry holds all known block definitions (built-ins + custom).
 * A module-level singleton is exposed via the top-level `registerBlock`
 * API (see PRD §14.4). `createBlockRegistry()` exists for advanced
 * consumers who want an isolated registry, and for tests.
 */

import type { BlockDefinition, BlockType } from "./types.js";

// ─────────────────────────────────────────────────────────────
// Public interface
// ─────────────────────────────────────────────────────────────

export interface BlockRegistry {
  /** Register a new definition. Throws on invalid or duplicate input. */
  register: (definition: BlockDefinition) => void;
  /** Look up a definition by type. */
  get: (type: BlockType) => BlockDefinition | undefined;
  /** All definitions, in registration order. Returns a fresh array. */
  getAll: () => BlockDefinition[];
  /** Whether a type is registered. */
  has: (type: BlockType) => boolean;
  /** Remove all definitions. Intended for tests and advanced reset. */
  clear: () => void;
}

// ─────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateDefinition(
  definition: unknown,
): asserts definition is BlockDefinition {
  if (definition === null || typeof definition !== "object") {
    throw new TypeError("registerBlock: definition must be an object");
  }

  const d = definition as Record<string, unknown>;

  if (!isNonEmptyString(d.type)) {
    throw new TypeError(
      "registerBlock: 'type' must be a non-empty string",
    );
  }

  if (d.label === null || typeof d.label !== "object") {
    throw new TypeError(
      `registerBlock(${d.type}): 'label' must be an object`,
    );
  }

  const label = d.label as Record<string, unknown>;

  if (!isNonEmptyString(label.ar)) {
    throw new TypeError(
      `registerBlock(${d.type}): 'label.ar' must be a non-empty string`,
    );
  }

  if (label.en !== undefined && !isNonEmptyString(label.en)) {
    throw new TypeError(
      `registerBlock(${d.type}): 'label.en' must be a non-empty string when provided`,
    );
  }

  if (typeof d.defaultData !== "function") {
    throw new TypeError(
      `registerBlock(${d.type}): 'defaultData' must be a function`,
    );
  }

  if (typeof d.render !== "function") {
    throw new TypeError(
      `registerBlock(${d.type}): 'render' must be a function`,
    );
  }
}

// ─────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────

export function createBlockRegistry(): BlockRegistry {
  const definitions = new Map<BlockType, BlockDefinition>();

  return {
    register(definition) {
      validateDefinition(definition);
      if (definitions.has(definition.type)) {
        throw new Error(
          `registerBlock: type "${definition.type}" is already registered`,
        );
      }
      definitions.set(definition.type, definition);
    },

    get(type) {
      return definitions.get(type);
    },

    getAll() {
      // Fresh array every call: consumers can sort/splice safely.
      return Array.from(definitions.values());
    },

    has(type) {
      return definitions.has(type);
    },

    clear() {
      definitions.clear();
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Module-level singleton (PRD §14.4)
// ─────────────────────────────────────────────────────────────

const globalRegistry = createBlockRegistry();

/** Register a block definition in the global registry. */
export const registerBlock = (definition: BlockDefinition): void =>
  globalRegistry.register(definition);

/** Look up a definition by type in the global registry. */
export const getBlockDefinition = (
  type: BlockType,
): BlockDefinition | undefined => globalRegistry.get(type);

/** All definitions in the global registry, in registration order. */
export const getAllBlockDefinitions = (): BlockDefinition[] =>
  globalRegistry.getAll();

/** Whether a type is registered in the global registry. */
export const hasBlockDefinition = (type: BlockType): boolean =>
  globalRegistry.has(type);

/**
 * Test-only helper: clears the global registry.
 * Not exported from src/index.ts.
 */
export function _resetBlockRegistry(): void {
  globalRegistry.clear();
}
