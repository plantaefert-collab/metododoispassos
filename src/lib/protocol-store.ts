import { useState, useCallback, useRef, useEffect } from "react";
import { saveToCache } from "./protocol-cache";

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

export function isDiagnosisCurrent(state: ProtocolState): boolean {
  return (
    state.diagnosisStatus === "fresh" &&
    state.diagnosisResult !== null &&
    state.diagnosisResult.answersVersion === state.answersVersion
  );
}

const DEFAULT_CURRENT_DAY = 1;

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

export const defaultState: ProtocolState = {
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

let listeners: Array<() => void> = [];
let currentState: ProtocolState = { ...defaultState };

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function getState(): ProtocolState {
  return currentState;
}

export function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function setGlobalState(updater: (s: ProtocolState) => ProtocolState): void {
  currentState = updater(currentState);
  notifyListeners();
}

/**
 * Hidrata o store com um estado completo (ex: vindo do cache ou banco).
 * Usado pelo bootstrap controller.
 */
export function hydrateStore(state: ProtocolState): void {
  currentState = { ...state, saveError: undefined };
  notifyListeners();
}

/**
 * Limpa o store para o estado inicial.
 * Usado na troca de conta.
 */
export function clearStore(): void {
  currentState = { ...defaultState };
  notifyListeners();
}

export function useProtocolStore() {
  const [, force] = useState(0);
  
  useEffect(() => {
    return subscribe(() => force((n) => n + 1));
  }, []);

  const state = currentState;

  const wrapSetState = useCallback((updater: (s: ProtocolState) => ProtocolState, actorId: string | "guest") => {
    const next = updater(currentState);
    currentState = next;
    notifyListeners();
    saveToCache(actorId, next);
  }, []);

  const updatePlant = useCallback((patch: Partial<PlantInfo>, actorId: string | "guest") => {
    wrapSetState((s) => ({ ...s, plant: { ...s.plant, ...patch } }), actorId);
  }, [wrapSetState]);

  const toggleDiagnosis = useCallback((cat: DiagnosisCategory, value: string, actorId: string | "guest") => {
    wrapSetState((s) => {
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
    }, actorId);
  }, [wrapSetState]);

  const saveDiagnosisResult = useCallback((actorId: string | "guest") => {
    wrapSetState((s) => {
      const result = computeDiagnosisResult(s.diagnosis, s.answersVersion);
      return { ...s, diagnosisResult: result, diagnosisStatus: "fresh" };
    }, actorId);
  }, [wrapSetState]);

  const updateDay = useCallback((day: number, patch: Partial<DayEntry>, actorId: string | "guest") => {
    wrapSetState((s) => {
      const existing: DayEntry = s.days[day] ?? { checklist: {}, note: "", completed: false };
      return { ...s, days: { ...s.days, [day]: { ...existing, ...patch } } };
    }, actorId);
  }, [wrapSetState]);

  const toggleChecklist = useCallback((day: number, key: string, actorId: string | "guest") => {
    wrapSetState((s) => {
      const existing: DayEntry = s.days[day] ?? { checklist: {}, note: "", completed: false };
      const checklist = { ...existing.checklist, [key]: !existing.checklist[key] };
      return { ...s, days: { ...s.days, [day]: { ...existing, checklist } } };
    }, actorId);
  }, [wrapSetState]);

  const toggleDayCompleted = useCallback((day: number, actorId: string | "guest") => {
    wrapSetState((s) => {
      const existing: DayEntry = s.days[day] ?? { checklist: {}, note: "", completed: false };
      return { ...s, days: { ...s.days, [day]: { ...existing, completed: !existing.completed } } };
    }, actorId);
  }, [wrapSetState]);

  const registerApplication = useCallback((day: number, actorId: string | "guest") => {
    wrapSetState((s) => {
      const record: ApplicationRecord = { 
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, 
        day, 
        timestamp: new Date().toISOString() 
      };
      const existing: DayEntry = s.days[day] ?? { checklist: {}, note: "", completed: false };
      return {
        ...s,
        applications: [...s.applications, record],
        days: { ...s.days, [day]: { ...existing, applicationDone: true } },
      };
    }, actorId);
  }, [wrapSetState]);

  const setCurrentDay = useCallback((day: number, actorId: string | "guest") => {
    wrapSetState((s) => ({ ...s, currentDay: day }), actorId);
  }, [wrapSetState]);

  const setOnboarded = useCallback((v: boolean, actorId: string | "guest") => {
    wrapSetState((s) => ({ ...s, onboarded: v }), actorId);
  }, [wrapSetState]);

  const updateFinalEval = useCallback((patch: Partial<FinalEvaluation>, actorId: string | "guest") => {
    wrapSetState((s) => ({ ...s, finalEval: { ...s.finalEval, ...patch } }), actorId);
  }, [wrapSetState]);

  return {
    state,
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
  };
}
