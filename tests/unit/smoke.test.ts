import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs in happy-dom environment", () => {
    expect(typeof document).toBe("object");
    expect(document.createElement("div")).toBeInstanceOf(HTMLElement);
  });
});
