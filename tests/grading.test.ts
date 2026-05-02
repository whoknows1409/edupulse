import { describe, expect, it } from "vitest";
import { computeGrade, computeGpa } from "@/lib/grading";

describe("grading utilities", () => {
  it("computes grade band and percent", () => {
    const result = computeGrade(85, 100);
    expect(result.percent).toBe(85);
    expect(result.gradePoint).toBeGreaterThan(0);
  });

  it("computes weighted GPA", () => {
    const gpa = computeGpa([
      { gradePoint: 4.0, credits: 3 },
      { gradePoint: 3.0, credits: 3 },
    ]);
    expect(gpa).toBeCloseTo(3.5, 1);
  });
});
