import { describe, it, expect } from "bun:test";
import { getProtocolDay, getProtocolPhase } from "../protocol-plan";
import { EDITORIAL_PLAN } from "../editorial-plan";

describe("Protocol UI Data Consistency", () => {
  it("should have consistent phases and main actions for all 21 days", () => {
    for (let day = 1; day <= 21; day++) {
      const dayData = getProtocolDay(day);
      const phaseData = getProtocolPhase(day);
      const editorial = EDITORIAL_PLAN[day];

      // Verify day numbering
      expect(dayData.day).toBe(day);

      // Verify phase mapping
      if (day <= 7) expect(phaseData.range).toContain("1 a 7");
      else if (day <= 14) expect(phaseData.range).toContain("8 a 14");
      else expect(phaseData.range).toContain("15 a 21");

      // Verify main action exists and is a string
      expect(typeof dayData.mainAction).toBe("string");
      expect(dayData.mainAction.length).toBeGreaterThan(0);

      // Verify editorial title matches protocol day title
      expect(dayData.title).toBe(editorial.title);
    }
  });

  it("should identify critical application days correctly", () => {
    // Days defined as isApplicationDay: true in editorial-plan.ts
    const criticalDays = [1, 7, 14, 21];
    for (const day of criticalDays) {
      const dayData = getProtocolDay(day);
      expect(dayData.isApplicationDay).toBe(true);
    }
  });

  it("should transition main actions correctly between days", () => {
    const day1 = getProtocolDay(1);
    const day2 = getProtocolDay(2);
    const day3 = getProtocolDay(3);

    // Day 1 and 2 are usually observations, Day 3 is application
    expect(day1.mainAction).not.toBe(day3.mainAction);
    expect(day2.mainAction).not.toBe(day3.mainAction);
  });
});
