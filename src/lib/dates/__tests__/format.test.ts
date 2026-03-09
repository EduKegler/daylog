import { describe, it, expect } from "vitest";
import { formatLongDate, formatShortDate } from "../format";

describe("formatLongDate", () => {
  it("formata data em pt-BR com dia da semana", () => {
    // 2026-03-09 = segunda-feira
    const date = new Date(Date.UTC(2026, 2, 9));
    const result = formatLongDate(date);
    expect(result).toContain("segunda");
    expect(result).toContain("9");
    expect(result).toContain("março");
  });

  it("formata outra data corretamente", () => {
    // 2026-01-01 = quinta-feira
    const date = new Date(Date.UTC(2026, 0, 1));
    const result = formatLongDate(date);
    expect(result).toContain("quinta");
    expect(result).toContain("1");
    expect(result).toContain("janeiro");
  });
});

describe("formatShortDate", () => {
  it("formata Date object como dd/mm", () => {
    const date = new Date(Date.UTC(2026, 2, 9));
    expect(formatShortDate(date)).toBe("09/03");
  });

  it("formata ISO string como dd/mm", () => {
    expect(formatShortDate("2026-03-09T00:00:00.000Z")).toBe("09/03");
  });

  it("formata data com dia/mês de um dígito com zero à esquerda", () => {
    const date = new Date(Date.UTC(2026, 0, 5));
    expect(formatShortDate(date)).toBe("05/01");
  });
});
