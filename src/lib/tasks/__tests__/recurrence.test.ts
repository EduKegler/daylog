import { describe, it, expect } from "vitest";
import {
  parseRecurrenceConfig,
  shouldTaskOccurOnDate,
  getRecurrenceLabel,
} from "../recurrence";

// Helper: cria Date UTC para um dia da semana específico
function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

describe("parseRecurrenceConfig", () => {
  it("retorna null para DAILY", () => {
    expect(parseRecurrenceConfig("DAILY", null)).toBeNull();
  });

  it("retorna null para WEEKDAYS", () => {
    expect(parseRecurrenceConfig("WEEKDAYS", null)).toBeNull();
  });

  it("ignora config string para DAILY", () => {
    expect(parseRecurrenceConfig("DAILY", '{"foo":1}')).toBeNull();
  });

  it("parseia SPECIFIC_WEEKDAYS corretamente", () => {
    const result = parseRecurrenceConfig(
      "SPECIFIC_WEEKDAYS",
      JSON.stringify({ days: [1, 3, 5] }),
    );
    expect(result).toEqual({ days: [1, 3, 5] });
  });

  it("parseia MONTHLY corretamente", () => {
    const result = parseRecurrenceConfig(
      "MONTHLY",
      JSON.stringify({ dayOfMonth: 15 }),
    );
    expect(result).toEqual({ dayOfMonth: 15 });
  });

  it("lança erro se config null para SPECIFIC_WEEKDAYS", () => {
    expect(() => parseRecurrenceConfig("SPECIFIC_WEEKDAYS", null)).toThrow(
      "obrigatório",
    );
  });

  it("lança erro se config null para MONTHLY", () => {
    expect(() => parseRecurrenceConfig("MONTHLY", null)).toThrow("obrigatório");
  });

  it("lança erro para JSON malformado", () => {
    expect(() =>
      parseRecurrenceConfig("SPECIFIC_WEEKDAYS", "not-json"),
    ).toThrow("JSON inválido");
  });

  it("lança erro se days não é array", () => {
    expect(() =>
      parseRecurrenceConfig("SPECIFIC_WEEKDAYS", JSON.stringify({ days: "1,3" })),
    ).toThrow("SPECIFIC_WEEKDAYS requer");
  });

  it("lança erro se days está vazio", () => {
    expect(() =>
      parseRecurrenceConfig("SPECIFIC_WEEKDAYS", JSON.stringify({ days: [] })),
    ).toThrow("ao menos um dia");
  });

  it("lança erro para dia fora do range 0-6", () => {
    expect(() =>
      parseRecurrenceConfig("SPECIFIC_WEEKDAYS", JSON.stringify({ days: [7] })),
    ).toThrow("Dia inválido: 7");
  });

  it("lança erro para dia negativo", () => {
    expect(() =>
      parseRecurrenceConfig("SPECIFIC_WEEKDAYS", JSON.stringify({ days: [-1] })),
    ).toThrow("Dia inválido: -1");
  });

  it("lança erro se dayOfMonth não é número", () => {
    expect(() =>
      parseRecurrenceConfig("MONTHLY", JSON.stringify({ dayOfMonth: "15" })),
    ).toThrow("MONTHLY requer");
  });

  it("lança erro para dayOfMonth 0", () => {
    expect(() =>
      parseRecurrenceConfig("MONTHLY", JSON.stringify({ dayOfMonth: 0 })),
    ).toThrow("dayOfMonth inválido");
  });

  it("lança erro para dayOfMonth 32", () => {
    expect(() =>
      parseRecurrenceConfig("MONTHLY", JSON.stringify({ dayOfMonth: 32 })),
    ).toThrow("dayOfMonth inválido");
  });

  it("lança erro para tipo desconhecido", () => {
    expect(() =>
      parseRecurrenceConfig("UNKNOWN" as never, "{}"),
    ).toThrow("Tipo de recorrência desconhecido");
  });
});

