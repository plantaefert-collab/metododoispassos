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
  normalizeAnswersVersion,
  reconcileDiagnosisResultState,
  mergeRemoteProgressState,
  isDiagnosisCurrent,
  ensureStoreInitialized,
  type ProtocolState,
} from "./protocol-store";
import { computeDiagnosisResult } from "./diagnosis-matrix";

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
      environment: ["Boa claridade", "Água acumulada no vaso", "Substrato compactado"],
      routine: ["Rego por calendário", "Mudei a planta recentemente"],
    });
    expect(out.environment).toEqual(["Boa luminosidade indireta", "Mudada de lugar recentemente"]);
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
      roots: ["Firmes", "Firmes, verdes ou prateadas", "Escuras ou moles", "Raízes escuras"],
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
      applications: [{ id: "real-1", day: 7, timestamp: "2026-07-01T10:00:00.000Z" }],
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
    mockLS.store.set("plantaefert-protocolo-21d-v1", JSON.stringify({ plant: { name: "Roxa" } }));
    __resetStoreForTests();

    const s = getState();
    expect(s.plant.name).toBe("Roxa");
    expect(mockLS.store.has("plantaefert-protocolo-21d")).toBe(true);
    expect(mockLS.store.has("plantaefert-protocolo-21d-v1")).toBe(false);
  });
});

describe("Dias inválidos — TESTE 10", () => {
  it("normalizeCurrentDay rejeita valores fora de 1..21", () => {
    expect(normalizeCurrentDay(999)).toBe(1);
    expect(normalizeCurrentDay(-1)).toBe(1);
    expect(normalizeCurrentDay(2.5)).toBe(1);
    expect(normalizeCurrentDay("abc")).toBe(1);
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
    expect(withResult(baseResult({ priorities: [{ ...validGuidance, id: "" }] }))).toBeNull();
  });

  it("12. avoid/warning com tipo inválido retorna null", () => {
    expect(withResult(baseResult({ priorities: [{ ...validGuidance, avoid: 5 }] }))).toBeNull();
    expect(
      withResult(baseResult({ priorities: [{ ...validGuidance, warning: true }] })),
    ).toBeNull();
  });
});
// -------- Reconciliação answersVersion / status --------

const validGuidance = {
  id: "g1",
  category: "roots" as const,
  answer: "Firmes",
  title: "Título",
  classification: "favorable" as const,
  explanation: "explicação",
  action: "ação",
  tracking: ["ponto"],
};
const buildResult = (answersVersion: number) => ({
  favorable: [{ ...validGuidance }],
  adjustments: [],
  priorities: [],
  insufficientInformation: [],
  trackingPoints: ["p"],
  completedAt: "2026-07-19T00:00:00.000Z",
  answersVersion,
});

describe("normalizeAnswersVersion — TESTE 9", () => {
  it("aceita inteiro ≥ 0 e rejeita valores inválidos", () => {
    expect(normalizeAnswersVersion(0)).toBe(0);
    expect(normalizeAnswersVersion(5)).toBe(5);
    expect(normalizeAnswersVersion(-1)).toBe(0);
    expect(normalizeAnswersVersion(1.5)).toBe(0);
    expect(normalizeAnswersVersion(Number.NaN)).toBe(0);
    expect(normalizeAnswersVersion(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeAnswersVersion("3")).toBe(0);
    expect(normalizeAnswersVersion(undefined)).toBe(0);
  });

  it("migrateProtocolState normaliza answersVersion inválido para 0", () => {
    for (const v of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, "3", undefined]) {
      const s = migrateProtocolState({ schemaVersion: 2, answersVersion: v });
      expect(s.answersVersion).toBe(0);
    }
  });
});

