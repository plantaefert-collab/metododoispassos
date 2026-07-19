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

function migrateFromV1(v1: Record<string, unknown>): ProtocolState {
  // v1 usava chaves: roots, leaves, environment, routine (mapeada para wateringAndRoutine).
  const oldDiag = (v1.diagnosis as Record<string, string[]> | undefined) ?? {};
  const diagnosis: DiagnosisAnswers = {
    roots: [],
    leaves: [],
    environment: [],
    potAndSubstrate: [],
    wateringAndRoutine: oldDiag.routine ?? [],
  };
  return {
    ...defaultState,
    ...(v1 as Partial<ProtocolState>),
    schemaVersion: 2,
    diagnosis,
    diagnosisResult: null,
    diagnosisStatus: "none",
    answersVersion: 0,
    applications: [],
  };
}

function loadState(): ProtocolState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProtocolState> & { schemaVersion?: number };
      if (parsed.schemaVersion === 2) {
        return { ...defaultState, ...parsed, diagnosis: { ...emptyDiag, ...(parsed.diagnosis ?? {}) } };
      }
      // Versão desconhecida — descarta e usa default.
      return defaultState;
    }
    const legacy = window.localStorage.getItem(LEGACY_KEY_V1);
    if (legacy) {
      const migrated = migrateFromV1(JSON.parse(legacy));
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        window.localStorage.removeItem(LEGACY_KEY_V1);
      } catch {
        /* ignore */
      }
      return migrated;
    }
    return defaultState;
  } catch {
    return defaultState;
  }
}

let listeners: Array<() => void> = [];
let currentState: ProtocolState | null = null;

function getState(): ProtocolState {
  if (currentState === null) currentState = loadState();
  return currentState;
}

function setState(updater: (s: ProtocolState) => ProtocolState) {
  currentState = updater(getState());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
  } catch {
    /* quota exceeded — ignora silenciosamente */
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
  };
}