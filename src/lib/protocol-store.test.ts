import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  migrateProtocolState,
  migrateLegacyDiagnosis,
  uniqueStrings,
  normalizeCurrentDay,
  persistState,
  setState,
  getState,
  subscribe,
  clearSaveError,
  __resetStoreForTests,
  SAVE_ERROR_MESSAGE,
  type ProtocolState,
} from "./protocol-store";

// -------- localStorage mock --------

type Mode = "ok" | "quota" | "unavailable";
class LocalStorageMock {
  store = new Map<string, string>();
  setMode: Mode = "ok";
  removeCalls = 0;
  setItem(k: string, v: string) {
    if (this.setMode === "quota") {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    }
    if (this.setMode === "unavailable") {
      throw new DOMException("Storage unavailable", "SecurityError");
    }
    this.store.set(k, v);
  }
  getItem(k: string) {
    return this.store.get(k) ?? null;
  }
  removeItem(k: string) {
    this.removeCalls++;
    this.store.delete(k);
  }
  clear() {
    this.store.clear();
  }
}

let mockLS: LocalStorageMock;

beforeEach(() => {
  mockLS = new LocalStorageMock();
  (globalThis as unknown as { window: unknown }).window = { localStorage: mockLS };
  __resetStoreForTests();
});

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

// -------- Testes de mapeamento --------

