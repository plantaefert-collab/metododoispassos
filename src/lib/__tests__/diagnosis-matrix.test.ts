import { describe, it, expect } from "bun:test";
import {
  computeDiagnosisResult,
  totalObservations,
  type DiagnosisAnswers,
  type DiagnosisCategory,
} from "../diagnosis-matrix";

const EMPTY: DiagnosisAnswers = {
  roots: [],
  leaves: [],
  environment: [],
  potAndSubstrate: [],
  wateringAndRoutine: [],
};

function withAnswers(patch: Partial<Record<DiagnosisCategory, string[]>>): DiagnosisAnswers {
  return { ...EMPTY, ...patch };
}

describe("totalObservations", () => {
  it("returns 0 for empty answers", () => {
    expect(totalObservations(EMPTY)).toBe(0);
  });

  it("sums answers across categories", () => {
    const a = withAnswers({ roots: ["a", "b"], leaves: ["c"] });
    expect(totalObservations(a)).toBe(3);
  });
});

describe("computeDiagnosisResult", () => {
  it("returns only insufficient-info guidance when no observations exist", () => {
    const r = computeDiagnosisResult(EMPTY, 1, "2026-01-01T00:00:00.000Z");
    expect(r.favorable).toHaveLength(0);
    expect(r.adjustments).toHaveLength(0);
    expect(r.priorities).toHaveLength(0);
    expect(r.insufficientInformation.length).toBeGreaterThan(0);
    expect(r.trackingPoints).toEqual([]);
    expect(r.completedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(r.answersVersion).toBe(1);
  });

  it("classifies a favorable answer correctly", () => {
    const r = computeDiagnosisResult(
      withAnswers({ roots: ["Firmes, verdes ou prateadas"] }),
      2,
    );
    expect(r.favorable).toHaveLength(1);
    expect(r.favorable[0]?.classification).toBe("favorable");
    expect(r.adjustments).toHaveLength(0);
    expect(r.priorities).toHaveLength(0);
    expect(r.insufficientInformation).toHaveLength(0);
  });

  it("classifies adjustment and priority answers into separate buckets", () => {
    const r = computeDiagnosisResult(
      withAnswers({ roots: ["Poucas raízes visíveis", "Raízes moles"] }),
      3,
    );
    expect(r.adjustments.map((g) => g.answer)).toContain("Poucas raízes visíveis");
    expect(r.priorities.map((g) => g.answer)).toContain("Raízes moles");
  });

  it("orders priorities according to the internal PRIORITY_ORDER list", () => {
    // "Mau cheiro..." comes before "Raízes moles" in PRIORITY_ORDER.
    const r = computeDiagnosisResult(
      withAnswers({
        roots: ["Raízes moles", "Mau cheiro próximo às raízes ou ao substrato"],
      }),
      1,
    );
    expect(r.priorities[0]?.answer).toBe("Mau cheiro próximo às raízes ou ao substrato");
    expect(r.priorities[1]?.answer).toBe("Raízes moles");
  });

  it("dedupes tracking points and caps them at 5", () => {
    const r = computeDiagnosisResult(
      withAnswers({
        roots: [
          "Raízes moles",
          "Mau cheiro próximo às raízes ou ao substrato",
          "Poucas raízes visíveis",
          "Raízes secas ou ocas",
          "Raízes escuras",
        ],
      }),
      1,
    );
    expect(r.trackingPoints.length).toBeLessThanOrEqual(5);
    expect(new Set(r.trackingPoints).size).toBe(r.trackingPoints.length);
  });

  it("ignores unknown/inconsistent answer strings without throwing", () => {
    const r = computeDiagnosisResult(
      withAnswers({
        roots: ["Firmes, verdes ou prateadas", "resposta inexistente xyz"],
      }),
      1,
    );
    expect(r.favorable).toHaveLength(1);
    expect(r.adjustments).toHaveLength(0);
    expect(r.priorities).toHaveLength(0);
  });

  it("defaults completedAt to a valid ISO timestamp when omitted", () => {
    const r = computeDiagnosisResult(EMPTY, 0);
    expect(typeof r.completedAt).toBe("string");
    expect(Number.isNaN(Date.parse(r.completedAt as string))).toBe(false);
  });

  it("propagates the given answersVersion", () => {
    const r = computeDiagnosisResult(EMPTY, 42);
    expect(r.answersVersion).toBe(42);
  });
});