import { useEffect, useState, useCallback } from "react";

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

export type Diagnosis = {
  roots: string[];
  leaves: string[];
  environment: string[];
  routine: string[];
};

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

export type ProtocolState = {
  currentDay: number;
  plant: PlantInfo;
  diagnosis: Diagnosis;
  days: Record<number, DayEntry>;
  finalEval: FinalEvaluation;
  onboarded: boolean;
};

const STORAGE_KEY = "plantaefert-protocolo-21d-v1";

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

const emptyDiag: Diagnosis = { roots: [], leaves: [], environment: [], routine: [] };

const defaultState: ProtocolState = {
  currentDay: 3,
  plant: emptyPlant,
  diagnosis: emptyDiag,
  days: {},
  finalEval: { improved: "", same: "", attention: "", keep: "", path: "" },
  onboarded: false,
};

function loadState(): ProtocolState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
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
    /* ignore quota */
  }
  listeners.forEach((l) => l());
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

  const toggleDiagnosis = useCallback((cat: keyof Diagnosis, value: string) => {
    setState((s) => {
      const arr = s.diagnosis[cat];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...s, diagnosis: { ...s.diagnosis, [cat]: next } };
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
    updateDay,
    toggleChecklist,
    setCurrentDay,
    setOnboarded,
    updateFinalEval,
    reset,
  };
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}