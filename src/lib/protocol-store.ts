import { useEffect, useState, useCallback } from "react";
import {
  computeDiagnosisResult,
  type DiagnosisAnswers,
  type DiagnosisCategory,
  type DiagnosisGuidance,
  type DiagnosisResult,
} from "./diagnosis-matrix";

export type PlantInfo = {
  name: string;
  species: string;
  unknownSpecies: boolean;
  location: string;
  pot: string;
  substrate: string;
  difficulty: string;
  photo: string | null;
};

export type DiagnosisStatus = "none" | "fresh" | "outdated";

export type DayEntry = {
  checklist: Record<string, boolean>;
  note: string;
  completed: boolean;
  photo?: string | null;
  photoCaption?: string;
  roots?: string;
  leavesObs?: string;
  shoots?: string;
  observations?: string;
  applicationDone?: boolean;
};

export type FinalEvaluation = {
  improved: string;
  same: string;
  attention: string;
  keep: string;
  path: "" | "evolved" | "stable" | "worsening" | "healthy-no-bloom";
};

export type ApplicationRecord = {
  id: string;
  day: number;
  timestamp: string | null;
  migrated?: boolean;
};

export type ProtocolState = {
  schemaVersion: 2;
  currentDay: number;
  plant: PlantInfo;
  diagnosis: DiagnosisAnswers;
  diagnosisResult: DiagnosisResult | null;
  diagnosisStatus: DiagnosisStatus;
  answersVersion: number;
  days: Record<number, DayEntry>;
  applications: ApplicationRecord[];
  finalEval: FinalEvaluation;
  onboarded: boolean;
  /** Non-persisted transient flag set when the last localStorage write failed. */
  saveError?: string;
};

export type PersistResult =
  | { ok: true }
  | { ok: false; reason: "quota" | "unavailable" | "unknown" };

export const SAVE_ERROR_MESSAGE =
  "Não foi possível salvar esta alteração no navegador. Libere espaço ou remova alguma fotografia e tente novamente.";

const STORAGE_KEY = "plantaefert-protocolo-21d";
const LEGACY_KEY_V1 = "plantaefert-protocolo-21d-v1";
const DEFAULT_CURRENT_DAY = 3;

const emptyPlant: PlantInfo = {
  name: "",
  species: "",
  unknownSpecies: false,
  location: "",
  pot: "",
  substrate: "",
  difficulty: "",
  photo: null,
};

const emptyDiag: DiagnosisAnswers = {
  roots: [],
  leaves: [],
  environment: [],
  potAndSubstrate: [],
  wateringAndRoutine: [],
};

const defaultState: ProtocolState = {
  schemaVersion: 2,
  currentDay: DEFAULT_CURRENT_DAY,
  plant: emptyPlant,
  diagnosis: emptyDiag,
  diagnosisResult: null,
  diagnosisStatus: "none",
  answersVersion: 0,
  days: {},
  applications: [],
  finalEval: { improved: "", same: "", attention: "", keep: "", path: "" },
  onboarded: false,
};

// ---------- Normalização defensiva ----------

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (typeof v !== "string") continue;
    if (v.length === 0) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

export function normalizeCurrentDay(v: unknown): number {
  if (typeof v !== "number") return DEFAULT_CURRENT_DAY;
  if (!Number.isInteger(v)) return DEFAULT_CURRENT_DAY;
  if (v < 1 || v > 21) return DEFAULT_CURRENT_DAY;
  return v;
}

// ---------- Mapeamento de respostas antigas ----------

function mapRootAnswer(v: string): string[] {
  switch (v) {
    case "Firmes":
      return ["Firmes, verdes ou prateadas"];
    case "Pontas novas":
      return ["Pontas novas em crescimento"];
    case "Poucas raízes":
      return ["Poucas raízes visíveis"];
    case "Secas ou ocas":
      return ["Raízes secas ou ocas"];
    case "Escuras ou moles":
      return ["Raízes escuras", "Raízes moles"];
    case "Mau cheiro":
      return ["Mau cheiro próximo às raízes ou ao substrato"];
    default:
      return [v];
  }
}

function mapLeafAnswer(v: string): string[] {
  switch (v) {
    case "Firmes":
      return ["Firmes e sem alterações aparentes"];
    case "Enrugadas":
      return ["Folhas enrugadas"];
    case "Amareladas":
      return ["Folhas amareladas"];
    case "Manchas":
      return ["Manchas escuras"];
    case "Folha nova":
      return ["Folha nova surgindo"];
    case "Brotação":
      return ["Brotação nova visível"];
    default:
      return [v];
  }
}

