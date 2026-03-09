import { describe, it, expect } from "vitest";
import { getUserLocalDate } from "../generation";

describe("getUserLocalDate", () => {
  it("retorna uma Date UTC representando a data local", () => {
    const date = getUserLocalDate("America/Sao_Paulo");
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
  });
});
