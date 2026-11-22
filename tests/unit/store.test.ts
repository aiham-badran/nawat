import { describe, it, expect, beforeEach } from "vitest";
import { createEditorStore, type EditorStore } from "../../src/store.js";
import type { DocumentModel } from "../../src/types.js";

let store: EditorStore;

beforeEach(() => {
  store = createEditorStore();
});

describe("createEditorStore", () => {
  describe("initial state", () => {
    it("starts empty with ar locale and rtl direction", () => {
      const s = store.getState();
      expect(s.document).toEqual({ rootBlockIds: [], blocks: {} });
      expect(s.locale).toBe("ar");
      expect(s.direction).toBe("rtl");
      expect(s.activeBlockId).toBeNull();
    });

    it("accepts an initial document and locale", () => {
      const seeded: DocumentModel = {
        rootBlockIds: ["b1"],
        blocks: { b1: { id: "b1", type: "paragraph", data: { text: "x" } } },
      };
      const s2 = createEditorStore(seeded, "en").getState();
      expect(s2.document.rootBlockIds).toEqual(["b1"]);
      expect(s2.locale).toBe("en");
      expect(s2.direction).toBe("ltr");
    });

    it("does not mutate the caller's initial document", () => {
      const seeded: DocumentModel = { rootBlockIds: [], blocks: {} };
      const s2 = createEditorStore(seeded);
      s2.getState().addBlock("paragraph", { text: "new" });
      expect(seeded.rootBlockIds).toEqual([]);
      expect(seeded.blocks).toEqual({});
    });
  });

  describe("addBlock", () => {
    it("appends by default and returns the new id", () => {
      const id = store.getState().addBlock("paragraph", { text: "a" });
      expect(typeof id).toBe("string");
      expect(store.getState().document.rootBlockIds).toEqual([id]);
      expect(store.getState().document.blocks[id]).toMatchObject({
        id,
        type: "paragraph",
        data: { text: "a" },
      });
    });

    it("inserts after a given block", () => {
      const a = store.getState().addBlock("paragraph");
      const b = store.getState().addBlock("paragraph");
      const c = store.getState().addBlock("paragraph", undefined, { after: a });
      expect(store.getState().document.rootBlockIds).toEqual([a, c, b]);
    });

    it("inserts at a given index", () => {
      const a = store.getState().addBlock("paragraph");
      const b = store.getState().addBlock("paragraph");
      const c = store.getState().addBlock("paragraph", undefined, { atIndex: 1 });
      expect(store.getState().document.rootBlockIds).toEqual([a, c, b]);
    });

    it("throws when 'after' references an unknown block", () => {
      expect(() =>
        store.getState().addBlock("paragraph", undefined, { after: "missing" }),
      ).toThrow(/not found/);
    });

    it("throws when atIndex is out of bounds", () => {
      expect(() =>
        store.getState().addBlock("paragraph", undefined, { atIndex: 5 }),
      ).toThrow(/out of bounds/);
    });

    it("generates unique ids across many calls", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(store.getState().addBlock("paragraph"));
      }
      expect(ids.size).toBe(100);
    });
  });

  describe("removeBlock", () => {
    it("removes from rootBlockIds and blocks", () => {
      const a = store.getState().addBlock("paragraph");
      const b = store.getState().addBlock("paragraph");
      store.getState().removeBlock(a);
      expect(store.getState().document.rootBlockIds).toEqual([b]);
      expect(store.getState().document.blocks[a]).toBeUndefined();
    });

    it("is a no-op for unknown ids", () => {
      const a = store.getState().addBlock("paragraph");
      store.getState().removeBlock("nope");
      expect(store.getState().document.rootBlockIds).toEqual([a]);
    });

    it("clears activeBlockId when removing the active block", () => {
      const a = store.getState().addBlock("paragraph");
      store.getState().setActiveBlock(a);
      store.getState().removeBlock(a);
      expect(store.getState().activeBlockId).toBeNull();
    });

    it("keeps activeBlockId when removing another block", () => {
      const a = store.getState().addBlock("paragraph");
      const b = store.getState().addBlock("paragraph");
      store.getState().setActiveBlock(b);
      store.getState().removeBlock(a);
      expect(store.getState().activeBlockId).toBe(b);
    });
  });

  describe("moveBlock", () => {
    it("reorders rootBlockIds", () => {
      const a = store.getState().addBlock("paragraph");
      const b = store.getState().addBlock("paragraph");
      const c = store.getState().addBlock("paragraph");
      store.getState().moveBlock(c, 0);
      expect(store.getState().document.rootBlockIds).toEqual([c, a, b]);
    });

    it("throws when the block is missing", () => {
      expect(() => store.getState().moveBlock("nope", 0)).toThrow(/not found/);
    });

    it("throws when the target index is out of bounds", () => {
      const a = store.getState().addBlock("paragraph");
      expect(() => store.getState().moveBlock(a, 5)).toThrow(/out of bounds/);
    });

    it("is a no-op when source and target coincide", () => {
      const a = store.getState().addBlock("paragraph");
      const before = [...store.getState().document.rootBlockIds];
      store.getState().moveBlock(a, 0);
      expect(store.getState().document.rootBlockIds).toEqual(before);
    });
  });

  describe("updateBlock / updateBlockData", () => {
    it("updateBlock replaces type and data wholesale", () => {
      const id = store.getState().addBlock("paragraph", { text: "a" });
      store.getState().updateBlock(id, {
        type: "heading",
        data: { text: "b", level: 1 },
      });
      const block = store.getState().document.blocks[id];
      expect(block?.type).toBe("heading");
      expect(block?.data).toEqual({ text: "b", level: 1 });
    });

    it("updateBlockData merges into existing data", () => {
      const id = store.getState().addBlock("paragraph", { text: "a" });
      store.getState().updateBlockData(id, { align: "center" });
      expect(store.getState().document.blocks[id]?.data).toEqual({
        text: "a",
        align: "center",
      });
    });

    it("are no-ops for unknown ids", () => {
      store.getState().updateBlock("nope", { type: "x" });
      store.getState().updateBlockData("nope", { x: 1 });
      expect(store.getState().document.blocks).toEqual({});
    });
  });

  describe("setActiveBlock", () => {
    it("sets and clears activeBlockId", () => {
      const a = store.getState().addBlock("paragraph");
      store.getState().setActiveBlock(a);
      expect(store.getState().activeBlockId).toBe(a);
      store.getState().setActiveBlock(null);
      expect(store.getState().activeBlockId).toBeNull();
    });
  });

  describe("setLocale / setDirection", () => {
    it("setLocale updates direction accordingly", () => {
      store.getState().setLocale("en");
      expect(store.getState().direction).toBe("ltr");
      store.getState().setLocale("ar");
      expect(store.getState().direction).toBe("rtl");
    });

    it("setDirection overrides independently of locale", () => {
      store.getState().setDirection("ltr");
      expect(store.getState().direction).toBe("ltr");
      expect(store.getState().locale).toBe("ar");
    });
  });

  describe("setDocument / getDocument", () => {
    it("setDocument replaces content and clears activeBlockId", () => {
      const a = store.getState().addBlock("paragraph");
      store.getState().setActiveBlock(a);
      const next: DocumentModel = {
        rootBlockIds: ["x"],
        blocks: { x: { id: "x", type: "heading", data: {} } },
      };
      store.getState().setDocument(next);
      expect(store.getState().document.rootBlockIds).toEqual(["x"]);
      expect(store.getState().activeBlockId).toBeNull();
    });

    it("getDocument returns an immutable snapshot", () => {
      const id = store.getState().addBlock("paragraph", { text: "a" });
      const snap = store.getState().getDocument();
      snap.blocks[id]!.data.text = "HACKED";
      snap.rootBlockIds.push("ghost");
      expect(store.getState().document.blocks[id]?.data.text).toBe("a");
      expect(store.getState().document.rootBlockIds).toEqual([id]);
    });

    it("setDocument does not retain a reference to the input", () => {
      const next: DocumentModel = {
        rootBlockIds: ["x"],
        blocks: { x: { id: "x", type: "paragraph", data: {} } },
      };
      store.getState().setDocument(next);
      next.rootBlockIds.push("injected");
      expect(store.getState().document.rootBlockIds).toEqual(["x"]);
    });
  });
});
