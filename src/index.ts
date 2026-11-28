// Nawat — Arabic Block Editor Core
// Public surface. Runtime API (createEditor) will be added in T-03-07.

export type {
  Block,
  BlockApi,
  BlockDefinition,
  BlockType,
  Direction,
  DocumentModel,
  EditorOptions,
  Locale,
  NawatEditor,
} from "./types.js";

export {
  createBlockRegistry,
  getAllBlockDefinitions,
  getBlockDefinition,
  hasBlockDefinition,
  registerBlock,
} from "./registry.js";
export type { BlockRegistry } from "./registry.js";