describe("reconcileDiagnosisResultState", () => {
  it("TESTE 1 — versões iguais e status fresh → mantém fresh", () => {
    const r = buildResult(3);
    const out = reconcileDiagnosisResultState(r, "fresh", 3);
    expect(out.diagnosisResult).toBe(r);
    expect(out.diagnosisStatus).toBe("fresh");
  });

  it("TESTE 2 — versão salva anterior → outdated preservando resultado", () => {
    const r = buildResult(3);
    const out = reconcileDiagnosisResultState(r, "fresh", 4);
    expect(out.diagnosisResult).toBe(r);
    expect(out.diagnosisStatus).toBe("outdated");
  });

  it("TESTE 3 — resultado mais novo que as respostas → outdated", () => {
    const r = buildResult(3);
    const out = reconcileDiagnosisResultState(r, "fresh", 2);
    expect(out.diagnosisResult).toBe(r);
    expect(out.diagnosisStatus).toBe("outdated");
  });

  it("TESTE 4 — resultado null com status fresh → none", () => {
    const out = reconcileDiagnosisResultState(null, "fresh", 3);
    expect(out.diagnosisResult).toBeNull();
    expect(out.diagnosisStatus).toBe("none");
  });

  it("TESTE 5 — resultado null com status outdated → none", () => {
    const out = reconcileDiagnosisResultState(null, "outdated", 3);
    expect(out.diagnosisStatus).toBe("none");
  });

  it("TESTE 6 — outdated não volta automaticamente para fresh", () => {
    const r = buildResult(3);
    const out = reconcileDiagnosisResultState(r, "outdated", 3);
    expect(out.diagnosisStatus).toBe("outdated");
  });

  it("TESTE 7 — status none com resultado compatível → fresh", () => {
    const r = buildResult(3);
    const out = reconcileDiagnosisResultState(r, "none", 3);
    expect(out.diagnosisStatus).toBe("fresh");
  });

  it("TESTE 8 — status inválido tratado como none → fresh quando compatível", () => {
    const r = buildResult(3);
    // status inválido é normalizado para "none" pelo normalizeDiagnosisStatus;
    // aqui simulamos o comportamento passando "none" e via migrateProtocolState.
    const out = reconcileDiagnosisResultState(r, "none", 3);
    expect(out.diagnosisStatus).toBe("fresh");

    const s = migrateProtocolState({
      schemaVersion: 2,
      answersVersion: 3,
      diagnosisResult: buildResult(3),
      diagnosisStatus: "banana",
    });
    expect(s.diagnosisStatus).toBe("fresh");
    expect(s.diagnosisResult).not.toBeNull();
  });
});

describe("migrateProtocolState reconciliação", () => {
  it("preserva resultado antigo e marca outdated quando versões diferem", () => {
    const s = migrateProtocolState({
      schemaVersion: 2,
      answersVersion: 4,
      diagnosisResult: buildResult(3),
      diagnosisStatus: "fresh",
    });
    expect(s.diagnosisResult).not.toBeNull();
    expect(s.diagnosisResult!.completedAt).toBe("2026-07-19T00:00:00.000Z");
    expect(s.diagnosisResult!.answersVersion).toBe(3);
    expect(s.diagnosisStatus).toBe("outdated");
    expect(s.answersVersion).toBe(4);
  });
});

// -------- TESTE 10 / 11 / 12: fluxo via hook actions --------
// Reproduz a lógica das ações do useProtocolStore sem montar React.

