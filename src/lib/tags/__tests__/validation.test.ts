import { describe, it, expect } from "vitest";
import { validateTagInput } from "../validation";

describe("validateTagInput", () => {
  it("accepts valid input", () => {
    const result = validateTagInput({ name: "corpo", color: "rose" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("corpo");
      expect(result.data.color).toBe("rose");
    }
  });

  it("trims and lowercases name", () => {
    const result = validateTagInput({ name: "  Corpo  ", color: "rose" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("corpo");
    }
  });

  it("rejects empty name", () => {
    const result = validateTagInput({ name: "", color: "rose" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBeDefined();
    }
  });

  it("rejects name over 30 chars", () => {
    const result = validateTagInput({ name: "a".repeat(31), color: "rose" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBeDefined();
    }
  });

  it("rejects invalid color key", () => {
    const result = validateTagInput({ name: "corpo", color: "red" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.color).toBeDefined();
    }
  });

  it("rejects whitespace-only name", () => {
    const result = validateTagInput({ name: "   ", color: "rose" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.name).toBeDefined();
    }
  });
});
