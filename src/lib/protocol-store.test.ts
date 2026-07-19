import { describe, it, expect } from "bun:test";
import { migrateProtocolState } from "./protocol-store";

describe("migrateProtocolState", () => {
  it("returns default state for non-object input", () => {
    const s = migrateProtocolState(null);
    expect(s.schemaVersion).toBe(2);
    expect(s.diagnosis.roots).toEqual([]);
    expect(s.applications).toEqual([]);
  });

  it("returns default state for garbage input", () => {
    expect(migrateProtocolState("garbage").schemaVersion).toBe(2);
    expect(migrateProtocolState(42).plant.name).toBe("");
  });

  it("migrates v1 diagnosis.routine → wateringAndRoutine", () => {
    const v1 = {
      currentDay: 5,
      plant: { name: "Bianca", location: "Varanda" },
      diagnosis: {
        roots: ["Firmes, verdes ou prateadas"],
        leaves: [],
        environment: ["Boa claridade indireta"],
        routine: ["Rega por calendário fixo"],
      },
      days: { 3: { applicationDone: true, checklist: {}, note: "" } },
      onboarded: true,
    };
    const s = migrateProtocolState(v1);
    expect(s.schemaVersion).toBe(2);
    expect(s.plant.name).toBe("Bianca");
    expect(s.diagnosis.roots).toEqual(["Firmes, verdes ou prateadas"]);
    expect(s.diagnosis.wateringAndRoutine).toEqual(["Rega por calendário fixo"]);
    expect(s.diagnosis.potAndSubstrate).toEqual([]);
    expect(s.onboarded).toBe(true);
    // v1 tinha applicationDone → sintetiza registro em applications
    expect(s.applications.length).toBe(1);
    expect(s.applications[0].day).toBe(3);
  });

  it("passes through v2 state preserving user data", () => {
    const v2 = {
      schemaVersion: 2,
      currentDay: 10,
      plant: {
        name: "Roxa",
        species: "",
        unknownSpecies: true,
        location: "Janela",
        pot: "Plástico",
        substrate: "Casca",
        difficulty: "",
        photo: null,
      },
      diagnosis: {
        roots: ["Firmes, verdes ou prateadas"],
        leaves: [],
        environment: [],
        potAndSubstrate: ["Vaso com boa drenagem"],
        wateringAndRoutine: [],
      },
      diagnosisResult: null,
      diagnosisStatus: "none",
      answersVersion: 3,
      days: {},
      applications: [
        { id: "a1", day: 3, timestamp: "2026-01-01T00:00:00.000Z" },
      ],
      finalEval: { improved: "", same: "", attention: "", keep: "", path: "" },
      onboarded: true,
    };
    const s = migrateProtocolState(v2);
    expect(s.currentDay).toBe(10);
    expect(s.plant.unknownSpecies).toBe(true);
    expect(s.answersVersion).toBe(3);
    expect(s.applications[0].id).toBe("a1");
    expect(s.diagnosis.potAndSubstrate).toEqual(["Vaso com boa drenagem"]);
  });

  it("normalizes missing/corrupt fields without throwing", () => {
    const partial = {
      schemaVersion: 2,
      plant: "not-an-object",
      diagnosis: { roots: ["ok", 42, null], leaves: "bad" },
      days: { abc: {}, 5: { checklist: { a: 1 }, completed: "yes" } },
      finalEval: { path: "invalid" },
      applications: [{ day: "nope" }, { id: "x", day: 7, timestamp: "t" }],
    };
    const s = migrateProtocolState(partial);
    expect(s.plant.name).toBe("");
    expect(s.diagnosis.roots).toEqual(["ok"]);
    expect(s.diagnosis.leaves).toEqual([]);
    expect(s.days[5].checklist.a).toBe(true);
    expect(s.days[5].completed).toBe(false);
    expect(s.finalEval.path).toBe("");
    expect(s.applications.length).toBe(1);
    expect(s.applications[0].day).toBe(7);
  });

  it("drops invalid diagnosisStatus values", () => {
    const s = migrateProtocolState({ schemaVersion: 2, diagnosisStatus: "bogus" });
    expect(s.diagnosisStatus).toBe("none");
  });
});