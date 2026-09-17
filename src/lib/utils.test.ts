import { describe, expect, it } from "vitest";
import { formatMinorUsd, safeNextPath } from "./utils";

describe("formatMinorUsd", () => {
  it("formats cents as dollars with grouping", () => {
    expect(formatMinorUsd(0)).toBe("$0.00");
    expect(formatMinorUsd(5)).toBe("$0.05");
    expect(formatMinorUsd(8496)).toBe("$84.96");
    expect(formatMinorUsd(169728)).toBe("$1,697.28");
    expect(formatMinorUsd(123456789n)).toBe("$1,234,567.89");
  });

  it("handles negatives", () => {
    expect(formatMinorUsd(-250)).toBe("-$2.50");
  });
});

describe("safeNextPath", () => {
  it("accepts relative paths", () => {
    expect(safeNextPath("/wholesale/account", "/x")).toBe("/wholesale/account");
  });

  it("rejects external and protocol-relative targets", () => {
    expect(safeNextPath("https://evil.test", "/x")).toBe("/x");
    expect(safeNextPath("//evil.test", "/x")).toBe("/x");
    expect(safeNextPath("/\\evil.test", "/x")).toBe("/x");
    expect(safeNextPath(null, "/x")).toBe("/x");
  });
});
