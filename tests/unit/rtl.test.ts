import { describe, it, expect } from "vitest";
import { resolveDirection } from "../../src/rtl.js";

describe("resolveDirection", () => {
  describe("no content: locale fallback", () => {
    it("ar → rtl", () => {
      expect(resolveDirection("ar")).toBe("rtl");
    });

    it("en → ltr", () => {
      expect(resolveDirection("en")).toBe("ltr");
    });

    it("empty string falls back to locale", () => {
      expect(resolveDirection("ar", "")).toBe("rtl");
      expect(resolveDirection("en", "")).toBe("ltr");
    });
  });

  describe("pure content (matches locale)", () => {
    it("pure Arabic with ar → rtl", () => {
      expect(resolveDirection("ar", "مرحبا بالعالم")).toBe("rtl");
    });

    it("pure English with en → ltr", () => {
      expect(resolveDirection("en", "Hello world")).toBe("ltr");
    });
  });

  describe("content overrides locale (the core fix)", () => {
    it("starts with Latin letter despite ar locale → ltr", () => {
      expect(resolveDirection("ar", "API هذا وصف")).toBe("ltr");
    });

    it("starts with Arabic letter despite en locale → rtl", () => {
      expect(resolveDirection("en", "مرحبا API")).toBe("rtl");
    });

    it("leading punctuation is skipped (first strong char wins)", () => {
      expect(resolveDirection("ar", "\"Hello\" مرحبا")).toBe("ltr");
      expect(resolveDirection("en", "«مرحبا» Hello")).toBe("rtl");
    });

    it("leading digits are skipped (they are neutral)", () => {
      expect(resolveDirection("ar", "123 مرحبا")).toBe("rtl");
      expect(resolveDirection("ar", "123 Hello")).toBe("ltr");
    });

    it("leading whitespace is skipped", () => {
      expect(resolveDirection("ar", "   Hello")).toBe("ltr");
      expect(resolveDirection("en", "   مرحبا")).toBe("rtl");
    });

    it("leading emoji is skipped (not a letter)", () => {
      expect(resolveDirection("ar", "🎉 مرحبا")).toBe("rtl");
      expect(resolveDirection("ar", "🎉 Hello")).toBe("ltr");
    });
  });

  describe("no strong character: locale fallback", () => {
    it("digits only → ar yields rtl, en yields ltr", () => {
      expect(resolveDirection("ar", "12345")).toBe("rtl");
      expect(resolveDirection("en", "12345")).toBe("ltr");
    });

    it("punctuation only → locale fallback", () => {
      expect(resolveDirection("ar", "!!! ... ???")).toBe("rtl");
      expect(resolveDirection("en", "!!! ... ???")).toBe("ltr");
    });

    it("whitespace only → locale fallback", () => {
      expect(resolveDirection("ar", "   \t\n")).toBe("rtl");
      expect(resolveDirection("en", "   \t\n")).toBe("ltr");
    });

    it("digits and punctuation only → locale fallback", () => {
      expect(resolveDirection("ar", "123 --- 456")).toBe("rtl");
      expect(resolveDirection("en", "123 --- 456")).toBe("ltr");
    });
  });

  describe("RTL scripts beyond Arabic", () => {
    it("Hebrew is RTL", () => {
      expect(resolveDirection("en", "שלום")).toBe("rtl");
    });

    it("Persian is RTL", () => {
      expect(resolveDirection("en", "سلام")).toBe("rtl");
    });

    it("Syriac is RTL", () => {
      expect(resolveDirection("en", "ܫܠܡܐ")).toBe("rtl");
    });
  });

  describe("LTR scripts beyond Latin", () => {
    it("Cyrillic is LTR", () => {
      expect(resolveDirection("ar", "Привет")).toBe("ltr");
    });

    it("CJK is LTR", () => {
      expect(resolveDirection("ar", "你好")).toBe("ltr");
    });

    it("Greek is LTR", () => {
      expect(resolveDirection("ar", "Γειά")).toBe("ltr");
    });
  });

  describe("purity", () => {
    it("same input yields same output across calls", () => {
      const a = resolveDirection("ar", "API مرحبا");
      const b = resolveDirection("ar", "API مرحبا");
      expect(a).toBe(b);
    });

    it("does not mutate anything (trivially true, but locked in)", () => {
      const input = "مرحبا Hello";
      const copy = input.slice();
      resolveDirection("ar", input);
      expect(input).toBe(copy);
    });
  });
});