describe("Fluxo de alteração e nova conclusão", () => {
  it("TESTE 10 — toggle após resultado válido incrementa versão e marca outdated", () => {
    // Semear estado válido com versão 2 e resultado compatível.
    __resetStoreForTests();
    const seeded = computeDiagnosisResult(
      {
        roots: ["Firmes, verdes ou prateadas"],
        leaves: [],
        environment: [],
        potAndSubstrate: [],
        wateringAndRoutine: [],
      },
      2,
    );
    setState((s) => ({
      ...s,
      diagnosis: {
        roots: ["Firmes, verdes ou prateadas"],
        leaves: [],
        environment: [],
        potAndSubstrate: [],
        wateringAndRoutine: [],
      },
      diagnosisResult: seeded,
      diagnosisStatus: "fresh",
      answersVersion: 2,
    }));

    // Reproduz toggleDiagnosis inline (mesma lógica).
    setState((s) => {
      const arr = s.diagnosis.roots;
      const value = "Pontas novas em crescimento";
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      const nextStatus =
        s.diagnosisResult && s.diagnosisStatus !== "none" ? "outdated" : s.diagnosisStatus;
      return {
        ...s,
        diagnosis: { ...s.diagnosis, roots: next },
        answersVersion: s.answersVersion + 1,
        diagnosisStatus: nextStatus,
      };
    });

    const st = getState();
    expect(st.answersVersion).toBe(3);
    expect(st.diagnosisResult).not.toBeNull();
    expect(st.diagnosisStatus).toBe("outdated");
  });

  it("TESTE 11 — nova conclusão traz status para fresh com versão sincronizada", () => {
    __resetStoreForTests();
    setState((s) => ({
      ...s,
      diagnosis: {
        roots: ["Firmes, verdes ou prateadas"],
        leaves: [],
        environment: [],
        potAndSubstrate: [],
        wateringAndRoutine: [],
      },
      diagnosisResult: buildResult(2),
      diagnosisStatus: "outdated",
      answersVersion: 5,
    }));
    // reproduz saveDiagnosisResult
    setState((s) => {
      const result = computeDiagnosisResult(s.diagnosis, s.answersVersion);
      return { ...s, diagnosisResult: result, diagnosisStatus: "fresh" };
    });
    const st = getState();
    expect(st.diagnosisResult).not.toBeNull();
    expect(st.diagnosisResult!.answersVersion).toBe(5);
    expect(st.diagnosisStatus).toBe("fresh");
    expect(st.answersVersion).toBe(5);
  });

  it("TESTE 12 — resultado desatualizado não é 'atual'", () => {
    const isCurrent = (s: ProtocolState) =>
      s.diagnosisStatus === "fresh" &&
      s.diagnosisResult !== null &&
      s.diagnosisResult.answersVersion === s.answersVersion;

    __resetStoreForTests();
    setState((s) => ({
      ...s,
      diagnosisResult: buildResult(2),
      diagnosisStatus: "outdated",
      answersVersion: 3,
    }));
    expect(isCurrent(getState())).toBe(false);

    // Versões diferentes com status "fresh" salvo — migração deve reconciliar.
    const migrated = migrateProtocolState({
      schemaVersion: 2,
      answersVersion: 3,
      diagnosisResult: buildResult(2),
      diagnosisStatus: "fresh",
    });
    expect(isCurrent(migrated)).toBe(false);
  });
});

// -------- isDiagnosisCurrent + saveDiagnosisResult persistence contract --------

describe("isDiagnosisCurrent", () => {
  it("true quando status fresh, resultado presente e versões iguais", () => {
    const s: ProtocolState = {
      ...getState(),
      diagnosisResult: buildResult(4),
      diagnosisStatus: "fresh",
      answersVersion: 4,
    };
    expect(isDiagnosisCurrent(s)).toBe(true);
  });
  it("false quando status outdated", () => {
    const s: ProtocolState = {
      ...getState(),
      diagnosisResult: buildResult(4),
      diagnosisStatus: "outdated",
      answersVersion: 4,
    };
    expect(isDiagnosisCurrent(s)).toBe(false);
  });
  it("false quando resultado é null", () => {
    const s: ProtocolState = {
      ...getState(),
      diagnosisResult: null,
      diagnosisStatus: "fresh",
      answersVersion: 4,
    };
    expect(isDiagnosisCurrent(s)).toBe(false);
  });
  it("false quando versões diferem", () => {
    const s: ProtocolState = {
      ...getState(),
      diagnosisResult: buildResult(3),
      diagnosisStatus: "fresh",
      answersVersion: 4,
    };
    expect(isDiagnosisCurrent(s)).toBe(false);
  });
});

// Reproduz saveDiagnosisResult com a mesma semântica do hook (chama setState
// diretamente e retorna o PersistResult). O hook faz exatamente isto.
function callSaveDiagnosisResult() {
  return setState((s) => {
    const result = computeDiagnosisResult(s.diagnosis, s.answersVersion);
    return { ...s, diagnosisResult: result, diagnosisStatus: "fresh" as const };
  });
}

