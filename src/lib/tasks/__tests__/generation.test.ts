import { describe, it, expect } from "vitest";
import { getUserLocalDate } from "../generation";

describe("getUserLocalDate", () => {
  it("returns a UTC Date representing the local date", () => {
    const date = getUserLocalDate("America/Sao_Paulo");
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
  });
});
