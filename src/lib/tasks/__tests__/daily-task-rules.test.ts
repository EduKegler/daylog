import { describe, it, expect } from "vitest";
import { canEditDailyTask } from "../daily-task-rules";

describe("canEditDailyTask", () => {
  it("allows editing a pending manual task", () => {
    expect(
      canEditDailyTask({ status: "PENDING", sourceType: "MANUAL" }),
    ).toBe(true);
  });

  it("allows editing a pending recurring task instance", () => {
    expect(
      canEditDailyTask({ status: "PENDING", sourceType: "RECURRING" }),
    ).toBe(true);
  });

  it("disallows editing a completed manual task", () => {
    expect(
      canEditDailyTask({ status: "COMPLETED", sourceType: "MANUAL" }),
    ).toBe(false);
  });

  it("disallows editing a completed recurring task instance", () => {
    expect(
      canEditDailyTask({ status: "COMPLETED", sourceType: "RECURRING" }),
    ).toBe(false);
  });

  it("disallows editing a skipped task", () => {
    expect(
      canEditDailyTask({ status: "SKIPPED", sourceType: "MANUAL" }),
    ).toBe(false);
  });
});