describe("saveDiagnosisResult", () => {
  it("retorna { ok: true } e marca fresh com answersVersion atual", () => {
    __resetStoreForTests();
    setState((s) => ({
      ...s,
      diagnosis: {
        roots: ["Firmes, verdes ou prateadas"],
        leaves: [],
        environment: [],
        potAndSubstrate: [],
        wateringAndRoutine: [],
      },
      answersVersion: 7,
      diagnosisStatus: "none",
      diagnosisResult: null,
    }));
    const r = callSaveDiagnosisResult();
    expect(r.ok).toBe(true);
    const st = getState();
    expect(st.diagnosisStatus).toBe("fresh");
    expect(st.diagnosisResult).not.toBeNull();
    expect(st.diagnosisResult!.answersVersion).toBe(7);
    expect(isDiagnosisCurrent(st)).toBe(true);
  });

  it("em quota: retorna { ok: false, reason: 'quota' }, preserva estado anterior e sinaliza saveError", () => {
    __resetStoreForTests();
    const prevResult = buildResult(2);
    setState((s) => ({
      ...s,
      diagnosis: {
        roots: ["Firmes, verdes ou prateadas"],
        leaves: [],
        environment: [],
        potAndSubstrate: [],
        wateringAndRoutine: [],
      },
      answersVersion: 5,
      diagnosisResult: prevResult,
      diagnosisStatus: "outdated",
    }));
    mockLS.setMode = "quota";
    const r = callSaveDiagnosisResult();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("quota");
    const st = getState();
    // resultado anterior preservado
    expect(st.diagnosisResult).toBe(prevResult);
    expect(st.diagnosisStatus).toBe("outdated");
    expect(st.answersVersion).toBe(5);
    expect(st.saveError).toBe(SAVE_ERROR_MESSAGE);
    // resultado antigo não passa a ser considerado atual
    expect(isDiagnosisCurrent(st)).toBe(false);
  });
});

describe("computeDiagnosisResult — diagnóstico sem marcações", () => {
  it("gera blocos educativos de informação insuficiente em vez de resultado vazio", () => {
    const result = computeDiagnosisResult(
      {
        roots: [],
        leaves: [],
        environment: [],
        potAndSubstrate: [],
        wateringAndRoutine: [],
      },
      0,
      "2026-07-20T00:00:00.000Z",
    );

    expect(result.insufficientInformation).toHaveLength(5);
    expect(result.insufficientInformation.map((item) => item.category)).toEqual([
      "roots",
      "leaves",
      "environment",
      "potAndSubstrate",
      "wateringAndRoutine",
    ]);
    expect(result.completedAt).toBe("2026-07-20T00:00:00.000Z");
  });
});

describe("mergeRemoteProgressState", () => {
  it("não apaga diagnóstico local quando o progresso remoto ainda está sem resultado", () => {
    const local: ProtocolState = {
      ...getState(),
      currentDay: 4,
      diagnosis: {
        roots: ["Firmes, verdes ou prateadas"],
        leaves: [],
        environment: [],
        potAndSubstrate: [],
        wateringAndRoutine: [],
      },
      diagnosisResult: buildResult(7),
      diagnosisStatus: "fresh",
      answersVersion: 7,
    };

    const merged = mergeRemoteProgressState(local, {
      current_day: 4,
      completed_tasks: {},
      applications: [],
      diagnosis_result: null,
      diagnosis_answers: {},
      diagnosis_status: "none",
      answers_version: 0,
    });

    expect(merged.diagnosisResult).toBe(local.diagnosisResult);
    expect(merged.diagnosisStatus).toBe("fresh");
    expect(merged.answersVersion).toBe(7);
    expect(isDiagnosisCurrent(merged)).toBe(true);
  });

  it("aplica diagnóstico remoto válido com respostas, status e versão reconciliados", () => {
    const remoteResult = buildResult(3);
    const merged = mergeRemoteProgressState(getState(), {
      current_day: 8,
      completed_tasks: { 8: { note: "observação" } },
      applications: [],
      diagnosis_answers: {
        roots: ["Firmes, verdes ou prateadas"],
      },
      diagnosis_result: remoteResult,
      diagnosis_status: "fresh",
      answers_version: 3,
    });

    expect(merged.currentDay).toBe(8);
    expect(merged.days[8].note).toBe("observação");
    expect(merged.diagnosis.roots).toEqual(["Firmes, verdes ou prateadas"]);
    expect(merged.diagnosisResult).toEqual(remoteResult);
    expect(merged.diagnosisStatus).toBe("fresh");
    expect(merged.answersVersion).toBe(3);
  });
});

