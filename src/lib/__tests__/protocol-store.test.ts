import { describe, it, expect } from "bun:test";
import { computeFocusDay, isDayFullyDone, defaultState, type ProtocolState, type DayEntry } from "../protocol-store";

function makeState(days: Record<number, Partial<DayEntry>>): ProtocolState {
  const built: Record<number, DayEntry> = {};
  for (const [k, v] of Object.entries(days)) {
    built[Number(k)] = {
      checklist: {},
      note: "",
      completed: false,
      ...v,
    };
  }
  return { ...defaultState, days: built };
}

const checklists: Record<number, string[]> = {
  1: ["a", "b"],
  2: ["x"],
  3: [],
};
const getChecklist = (d: number) => checklists[d];

describe("isDayFullyDone", () => {
  it("returns false when day entry is missing", () => {
    expect(isDayFullyDone(makeState({}), 1, checklists[1])).toBe(false);
  });

  it("returns false when checklist has unchecked items", () => {
    const s = makeState({ 1: { checklist: { a: true, b: false } } });
    expect(isDayFullyDone(s, 1, checklists[1])).toBe(false);
  });

  it("returns true when every checklist label is checked", () => {
    const s = makeState({ 1: { checklist: { a: true, b: true } } });
    expect(isDayFullyDone(s, 1, checklists[1])).toBe(true);
  });

  it("falls back to entry.completed when checklist is empty/undefined", () => {
    const s = makeState({ 3: { completed: true } });
    expect(isDayFullyDone(s, 3, [])).toBe(true);
    expect(isDayFullyDone(s, 3, undefined)).toBe(true);
    const s2 = makeState({ 3: { completed: false } });
    expect(isDayFullyDone(s2, 3, undefined)).toBe(false);
  });

  it("ignores extra checklist keys not in the labels list", () => {
    const s = makeState({ 1: { checklist: { a: true, b: true, extra: false } } });
    expect(isDayFullyDone(s, 1, checklists[1])).toBe(true);
  });
});

describe("computeFocusDay", () => {
  it("returns 1 when nothing is done", () => {
    expect(computeFocusDay(makeState({}), getChecklist)).toBe(1);
  });

  it("advances to the first incomplete day", () => {
    const s = makeState({
      1: { checklist: { a: true, b: true } },
    });
    expect(computeFocusDay(s, getChecklist)).toBe(2);
  });

  it("skips over consecutive completed days", () => {
    const s = makeState({
      1: { checklist: { a: true, b: true } },
      2: { checklist: { x: true } },
      3: { completed: true },
    });
    expect(computeFocusDay(s, getChecklist)).toBe(4);
  });

  it("returns earliest gap even when later days are complete", () => {
    const s = makeState({
      1: { checklist: { a: true, b: true } },
      2: { checklist: { x: false } },
      3: { completed: true },
    });
    expect(computeFocusDay(s, getChecklist)).toBe(2);
  });

  it("returns 21 when all 21 days are completed", () => {
    const days: Record<number, Partial<DayEntry>> = {};
    for (let d = 1; d <= 21; d++) days[d] = { completed: true };
    const s = makeState(days);
    expect(computeFocusDay(s, () => undefined)).toBe(21);
  });

  it("treats missing checklist getter result as fallback to completed flag", () => {
    const s = makeState({ 1: { completed: true }, 2: { completed: false } });
    expect(computeFocusDay(s, () => undefined)).toBe(2);
  });
});