describe("shouldTaskOccurOnDate", () => {
  describe("DAILY", () => {
    it("retorna true para qualquer dia", () => {
      expect(shouldTaskOccurOnDate("DAILY", null, utcDate(2026, 3, 9))).toBe(true); // Seg
      expect(shouldTaskOccurOnDate("DAILY", null, utcDate(2026, 3, 14))).toBe(true); // Sáb
      expect(shouldTaskOccurOnDate("DAILY", null, utcDate(2026, 3, 15))).toBe(true); // Dom
    });
  });

  describe("WEEKDAYS", () => {
    it("retorna true para segunda a sexta", () => {
      // 2026-03-09 = Segunda
      expect(shouldTaskOccurOnDate("WEEKDAYS", null, utcDate(2026, 3, 9))).toBe(true);
      // 2026-03-10 = Terça
      expect(shouldTaskOccurOnDate("WEEKDAYS", null, utcDate(2026, 3, 10))).toBe(true);
      // 2026-03-13 = Sexta
      expect(shouldTaskOccurOnDate("WEEKDAYS", null, utcDate(2026, 3, 13))).toBe(true);
    });

    it("retorna false para sábado e domingo", () => {
      // 2026-03-14 = Sábado
      expect(shouldTaskOccurOnDate("WEEKDAYS", null, utcDate(2026, 3, 14))).toBe(false);
      // 2026-03-15 = Domingo
      expect(shouldTaskOccurOnDate("WEEKDAYS", null, utcDate(2026, 3, 15))).toBe(false);
    });
  });

  describe("SPECIFIC_WEEKDAYS", () => {
    const config = { days: [1, 3, 5] }; // Seg, Qua, Sex

    it("retorna true para dias incluídos", () => {
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 9))).toBe(true);  // Seg
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 11))).toBe(true); // Qua
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 13))).toBe(true); // Sex
    });

    it("retorna false para dias não incluídos", () => {
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 10))).toBe(false); // Ter
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 12))).toBe(false); // Qui
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 14))).toBe(false); // Sáb
      expect(shouldTaskOccurOnDate("SPECIFIC_WEEKDAYS", config, utcDate(2026, 3, 15))).toBe(false); // Dom
    });
  });

  describe("MONTHLY", () => {
    it("retorna true no dia correto", () => {
      expect(shouldTaskOccurOnDate("MONTHLY", { dayOfMonth: 15 }, utcDate(2026, 3, 15))).toBe(true);
    });

    it("retorna false em outro dia", () => {
      expect(shouldTaskOccurOnDate("MONTHLY", { dayOfMonth: 15 }, utcDate(2026, 3, 14))).toBe(false);
    });

    it("retorna false para dia 31 em mês com 30 dias", () => {
      // Abril tem 30 dias
      expect(shouldTaskOccurOnDate("MONTHLY", { dayOfMonth: 31 }, utcDate(2026, 4, 30))).toBe(false);
    });

    it("retorna true para dia 29 em fevereiro de ano bissexto", () => {
      // 2028 é ano bissexto
      expect(shouldTaskOccurOnDate("MONTHLY", { dayOfMonth: 29 }, utcDate(2028, 2, 29))).toBe(true);
    });

    it("retorna false para dia 29 em fevereiro de ano não-bissexto", () => {
      // 2026 não é ano bissexto - fev tem 28 dias
      expect(shouldTaskOccurOnDate("MONTHLY", { dayOfMonth: 29 }, utcDate(2026, 2, 28))).toBe(false);
    });

    it("retorna true para dia 1", () => {
      expect(shouldTaskOccurOnDate("MONTHLY", { dayOfMonth: 1 }, utcDate(2026, 6, 1))).toBe(true);
    });
  });

  describe("tipo desconhecido", () => {
    it("retorna false", () => {
      expect(shouldTaskOccurOnDate("UNKNOWN" as never, null, utcDate(2026, 3, 9))).toBe(false);
    });
  });
});

describe("getRecurrenceLabel", () => {
  it("retorna label para DAILY", () => {
    expect(getRecurrenceLabel("DAILY", null)).toBe("Todos os dias");
  });

  it("retorna label para WEEKDAYS", () => {
    expect(getRecurrenceLabel("WEEKDAYS", null)).toBe("Dias úteis");
  });

  it("retorna label para SPECIFIC_WEEKDAYS", () => {
    expect(getRecurrenceLabel("SPECIFIC_WEEKDAYS", { days: [1, 3, 5] })).toBe(
      "Seg, Qua, Sex",
    );
  });

  it("ordena os dias no label", () => {
    expect(getRecurrenceLabel("SPECIFIC_WEEKDAYS", { days: [5, 1, 3] })).toBe(
      "Seg, Qua, Sex",
    );
  });

  it("retorna label para MONTHLY", () => {
    expect(getRecurrenceLabel("MONTHLY", { dayOfMonth: 10 })).toBe(
      "Dia 10 de cada mês",
    );
  });

  it("retorna tipo como fallback para tipo desconhecido", () => {
    expect(getRecurrenceLabel("UNKNOWN" as never, null)).toBe("UNKNOWN");
  });
});