type Redirect = { category: DiagnosisCategory; values: string[] };

function mapEnvironmentAnswer(v: string): Redirect {
  switch (v) {
    case "Boa claridade":
    case "Boa claridade indireta":
      return { category: "environment", values: ["Boa luminosidade indireta"] };
    case "Sol forte direto":
      return { category: "environment", values: ["Sol direto forte"] };
    case "Local abafado":
      return { category: "environment", values: ["Ambiente abafado"] };
    case "Boa ventilação":
      return { category: "environment", values: ["Boa circulação de ar"] };
    case "Mudei a planta recentemente":
      return { category: "environment", values: ["Mudada de lugar recentemente"] };
    case "Água acumulada no vaso":
      return {
        category: "potAndSubstrate",
        values: ["Água acumulada no pratinho ou cachepot"],
      };
    case "Substrato compactado":
      return { category: "potAndSubstrate", values: ["Substrato compactado"] };
    default:
      return { category: "environment", values: [v] };
  }
}

function mapRoutineAnswer(v: string): Redirect {
  switch (v) {
    case "Verifico umidade antes de regar":
      return {
        category: "wateringAndRoutine",
        values: ["Verifico a umidade antes de regar"],
      };
    case "Rego por calendário":
    case "Rega por calendário":
    case "Rega por calendário fixo":
      return {
        category: "wateringAndRoutine",
        values: ["Rego sempre em dias fixos"],
      };
    case "Uso vários produtos":
      return {
        category: "wateringAndRoutine",
        values: ["Uso vários fertilizantes ou produtos ao mesmo tempo"],
      };
    case "Mudei a planta recentemente":
      return { category: "environment", values: ["Mudada de lugar recentemente"] };
    case "Água acumulada no vaso":
      return {
        category: "potAndSubstrate",
        values: ["Água acumulada no pratinho ou cachepot"],
      };
    case "Substrato compactado":
      return { category: "potAndSubstrate", values: ["Substrato compactado"] };
    default:
      return { category: "wateringAndRoutine", values: [v] };
  }
}

/**
 * Converte respostas do diagnóstico (formato antigo e/ou atual) para o
 * formato atual da matriz, movendo itens para a categoria correta,
 * expandindo respostas combinadas ("Escuras ou moles") e removendo
 * duplicatas. Nunca lança.
 */
export function migrateLegacyDiagnosis(saved: unknown): DiagnosisAnswers {
  const acc: DiagnosisAnswers = {
    roots: [],
    leaves: [],
    environment: [],
    potAndSubstrate: [],
    wateringAndRoutine: [],
  };
  if (!isPlainObject(saved)) return acc;

  const push = (cat: DiagnosisCategory, values: string[]) => {
    for (const v of values) if (typeof v === "string" && v.length > 0) acc[cat].push(v);
  };

  for (const v of asStringArray(saved.roots)) push("roots", mapRootAnswer(v));
  for (const v of asStringArray(saved.leaves)) push("leaves", mapLeafAnswer(v));
  for (const v of asStringArray(saved.environment)) {
    const m = mapEnvironmentAnswer(v);
    push(m.category, m.values);
  }
  // Campo antigo `routine` ou novo `wateringAndRoutine`.
  for (const v of asStringArray(saved.routine)) {
    const m = mapRoutineAnswer(v);
    push(m.category, m.values);
  }
  for (const v of asStringArray(saved.wateringAndRoutine)) {
    const m = mapRoutineAnswer(v);
    push(m.category, m.values);
  }
  for (const v of asStringArray(saved.potAndSubstrate)) push("potAndSubstrate", [v]);

  return {
    roots: uniqueStrings(acc.roots),
    leaves: uniqueStrings(acc.leaves),
    environment: uniqueStrings(acc.environment),
    potAndSubstrate: uniqueStrings(acc.potAndSubstrate),
    wateringAndRoutine: uniqueStrings(acc.wateringAndRoutine),
  };
}

function normalizePlant(v: unknown): PlantInfo {
  const o = isPlainObject(v) ? v : {};
  return {
    name: asString(o.name),
    species: asString(o.species),
    unknownSpecies: asBool(o.unknownSpecies),
    location: asString(o.location),
    pot: asString(o.pot),
    substrate: asString(o.substrate),
    difficulty: asString(o.difficulty),
    photo: typeof o.photo === "string" ? o.photo : null,
  };
}