describe("uniqueStrings", () => {
  it("remove duplicatas preservando ordem", () => {
    expect(uniqueStrings(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });
});

describe("migrateLegacyDiagnosis — TESTE 1: mapeamento completo de raízes", () => {
  it("converte todas as respostas antigas de raízes", () => {
    const out = migrateLegacyDiagnosis({
      roots: [
        "Firmes",
        "Pontas novas",
        "Poucas raízes",
        "Secas ou ocas",
        "Escuras ou moles",
        "Mau cheiro",
      ],
    });
    expect(out.roots).toEqual([
      "Firmes, verdes ou prateadas",
      "Pontas novas em crescimento",
      "Poucas raízes visíveis",
      "Raízes secas ou ocas",
      "Raízes escuras",
      "Raízes moles",
      "Mau cheiro próximo às raízes ou ao substrato",
    ]);
  });
});

describe("migrateLegacyDiagnosis — TESTE 2: separação de categorias", () => {
  it("move água/substrato para potAndSubstrate e mudança de lugar para environment", () => {
    const out = migrateLegacyDiagnosis({
      environment: [
        "Boa claridade",
        "Água acumulada no vaso",
        "Substrato compactado",
      ],
      routine: ["Rego por calendário", "Mudei a planta recentemente"],
    });
    expect(out.environment).toEqual([
      "Boa luminosidade indireta",
      "Mudada de lugar recentemente",
    ]);
    expect(out.potAndSubstrate).toEqual([
      "Água acumulada no pratinho ou cachepot",
      "Substrato compactado",
    ]);
    expect(out.wateringAndRoutine).toEqual(["Rego sempre em dias fixos"]);
  });
});

describe("migrateLegacyDiagnosis — TESTE 3: deduplicação", () => {
  it("não repete a mesma resposta atual", () => {
    const out = migrateLegacyDiagnosis({
      roots: [
        "Firmes",
        "Firmes, verdes ou prateadas",
        "Escuras ou moles",
        "Raízes escuras",
      ],
    });
    // Nenhum duplicado
    expect(new Set(out.roots).size).toBe(out.roots.length);
    expect(out.roots).toContain("Firmes, verdes ou prateadas");
    expect(out.roots).toContain("Raízes escuras");
    expect(out.roots).toContain("Raízes moles");
  });
});

// -------- Testes de aplicações --------

describe("migrateProtocolState — TESTE 4: aplicação migrada sem data falsa", () => {
  it("aplica applicationDone com timestamp null e migrated true", () => {
    const s = migrateProtocolState({
      schemaVersion: 2,
      days: { 3: { applicationDone: true } },
    });
    expect(s.applications).toHaveLength(1);
    expect(s.applications[0]).toEqual({
      id: "legacy-3",
      day: 3,
      timestamp: null,
      migrated: true,
    });
  });
});

describe("migrateProtocolState — TESTE 5: mesclagem de aplicações", () => {
  it("preserva registros reais e adiciona legacy-3 sem duplicar dia 7", () => {
    const s = migrateProtocolState({
      schemaVersion: 2,
      applications: [
        { id: "real-1", day: 7, timestamp: "2026-07-01T10:00:00.000Z" },
      ],
      days: {
        3: { applicationDone: true },
        7: { applicationDone: true },
      },
    });
    const ids = s.applications.map((a) => a.id).sort();
    expect(ids).toEqual(["legacy-3", "real-1"]);
    const legacy3 = s.applications.find((a) => a.id === "legacy-3")!;
    expect(legacy3.timestamp).toBeNull();
    expect(legacy3.migrated).toBe(true);
    const real = s.applications.find((a) => a.id === "real-1")!;
    expect(real.timestamp).toBe("2026-07-01T10:00:00.000Z");
  });
});

describe("migrateProtocolState — TESTE 6: guestMode removido", () => {
  it("descarta guestMode do JSON salvo", () => {
    const s = migrateProtocolState({ schemaVersion: 2, guestMode: true });
    expect("guestMode" in s).toBe(false);
  });
});

// -------- Persistência --------

describe("persistState / setState — TESTE 7: quota e rollback", () => {
  it("mantém estado anterior e sinaliza saveError quando falha", () => {
    // Estado inicial válido salvo com sucesso
    const first = setState((s) => ({ ...s, currentDay: 5 }));
    expect(first.ok).toBe(true);
    const before = getState();
    expect(before.currentDay).toBe(5);

    // Simula quota
    mockLS.setMode = "quota";
    let notified = 0;
    const unsub = subscribe(() => notified++);
    const result = setState((s) => ({ ...s, currentDay: 12 }));
    unsub();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("quota");
    const after = getState();
    expect(after.currentDay).toBe(5); // rollback
    expect(after.saveError).toBe(SAVE_ERROR_MESSAGE);
    expect(notified).toBe(1);
  });
});

describe("clearSaveError — TESTE 8", () => {
  it("limpa erro em memória sem chamar localStorage.setItem", () => {
    // Provoca um erro
    mockLS.setMode = "quota";
    setState((s) => ({ ...s, currentDay: 7 }));
    expect(getState().saveError).toBe(SAVE_ERROR_MESSAGE);

    // Recupera modo normal e monitora writes
    mockLS.setMode = "ok";
    const writesBefore = mockLS.store.size;
    const setSpy = mockLS.setItem.bind(mockLS);
    let setCount = 0;
    mockLS.setItem = (k: string, v: string) => {
      setCount++;
      return setSpy(k, v);
    };

    let notified = 0;
    const unsub = subscribe(() => notified++);
    clearSaveError();
    unsub();

    expect(getState().saveError).toBeUndefined();
    expect(setCount).toBe(0);
    expect(mockLS.store.size).toBe(writesBefore);
    expect(notified).toBe(1);
  });
});

describe("Migração atômica — TESTE 9", () => {
  it("preserva a chave antiga quando o salvamento da nova falha", () => {
    mockLS.store.set(
      "plantaefert-protocolo-21d-v1",
      JSON.stringify({
        plant: { name: "Bianca" },
        diagnosis: { roots: ["Firmes"] },
      }),
    );
    mockLS.setMode = "quota";
    __resetStoreForTests();

    const s = getState();
    // O estado migrado é utilizado
    expect(s.plant.name).toBe("Bianca");
    expect(s.diagnosis.roots).toEqual(["Firmes, verdes ou prateadas"]);
    // A chave antiga NÃO foi removida
    expect(mockLS.store.has("plantaefert-protocolo-21d-v1")).toBe(true);
    // A chave nova NÃO foi gravada
    expect(mockLS.store.has("plantaefert-protocolo-21d")).toBe(false);
    // saveError é exposto
    expect(s.saveError).toBe(SAVE_ERROR_MESSAGE);
  });

  it("remove a chave antiga apenas após gravação bem-sucedida", () => {
    mockLS.store.set(
      "plantaefert-protocolo-21d-v1",
      JSON.stringify({ plant: { name: "Roxa" } }),
    );
    __resetStoreForTests();

    const s = getState();
    expect(s.plant.name).toBe("Roxa");
    expect(mockLS.store.has("plantaefert-protocolo-21d")).toBe(true);
    expect(mockLS.store.has("plantaefert-protocolo-21d-v1")).toBe(false);
  });
});

describe("Dias inválidos — TESTE 10", () => {
  it("normalizeCurrentDay rejeita valores fora de 1..21", () => {
    expect(normalizeCurrentDay(999)).toBe(3);
    expect(normalizeCurrentDay(-1)).toBe(3);
    expect(normalizeCurrentDay(2.5)).toBe(3);
    expect(normalizeCurrentDay("abc")).toBe(3);
    expect(normalizeCurrentDay(1)).toBe(1);
    expect(normalizeCurrentDay(21)).toBe(21);
  });

  it("descarta chaves inválidas em days", () => {
    const s = migrateProtocolState({
      schemaVersion: 2,
      days: {
        "-1": { note: "a" },
        "2.5": { note: "b" },
        "1000": { note: "c" },
        abc: { note: "d" },
        "5": { note: "válida" },
      },
    });
    expect(Object.keys(s.days)).toEqual(["5"]);
    expect(s.days[5].note).toBe("válida");
  });
});

// -------- Sanidade adicional --------

describe("persistState", () => {
  it("retorna unavailable quando window/localStorage não existem", () => {
    delete (globalThis as unknown as { window?: unknown }).window;
    const state: ProtocolState = {
      schemaVersion: 2,
      currentDay: 3,
      plant: {
        name: "",
        species: "",
        unknownSpecies: false,
        location: "",
        pot: "",
        substrate: "",
        difficulty: "",
        photo: null,
      },
      diagnosis: {
        roots: [],
        leaves: [],
        environment: [],
        potAndSubstrate: [],
        wateringAndRoutine: [],
      },
      diagnosisResult: null,
      diagnosisStatus: "none",
      answersVersion: 0,
      days: {},
      applications: [],
      finalEval: { improved: "", same: "", attention: "", keep: "", path: "" },
      onboarded: false,
    };
    const r = persistState(state);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("unavailable");
  });
});

describe("normalizeDiagnosisResult", () => {
  it("descarta resultado com campos ausentes", () => {
    const s = migrateProtocolState({
      schemaVersion: 2,
      diagnosisResult: { priorities: [], adjustments: [] },
    });
    expect(s.diagnosisResult).toBeNull();
  });

  it("preserva resultado completo", () => {
    const s = migrateProtocolState({
      schemaVersion: 2,
      diagnosisResult: {
        favorable: [],
        adjustments: [],
        priorities: [],
        insufficientInformation: [],
        trackingPoints: [],
        completedAt: null,
        answersVersion: 0,
      },
    });
    expect(s.diagnosisResult).not.toBeNull();
  });
});

describe("normalizeDiagnosisResult — validação profunda", () => {
  const validGuidance = {
    id: "g1",
    category: "roots",
    answer: "Firmes",
    title: "Título",
    classification: "favorable",
    explanation: "explicação",
    action: "ação",
    tracking: ["ponto"],
  };
  const withResult = (r: unknown) =>
    migrateProtocolState({ schemaVersion: 2, diagnosisResult: r }).diagnosisResult;
  const baseResult = (over: Record<string, unknown> = {}) => ({
    favorable: [],
    adjustments: [],
    priorities: [],
    insufficientInformation: [],
    trackingPoints: [],
    completedAt: null,
    answersVersion: 0,
    ...over,
  });

  it("1. preserva resultado completo e válido", () => {
    const r = withResult(baseResult({ priorities: [validGuidance], trackingPoints: ["a"] }));
    expect(r).not.toBeNull();
    expect(r!.priorities).toHaveLength(1);
    expect(r!.priorities[0].tracking).toEqual(["ponto"]);
  });

  it("2. orientação sem tracking retorna null", () => {
    const { tracking: _t, ...g } = validGuidance;
    void _t;
    expect(withResult(baseResult({ priorities: [g] }))).toBeNull();
  });

  it("3. tracking não-array retorna null", () => {
    expect(
      withResult(baseResult({ priorities: [{ ...validGuidance, tracking: "x" }] })),
    ).toBeNull();
  });

  it("4. categoria inválida retorna null", () => {
    expect(
      withResult(baseResult({ priorities: [{ ...validGuidance, category: "foo" }] })),
    ).toBeNull();
  });

  it("5. valor não-objeto dentro de priorities retorna null", () => {
    expect(withResult(baseResult({ priorities: ["oi"] }))).toBeNull();
  });

  it("6. trackingPoints com número retorna null", () => {
    expect(withResult(baseResult({ trackingPoints: ["ok", 3] }))).toBeNull();
  });

  it("7. answersVersion negativo retorna null", () => {
    expect(withResult(baseResult({ answersVersion: -1 }))).toBeNull();
  });

  it("8. answersVersion decimal retorna null", () => {
    expect(withResult(baseResult({ answersVersion: 1.5 }))).toBeNull();
  });

  it("9. answersVersion NaN retorna null", () => {
    expect(withResult(baseResult({ answersVersion: Number.NaN }))).toBeNull();
  });

  it("10. completedAt inválido retorna null", () => {
    expect(withResult(baseResult({ completedAt: 123 }))).toBeNull();
  });

  it("11. id vazio retorna null", () => {
    expect(
      withResult(baseResult({ priorities: [{ ...validGuidance, id: "" }] })),
    ).toBeNull();
  });

  it("12. avoid/warning com tipo inválido retorna null", () => {
    expect(
      withResult(baseResult({ priorities: [{ ...validGuidance, avoid: 5 }] })),
    ).toBeNull();
    expect(
      withResult(baseResult({ priorities: [{ ...validGuidance, warning: true }] })),
    ).toBeNull();
  });
});