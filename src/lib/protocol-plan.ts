import { EDITORIAL_PLAN } from "./editorial-plan";

export type ProtocolPhase = {
  id: string;
  title: string;
  range: string;
  description: string;
};

export type RegisterOption = {
  value: string;
  label: string;
};

export type EditorialSection = {
  title: string;
  text?: string;
  items?: string[];
};

export type DayStage = {
  id: string;
  title: string;
  objective?: string;
  mainAction?: string;
  howTo?: string[];
  observe?: string[];
  avoid?: string[];
  registerText?: string;
  registerOptions?: RegisterOption[];
  tip?: string;
  attention?: string[];
};

export type ProtocolDay = {
  day: number;
  phase: 1 | 2 | 3;
  title: string;
  objective: string;
  mainAction: string;
  observeTitle?: string;
  stages?: DayStage[];
  howTo?: string[];
  observe?: string[];
  avoid?: string[];
  registerText?: string;
  registerOptions?: RegisterOption[];
  recordPrompt: string;
  tip?: string;
  attention?: string[];
  personalizedContext?: boolean;
  checklist: string[];
  isApplicationDay?: boolean;
  requiresPhoto?: boolean;
  evaluationType?: "first" | "intermediate" | "final";
};

export const PROTOCOL_PHASES: ProtocolPhase[] = [
  {
    id: "fase-1",
    title: "FASE 1 — INICIAR, OBSERVAR E COMPREENDER",
    range: "Dias 1 a 7",
    description:
      "Conhecer a orquídea, registrar o ponto de partida, iniciar o Método de 2 Passos e aprender a observar raízes, folhas, rega, vaso e substrato.",
  },
  {
    id: "fase-2",
    title: "FASE 2 — COMPARAR, MANTER E AJUSTAR",
    range: "Dias 8 a 14",
    description:
      "Comparar os registros, acompanhar os pontos do diagnóstico, manter uma rotina simples e corrigir somente o que for necessário.",
  },
  {
    id: "fase-3",
    title: "FASE 3 — CONSOLIDAR, AVALIAR E MANTER",
    range: "Dias 15 a 21",
    description:
      "Reconhecer os cuidados que funcionaram, acompanhar a evolução e definir uma rotina de manutenção depois do plano.",
  },
];

export const PROTOCOL_DAYS: ProtocolDay[] = Object.values(EDITORIAL_PLAN).sort(
  (a, b) => a.day - b.day,
);

export const APPLICATION_DAYS = [1, 7, 14, 21];
export const PHOTO_DAYS = [1, 7, 14, 21];
export const WEEKS: Array<{ id: 1 | 2 | 3; label: string; days: number[] }> = [
  { id: 1, label: "Semana 1", days: [1, 2, 3, 4, 5, 6, 7] },
  { id: 2, label: "Semana 2", days: [8, 9, 10, 11, 12, 13, 14] },
  { id: 3, label: "Semana 3", days: [15, 16, 17, 18, 19, 20, 21] },
];

export function getProtocolDay(day: number): ProtocolDay {
  const normalized = Math.max(1, Math.min(21, Math.floor(day)));
  return EDITORIAL_PLAN[normalized] || EDITORIAL_PLAN[1];
}

export function getProtocolPhase(day: number): ProtocolPhase {
  const d = getProtocolDay(day);
  return PROTOCOL_PHASES[d.phase - 1];
}

export function getWeekForDay(day: number): 1 | 2 | 3 {
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  return 3;
}

// ============================================================
// Sincronização Diagnóstico ↔ Protocolo
// ============================================================
import type { DiagnosisCategory, DiagnosisGuidance } from "./diagnosis-matrix";

/**
 * Dias do protocolo que naturalmente abordam cada categoria do diagnóstico.
 * Usado para destacar dias de "foco" quando a orquídea apresenta sinais
 * naquela categoria.
 */
export const CATEGORY_FOCUS_DAYS: Record<DiagnosisCategory, number[]> = {
  roots: [3, 10, 17],
  leaves: [2, 12, 19],
  environment: [5, 15],
  potAndSubstrate: [3, 10, 17],
  wateringAndRoutine: [4, 6, 11, 13, 18, 20],
};

/** Deriva as 1–2 categorias mais afetadas a partir do resultado do diagnóstico. */
export function getFocusCategories(
  result: { priorities: DiagnosisGuidance[]; adjustments: DiagnosisGuidance[] } | null | undefined,
): DiagnosisCategory[] {
  if (!result) return [];
  const counts = new Map<DiagnosisCategory, number>();
  const bump = (g: DiagnosisGuidance, w: number) =>
    counts.set(g.category, (counts.get(g.category) ?? 0) + w);
  result.priorities.forEach((g) => bump(g, 2));
  result.adjustments.forEach((g) => bump(g, 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([c]) => c);
}

/** Conjunto de dias do plano em que o usuário deve focar, dado o diagnóstico. */
export function getFocusDays(categories: DiagnosisCategory[]): number[] {
  const set = new Set<number>();
  categories.forEach((c) => CATEGORY_FOCUS_DAYS[c]?.forEach((d) => set.add(d)));
  return [...set].sort((a, b) => a - b);
}