function normalizeDayEntry(v: unknown): DayEntry {
  const o = isPlainObject(v) ? v : {};
  const checklist = isPlainObject(o.checklist)
    ? Object.fromEntries(
        Object.entries(o.checklist).map(([k, val]) => [k, Boolean(val)]),
      )
    : {};
  return {
    checklist,
    note: asString(o.note),
    completed: asBool(o.completed),
    photo: typeof o.photo === "string" ? o.photo : null,
    photoCaption: asString(o.photoCaption),
    roots: asString(o.roots),
    leavesObs: asString(o.leavesObs),
    shoots: asString(o.shoots),
    observations: asString(o.observations),
    applicationDone: asBool(o.applicationDone),
  };
}

function normalizeDays(v: unknown): Record<number, DayEntry> {
  if (!isPlainObject(v)) return {};
  const out: Record<number, DayEntry> = {};
  for (const [k, val] of Object.entries(v)) {
    const n = Number(k);
    // Aceitar apenas dias 1–21 inteiros.
    if (!Number.isInteger(n) || n < 1 || n > 21) continue;
    // Rejeitar chaves como "2.5" que Number() aceita mas não são inteiros na string.
    if (String(n) !== k.trim()) continue;
    out[n] = normalizeDayEntry(val);
  }
  return out;
}