describe("Inicialização única do Store", () => {
  it("TESTE 1 — Primeira inicialização: lê localStorage", () => {
    mockLS.setItem(
      "plantaefert-protocolo-21d",
      JSON.stringify({ schemaVersion: 2, currentDay: 10 }),
    );
    const state = ensureStoreInitialized();
    expect(state.currentDay).toBe(10);
  });

  it("TESTE 2 — Segunda inicialização: não lê localStorage novamente", () => {
    ensureStoreInitialized();
    const getSpy = mockLS.getItem.bind(mockLS);
    let getCount = 0;
    mockLS.getItem = (k: string) => {
      getCount++;
      return getSpy(k);
    };

    const state2 = ensureStoreInitialized();
    expect(getCount).toBe(0);
    expect(state2).toBe(getState());
  });

  it("TESTE 3 — Estado em memória preservado após alteração", () => {
    ensureStoreInitialized();
    setState((s) => ({ ...s, plant: { ...s.plant, name: "Persistida" } }));

    const stateAfter = ensureStoreInitialized();
    expect(stateAfter.plant.name).toBe("Persistida");
  });

  it("TESTE 4 — saveError preservado", () => {
    ensureStoreInitialized();
    mockLS.setMode = "quota";
    setState((s) => ({ ...s, currentDay: 20 }));

    expect(getState().saveError).toBe(SAVE_ERROR_MESSAGE);

    const stateAgain = ensureStoreInitialized();
    expect(stateAgain.saveError).toBe(SAVE_ERROR_MESSAGE);
  });

  it("TESTE 5 — Dois consumidores do store: mesma referência e estado transitório", () => {
    const s1 = ensureStoreInitialized();
    mockLS.setMode = "quota";
    setState((s) => ({ ...s, onboarded: true }));
    expect(getState().saveError).toBeDefined();

    const s2 = ensureStoreInitialized();
    expect(s2).toBe(getState());
    expect(s2.saveError).toBeDefined();
  });

  it("TESTE 6 — Reset preservado: dados antigos não retornam", () => {
    mockLS.setItem(
      "plantaefert-protocolo-21d",
      JSON.stringify({ schemaVersion: 2, currentDay: 15 }),
    );
    ensureStoreInitialized();
    expect(getState().currentDay).toBe(15);

    // Simulando ação do reset() via setState pois reset é interno ao hook
    setState((s) => ({
      schemaVersion: 2,
      currentDay: 1,
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
    }));

    expect(getState().currentDay).toBe(1);
    const stateAgain = ensureStoreInitialized();
    expect(stateAgain.currentDay).toBe(1);
  });

  it("TESTE 7 — Reset exclusivo para testes", () => {
    ensureStoreInitialized();
    __resetStoreForTests();
    const getSpy = mockLS.getItem.bind(mockLS);
    let getCount = 0;
    mockLS.getItem = (k: string) => {
      getCount++;
      return getSpy(k);
    };
    ensureStoreInitialized();
    expect(getCount).toBeGreaterThan(0);
  });
});

describe("Protocol Plan — Regras de aplicação e marcos", () => {
  it("Valida dias de aplicação 1, 7, 14, 21", () => {
    const s = migrateProtocolState({
      schemaVersion: 2,
      applications: [
        { id: "a1", day: 1, timestamp: "2026-07-19T10:00:00Z" },
        { id: "a7", day: 7, timestamp: "2026-07-19T10:00:00Z" },
        { id: "a14", day: 14, timestamp: "2026-07-19T10:00:00Z" },
        { id: "a21", day: 21, timestamp: "2026-07-19T10:00:00Z" },
      ],
    });
    expect(s.applications).toHaveLength(4);
    expect(s.applications.map((a) => a.day)).toEqual([1, 7, 14, 21]);
  });

  it("Garante 21 dias únicos no plano completo", () => {
    const s = migrateProtocolState({
      schemaVersion: 2,
      days: Array.from({ length: 21 }, (_, i) => i + 1).reduce(
        (acc, day) => ({ ...acc, [day]: { note: `Dia ${day}` } }),
        {},
      ),
    });
    expect(Object.keys(s.days)).toHaveLength(21);
    expect(s.days[1].note).toBe("Dia 1");
    expect(s.days[21].note).toBe("Dia 21");
  });
});
