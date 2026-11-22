import { describe, it, expect, expectTypeOf } from "vitest";
import type {
  Block,
  BlockApi,
  BlockDefinition,
  Direction,
  DocumentModel,
  EditorOptions,
  Locale,
  NawatEditor,
} from "../../src/types.js";

describe("types", () => {
  describe("Block", () => {
    it("accepts a built-in type", () => {
      const block: Block = {
        id: "b1",
        type: "paragraph",
        data: { text: "مرحبا" },
      };
      expect(block.id).toBe("b1");
      expect(block.type).toBe("paragraph");
      expect(block.data).toEqual({ text: "مرحبا" });
    });

    it("accepts a custom type (open string)", () => {
      const block: Block = {
        id: "b2",
        type: "contract-clause",
        data: {},
      };
      expect(block.type).toBe("contract-clause");
    });
  });

  describe("DocumentModel", () => {
    it("holds ordered rootBlockIds and a blocks map", () => {
      const doc: DocumentModel = {
        rootBlockIds: ["b1"],
        blocks: {
          b1: { id: "b1", type: "paragraph", data: {} },
        },
      };
      expect(doc.rootBlockIds).toHaveLength(1);
      expect(doc.blocks.b1?.type).toBe("paragraph");
    });
  });

  describe("BlockDefinition", () => {
    it("requires only the Arabic label", () => {
      const def: BlockDefinition = {
        type: "quote",
        label: { ar: "اقتباس" },
        defaultData: () => ({ text: "" }),
        render: () => document.createElement("div"),
      };
      expect(def.label.ar).toBe("اقتباس");
      expect(def.label.en).toBeUndefined();
    });

    it("accepts an optional English label (FR-14)", () => {
      const def: BlockDefinition = {
        type: "quote",
        label: { ar: "اقتباس", en: "Quote" },
        defaultData: () => ({}),
        render: () => document.createElement("div"),
      };
      expect(def.label.en).toBe("Quote");
    });

    it("render returns an HTMLElement", () => {
      const def: BlockDefinition = {
        type: "x",
        label: { ar: "س" },
        defaultData: () => ({}),
        render: () => document.createElement("div"),
      };
      expect(
        def.render({ id: "b1", type: "x", data: {} }, {} as BlockApi),
      ).toBeInstanceOf(HTMLElement);
    });
  });

  describe("EditorOptions", () => {
    it("requires only container and locale", () => {
      const opts: EditorOptions = {
        container: document.createElement("div"),
        locale: "ar",
      };
      expect(opts.locale).toBe("ar");
    });

    it("accepts optional callbacks and slashMenu", () => {
      const opts: EditorOptions = {
        container: document.createElement("div"),
        locale: "en",
        slashMenu: true,
        onChange: () => {},
        onSave: () => {},
        onReady: () => {},
      };
      expect(opts.slashMenu).toBe(true);
    });
  });

  describe("NawatEditor", () => {
    it("declares all public methods", () => {
      expectTypeOf<NawatEditor>().toHaveProperty("save");
      expectTypeOf<NawatEditor>().toHaveProperty("render");
      expectTypeOf<NawatEditor>().toHaveProperty("getDocument");
      expectTypeOf<NawatEditor>().toHaveProperty("setReadOnly");
      expectTypeOf<NawatEditor>().toHaveProperty("setLocale");
      expectTypeOf<NawatEditor>().toHaveProperty("destroy");
    });
  });

  describe("Direction and Locale", () => {
    it("Direction is rtl or ltr", () => {
      const rtl: Direction = "rtl";
      const ltr: Direction = "ltr";
      expect([rtl, ltr]).toEqual(["rtl", "ltr"]);
    });

    it("Locale is ar or en", () => {
      const ar: Locale = "ar";
      const en: Locale = "en";
      expect([ar, en]).toEqual(["ar", "en"]);
    });
  });
});