function normalizeApplications(v: unknown, days: Record<number, DayEntry>): ApplicationRecord[] {
  const out: ApplicationRecord[] = [];
  const seenIds = new Set<string>();
  const daysCovered = new Set<number>();

  if (Array.isArray(v)) {
    for (const r of v) {
      if (!isPlainObject(r)) continue;
      const day = asNumber(r.day, NaN);
      if (!Number.isFinite(day)) continue;
      const id =
        asString(r.id) ||
        `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      if (seenIds.has(id)) continue;
      const timestamp = typeof r.timestamp === "string" ? r.timestamp : null;
      const migrated = asBool(r.migrated) || timestamp === null;
      seenIds.add(id);
      daysCovered.add(day);
      const rec: ApplicationRecord = { id, day, timestamp };
      if (migrated) rec.migrated = true;
      out.push(rec);
    }
  }

  // Mescla registros sintetizados a partir de days[n].applicationDone.
  // Nunca inventa data. Não cria duplicata se já existe registro para o dia.
  for (const [k, entry] of Object.entries(days)) {
    if (!entry.applicationDone) continue;
    const day = Number(k);
    if (!Number.isInteger(day) || day < 1 || day > 21) continue;
    if (daysCovered.has(day)) continue;
    const id = `legacy-${day}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    daysCovered.add(day);
    out.push({ id, day, timestamp: null, migrated: true });
  }
  return out;
}

function normalizeFinalEval(v: unknown): FinalEvaluation {
  const o = isPlainObject(v) ? v : {};
  const path = o.path;
  const allowed: FinalEvaluation["path"][] = ["", "evolved", "stable", "worsening", "healthy-no-bloom"];
  return {
    improved: asString(o.improved),
    same: asString(o.same),
    attention: asString(o.attention),
    keep: asString(o.keep),
    path: (allowed as string[]).includes(path as string) ? (path as FinalEvaluation["path"]) : "",
  };
}

function normalizeDiagnosisStatus(v: unknown): DiagnosisStatus {
  return v === "fresh" || v === "outdated" || v === "none" ? v : "none";
}

const VALID_CATEGORIES: DiagnosisCategory[] = [
  "roots",
  "leaves",
  "environment",
  "potAndSubstrate",
  "wateringAndRoutine",
];
const VALID_CLASSIFICATIONS = ["favorable", "adjustment", "priority", "insufficient"] as const;

/**
 * Valida uma orientação (item das listas do diagnóstico). Retorna `null`
 * quando qualquer campo obrigatório está ausente ou com tipo inválido, para
 * que um item corrompido não derrube a interface ao acessar propriedades.
 */
export function normalizeDiagnosisGuidance(value: unknown): DiagnosisGuidance | null {
  if (!isPlainObject(value)) return null;
  const {
    id,
    category,
    answer,
    title,
    classification,
    explanation,
    action,
    tracking,
    avoid,
    warning,
  } = value;
  if (typeof id !== "string" || id.length === 0) return null;
  if (typeof category !== "string" || !VALID_CATEGORIES.includes(category as DiagnosisCategory))
    return null;
  if (typeof answer !== "string" || answer.length === 0) return null;
  if (typeof title !== "string" || title.length === 0) return null;
  if (
    typeof classification !== "string" ||
    !(VALID_CLASSIFICATIONS as readonly string[]).includes(classification)
  )
    return null;
  if (typeof explanation !== "string") return null;
  if (typeof action !== "string") return null;
  if (!Array.isArray(tracking)) return null;
  const trackingClean = tracking.filter((t): t is string => typeof t === "string");
  const out: DiagnosisGuidance = {
    id,
    category: category as DiagnosisCategory,
    answer,
    title,
    classification: classification as DiagnosisGuidance["classification"],
    explanation,
    action,
    tracking: trackingClean,
  };
  if (typeof avoid === "string") out.avoid = avoid;
  if (typeof warning === "string") out.warning = warning;
  return out;
}

function normalizeGuidanceList(v: unknown): DiagnosisGuidance[] | null {
  if (!Array.isArray(v)) return null;
  const out: DiagnosisGuidance[] = [];
  for (const item of v) {
    const g = normalizeDiagnosisGuidance(item);
    if (g) out.push(g);
  }
  return out;
}

function normalizeDiagnosisResult(v: unknown): DiagnosisResult | null {
  if (!isPlainObject(v)) return null;
  const favorable = normalizeGuidanceList(v.favorable);
  const adjustments = normalizeGuidanceList(v.adjustments);
  const priorities = normalizeGuidanceList(v.priorities);
  const insufficientInformation = normalizeGuidanceList(v.insufficientInformation);
  if (!favorable || !adjustments || !priorities || !insufficientInformation) return null;
  if (!Array.isArray(v.trackingPoints)) return null;
  const trackingPoints = v.trackingPoints.filter((t): t is string => typeof t === "string");
  if (typeof v.answersVersion !== "number" || !Number.isFinite(v.answersVersion)) return null;
  const completedAt =
    v.completedAt === null || typeof v.completedAt === "string" ? v.completedAt : null;
  return {
    favorable,
    adjustments,
    priorities,
    insufficientInformation,
    trackingPoints,
    completedAt,
    answersVersion: v.answersVersion,
  };
}

/**
 * Migração e normalização segura do estado salvo.
 * Aceita qualquer entrada (v1, v2, parcial, corrompida). Nunca lança.
 * `guestMode` (se presente no JSON) é descartado — só existe em memória.
 */
export function migrateProtocolState(saved: unknown): ProtocolState {
  try {
    if (!isPlainObject(saved)) return { ...defaultState };
    const days = normalizeDays(saved.days);
    const diagnosis = migrateLegacyDiagnosis(saved.diagnosis);

    return {
      schemaVersion: 2,
      currentDay: normalizeCurrentDay(saved.currentDay),
      plant: normalizePlant(saved.plant),
      diagnosis,
      diagnosisResult: normalizeDiagnosisResult(saved.diagnosisResult),
      diagnosisStatus: normalizeDiagnosisStatus(saved.diagnosisStatus),
      answersVersion: asNumber(saved.answersVersion, 0),
      days,
      applications: normalizeApplications(saved.applications, days),
      finalEval: normalizeFinalEval(saved.finalEval),
      onboarded: asBool(saved.onboarded),
    };
  } catch {
    return { ...defaultState };
  }
}

function serialize(s: ProtocolState): string {
  const { saveError: _omit, ...persisted } = s;
  void _omit;
  return JSON.stringify(persisted);
}

/**
 * Persiste o estado no localStorage e classifica o resultado.
 * Nunca lança. Nunca ignora erros silenciosamente.
 */
export function persistState(nextState: ProtocolState): PersistResult {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return { ok: false, reason: "unavailable" };
    }
    window.localStorage.setItem(STORAGE_KEY, serialize(nextState));
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException) {
      if (err.name === "QuotaExceededError" || err.code === 22) {
        return { ok: false, reason: "quota" };
      }
      return { ok: false, reason: "unavailable" };
    }
    return { ok: false, reason: "unknown" };
  }
}

