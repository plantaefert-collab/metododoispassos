import { useEffect, useState, useCallback } from "react";
import {
  computeDiagnosisResult,
  type DiagnosisAnswers,
  type DiagnosisCategory,
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
  timestamp: string;
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

const STORAGE_KEY = "plantaefert-protocolo-21d";
const LEGACY_KEY_V1 = "plantaefert-protocolo-21d-v1";

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
  currentDay: 3,
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

function normalizeDiagnosis(v: unknown, legacyRoutine?: unknown): DiagnosisAnswers {
  const o = isPlainObject(v) ? v : {};
  return {
    roots: asStringArray(o.roots),
    leaves: asStringArray(o.leaves),
    environment: asStringArray(o.environment),
    // v1 → v2: campo "routine" foi renomeado para "wateringAndRoutine".
    potAndSubstrate: asStringArray(o.potAndSubstrate),
    wateringAndRoutine: asStringArray(
      o.wateringAndRoutine ?? o.routine ?? legacyRoutine,
    ),
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
    if (!Number.isFinite(n)) continue;
    out[n] = normalizeDayEntry(val);
  }
  return out;
}

function normalizeApplications(v: unknown, days: Record<number, DayEntry>): ApplicationRecord[] {
  if (Array.isArray(v)) {
    return v
      .map((r): ApplicationRecord | null => {
        if (!isPlainObject(r)) return null;
        const day = asNumber(r.day, NaN);
        if (!Number.isFinite(day)) return null;
        return {
          id: asString(r.id) || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          day,
          timestamp: asString(r.timestamp, new Date(0).toISOString()),
        };
      })
      .filter((x): x is ApplicationRecord => x !== null);
  }
  // Sintetiza registros a partir de days[n].applicationDone (migração v1).
  const synthesized: ApplicationRecord[] = [];
  for (const [k, entry] of Object.entries(days)) {
    if (entry.applicationDone) {
      synthesized.push({
        id: `legacy-${k}`,
        day: Number(k),
        timestamp: new Date(0).toISOString(),
      });
    }
  }
  return synthesized;
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

function normalizeDiagnosisResult(v: unknown): DiagnosisResult | null {
  // Confiamos no shape gravado; se estiver corrompido, retornamos null e
  // o usuário reabre o diagnóstico para reprocessar.
  if (!isPlainObject(v)) return null;
  if (!Array.isArray(v.priorities) || !Array.isArray(v.adjustments)) return null;
  return v as unknown as DiagnosisResult;
}

/**
 * Migração e normalização segura do estado salvo.
 * Aceita qualquer entrada (v1, v2, parcial, corrompida) e retorna um
 * ProtocolState válido, preservando o máximo possível dos dados do usuário.
 * Nunca lança.
 */
export function migrateProtocolState(saved: unknown): ProtocolState {
  try {
    if (!isPlainObject(saved)) return { ...defaultState };
    const version = asNumber(saved.schemaVersion, 1);
    const legacyRoutine =
      version < 2 && isPlainObject(saved.diagnosis)
        ? (saved.diagnosis as Record<string, unknown>).routine
        : undefined;

    const days = normalizeDays(saved.days);
    const diagnosis = normalizeDiagnosis(saved.diagnosis, legacyRoutine);

    return {
      schemaVersion: 2,
      currentDay: asNumber(saved.currentDay, defaultState.currentDay),
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
      try {
        window.localStorage.setItem(STORAGE_KEY, serialize(migrated));
        window.localStorage.removeItem(LEGACY_KEY_V1);
      } catch {
        /* ignore quota — mantém legado em memória */
      }
      return migrated;
    }
    return { ...defaultState };
  } catch {
    return { ...defaultState };
  }
}

function serialize(s: ProtocolState): string {
  // saveError é transitório — nunca persistido.
  const { saveError: _omit, ...persisted } = s;
  void _omit;
  return JSON.stringify(persisted);
}

let listeners: Array<() => void> = [];
let currentState: ProtocolState | null = null;

function getState(): ProtocolState {
  if (currentState === null) currentState = loadState();
  return currentState;
}

function setState(updater: (s: ProtocolState) => ProtocolState) {
  const prev = getState();
  const next = updater(prev);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, serialize(next));
    }
    currentState = { ...next, saveError: undefined };
  } catch (err) {
    // Persistência falhou (quota, modo privado, storage bloqueado).
    // Reverte estado em memória para o anterior e sinaliza o erro
    // para que a UI possa alertar o usuário e desfazer a ação.
    const message =
      err instanceof DOMException && err.name === "QuotaExceededError"
        ? "quota_exceeded"
        : err instanceof Error
          ? err.message
          : "storage_error";
    currentState = { ...prev, saveError: message };
  }
  listeners.forEach((l) => l());
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
    const listener = () => force((n) => n + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
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
    listeners.forEach((l) => l());
  }, []);

  const clearSaveError = useCallback(() => {
    setState((s) => ({ ...s, saveError: undefined }));
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
    clearSaveError,
  };
}