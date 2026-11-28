import { describe, it, expect, beforeEach } from "vitest";
import {
  createBlockRegistry,
  registerBlock,
  getBlockDefinition,
  getAllBlockDefinitions,
  hasBlockDefinition,
  _resetBlockRegistry,
  type BlockRegistry,
} from "../../src/registry.js";
import type { BlockDefinition } from "../../src/types.js";

function makeDef(overrides: Partial<BlockDefinition> = {}): BlockDefinition {
  return {
    type: "custom",
    label: { ar: "مخصص" },
    defaultData: () => ({}),
    render: () => document.createElement("div"),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────
// Factory tests (isolated)
// ─────────────────────────────────────────────────────────────

describe("createBlockRegistry (factory)", () => {
  let registry: BlockRegistry;

  beforeEach(() => {
    registry = createBlockRegistry();
  });

  describe("register", () => {
    it("accepts a valid definition", () => {
      const def = makeDef({ type: "quote", label: { ar: "اقتباس" } });
      registry.register(def);
      expect(registry.has("quote")).toBe(true);
      expect(registry.get("quote")).toBe(def);
    });

    it("accepts an open-string type (custom blocks)", () => {
      const def = makeDef({ type: "contract-clause", label: { ar: "بند عقد" } });
      registry.register(def);
      expect(registry.get("contract-clause")?.label.ar).toBe("بند عقد");
    });

    it("accepts an optional English label (FR-14)", () => {
      registry.register(makeDef({ label: { ar: "اقتباس", en: "Quote" } }));
      expect(registry.get("custom")?.label.en).toBe("Quote");
    });

    it("preserves registration order", () => {
      registry.register(makeDef({ type: "a" }));
      registry.register(makeDef({ type: "b" }));
      registry.register(makeDef({ type: "c" }));
      expect(registry.getAll().map((d) => d.type)).toEqual(["a", "b", "c"]);
    });

    describe("validation", () => {
      it("rejects null", () => {
        expect(() => registry.register(null as unknown as BlockDefinition)).toThrow(
          /definition must be an object/,
        );
      });

      it("rejects a non-object (string)", () => {
        expect(() =>
          registry.register("paragraph" as unknown as BlockDefinition),
        ).toThrow(/definition must be an object/);
      });

      it("rejects missing type", () => {
        expect(() =>
          registry.register(makeDef({ type: "" })),
        ).toThrow(/'type' must be a non-empty string/);
      });

      it("rejects whitespace-only type", () => {
        expect(() =>
          registry.register(makeDef({ type: "   " })),
        ).toThrow(/'type' must be a non-empty string/);
      });

      it("rejects missing label", () => {
        expect(() =>
          registry.register(
            makeDef({ label: undefined as unknown as { ar: string } }),
          ),
        ).toThrow(/'label' must be an object/);
      });

      it("rejects missing label.ar", () => {
        expect(() =>
          registry.register(
            makeDef({ label: { ar: "" } }),
          ),
        ).toThrow(/'label\.ar' must be a non-empty string/);
      });

      it("rejects empty label.en when provided", () => {
        expect(() =>
          registry.register(makeDef({ label: { ar: "س", en: "" } })),
        ).toThrow(/'label\.en' must be a non-empty string/);
      });

      it("rejects missing defaultData", () => {
        expect(() =>
          registry.register(
            makeDef({ defaultData: undefined as unknown as () => Record<string, unknown> }),
          ),
        ).toThrow(/'defaultData' must be a function/);
      });

      it("rejects missing render", () => {
        expect(() =>
          registry.register(
            makeDef({ render: undefined as unknown as () => HTMLElement }),
          ),
        ).toThrow(/'render' must be a function/);
      });

      it("rejects duplicate type", () => {
        registry.register(makeDef({ type: "quote" }));
        expect(() => registry.register(makeDef({ type: "quote" }))).toThrow(
          /already registered/,
        );
      });

      it("does not mutate state on validation failure", () => {
        expect(() => registry.register(makeDef({ type: "" }))).toThrow();
        expect(registry.getAll()).toEqual([]);
      });
    });
  });

  describe("get / has", () => {
    it("returns undefined for unknown type", () => {
      expect(registry.get("missing")).toBeUndefined();
      expect(registry.has("missing")).toBe(false);
    });
  });

  describe("getAll", () => {
    it("returns a fresh array each call", () => {
      registry.register(makeDef({ type: "a" }));
      const one = registry.getAll();
      const two = registry.getAll();
      expect(one).not.toBe(two);
      expect(one).toEqual(two);
    });

    it("mutation of returned array does not affect registry", () => {
      registry.register(makeDef({ type: "a" }));
      registry.getAll().push(makeDef({ type: "injected" }));
      expect(registry.has("injected")).toBe(false);
    });
  });

  describe("clear", () => {
    it("removes all definitions", () => {
      registry.register(makeDef({ type: "a" }));
      registry.register(makeDef({ type: "b" }));
      registry.clear();
      expect(registry.getAll()).toEqual([]);
      expect(registry.has("a")).toBe(false);
    });
  });

  describe("isolation", () => {
    it("two factories do not share state", () => {
      const r1 = createBlockRegistry();
      const r2 = createBlockRegistry();
      r1.register(makeDef({ type: "only-in-r1" }));
      expect(r1.has("only-in-r1")).toBe(true);
      expect(r2.has("only-in-r1")).toBe(false);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Global singleton tests
// ─────────────────────────────────────────────────────────────

describe("global registry (registerBlock / getBlockDefinition / …)", () => {
  beforeEach(() => {
    _resetBlockRegistry();
  });

  it("registerBlock writes to the singleton", () => {
    registerBlock(makeDef({ type: "para", label: { ar: "فقرة" } }));
    expect(hasBlockDefinition("para")).toBe(true);
    expect(getBlockDefinition("para")?.label.ar).toBe("فقرة");
  });

  it("getAllBlockDefinitions reflects registrations", () => {
    registerBlock(makeDef({ type: "a" }));
    registerBlock(makeDef({ type: "b" }));
    expect(getAllBlockDefinitions().map((d) => d.type)).toEqual(["a", "b"]);
  });

  it("registerBlock rejects duplicates in the singleton", () => {
    registerBlock(makeDef({ type: "dup" }));
    expect(() => registerBlock(makeDef({ type: "dup" }))).toThrow(
      /already registered/,
    );
  });

  it("_resetBlockRegistry clears the singleton", () => {
    registerBlock(makeDef({ type: "x" }));
    _resetBlockRegistry();
    expect(hasBlockDefinition("x")).toBe(false);
  });
});