function loadState(): ProtocolState {
  if (typeof window === "undefined") return { ...defaultState };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      return migrateProtocolState(parsed);
    }
    const legacy = window.localStorage.getItem(LEGACY_KEY_V1);
    if (legacy) {
      const migrated = migrateProtocolState(JSON.parse(legacy));
      // Migração atômica: só remove a chave antiga depois de confirmar
      // a gravação da nova. Se falhar, mantém legado intacto e expõe
      // saveError para a UI.
      const result = persistState(migrated);
      if (result.ok) {
        try {
          window.localStorage.removeItem(LEGACY_KEY_V1);
        } catch {
          /* ignore — dados já foram gravados na chave nova */
        }
      } else {
        migrated.saveError = SAVE_ERROR_MESSAGE;
      }
      return migrated;
    }
    return { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

let listeners: Array<() => void> = [];
let currentState: ProtocolState | null = null;

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function getState(): ProtocolState {
  if (currentState === null) currentState = loadState();
  return currentState;
}

export function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function setState(updater: (s: ProtocolState) => ProtocolState): PersistResult {
  const prev = getState();
  const next = updater(prev);
  const result = persistState(next);
  if (result.ok) {
    currentState = { ...next, saveError: undefined };
  } else {
    // Rollback: preserva estado anterior e expõe o erro para a UI.
    currentState = { ...prev, saveError: SAVE_ERROR_MESSAGE };
  }
  notifyListeners();
  return result;
}

/**
 * Limpa o aviso de erro de salvamento **apenas em memória**.
 * NÃO chama setState nem localStorage.setItem — o erro é transitório.
 */
export function clearSaveError(): void {
  currentState = { ...getState(), saveError: undefined };
  notifyListeners();
}

/** Test-only: reset module state (currentState + listeners). */
export function __resetStoreForTests(): void {
  currentState = null;
  listeners = [];
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useProtocolStore() {
  const [, force] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    currentState = loadState();
    setHydrated(true);
    const unsub = subscribe(() => force((n) => n + 1));
    return unsub;
  }, []);

  const state = hydrated ? getState() : defaultState;

  const updatePlant = useCallback((patch: Partial<PlantInfo>) => {
    setState((s) => ({ ...s, plant: { ...s.plant, ...patch } }));
  }, []);

  const toggleDiagnosis = useCallback((cat: DiagnosisCategory, value: string) => {
    setState((s) => {
      const arr = s.diagnosis[cat];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      const nextStatus: DiagnosisStatus =
        s.diagnosisResult && s.diagnosisStatus !== "none" ? "outdated" : s.diagnosisStatus;
      return {
        ...s,
        diagnosis: { ...s.diagnosis, [cat]: next },
        answersVersion: s.answersVersion + 1,
        diagnosisStatus: nextStatus,
      };
    });
  }, []);

  const saveDiagnosisResult = useCallback(() => {
    setState((s) => {
      const result = computeDiagnosisResult(s.diagnosis, s.answersVersion);
      return { ...s, diagnosisResult: result, diagnosisStatus: "fresh" };
    });
  }, []);

  const updateDay = useCallback((day: number, patch: Partial<DayEntry>) => {
    setState((s) => {
      const existing: DayEntry = s.days[day] ?? { checklist: {}, note: "", completed: false };
      return { ...s, days: { ...s.days, [day]: { ...existing, ...patch } } };
    });
  }, []);

  const toggleChecklist = useCallback((day: number, key: string) => {
    setState((s) => {
      const existing: DayEntry = s.days[day] ?? { checklist: {}, note: "", completed: false };
      const checklist = { ...existing.checklist, [key]: !existing.checklist[key] };
      return { ...s, days: { ...s.days, [day]: { ...existing, checklist } } };
    });
  }, []);

  const toggleDayCompleted = useCallback((day: number) => {
    setState((s) => {
      const existing: DayEntry = s.days[day] ?? { checklist: {}, note: "", completed: false };
      return { ...s, days: { ...s.days, [day]: { ...existing, completed: !existing.completed } } };
    });
  }, []);

  const registerApplication = useCallback((day: number) => {
    setState((s) => {
      const record: ApplicationRecord = { id: newId(), day, timestamp: new Date().toISOString() };
      const existing: DayEntry = s.days[day] ?? { checklist: {}, note: "", completed: false };
      return {
        ...s,
        applications: [...s.applications, record],
        days: { ...s.days, [day]: { ...existing, applicationDone: true } },
      };
    });
  }, []);

  const setCurrentDay = useCallback((day: number) => {
    setState((s) => ({ ...s, currentDay: day }));
  }, []);

  const setOnboarded = useCallback((v: boolean) => {
    setState((s) => ({ ...s, onboarded: v }));
  }, []);

  const updateFinalEval = useCallback((patch: Partial<FinalEvaluation>) => {
    setState((s) => ({ ...s, finalEval: { ...s.finalEval, ...patch } }));
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_KEY_V1);
    } catch {
      /* ignore */
    }
    currentState = { ...defaultState };
    notifyListeners();
  }, []);

  const clearSaveErrorCb = useCallback(() => {
    clearSaveError();
  }, []);

  return {
    state,
    hydrated,
    updatePlant,
    toggleDiagnosis,
    saveDiagnosisResult,
    updateDay,
    toggleChecklist,
    toggleDayCompleted,
    registerApplication,
    setCurrentDay,
    setOnboarded,
    updateFinalEval,
    reset,
    clearSaveError: clearSaveErrorCb,
  };
}