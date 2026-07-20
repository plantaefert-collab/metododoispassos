import { EDITORIAL_PLAN } from "./editorial-plan";

export type ProtocolPhase = {
  id: string;
  title: string;
  range: string;
  description: string;
};

export type ProtocolDay = {
  day: number;
  phase: 1 | 2 | 3;
  title: string;
  objective: string;
  mainAction: string;
  howTo: string[];
  observe: string[];
  avoid: string[];
  checklist: string[];
  recordPrompt: string;
  isApplicationDay?: boolean;
  requiresPhoto?: boolean;
  evaluationType?: "first" | "intermediate" | "final";
};

export const PROTOCOL_PHASES: ProtocolPhase[] = [
  {
    id: "fase-1",
    title: "FASE 1 — INICIAR, OBSERVAR E COMPREENDER",
    range: "Dias 1 a 7",
    description: "Conhecer a orquídea, registrar o ponto de partida, iniciar o Método de 2 Passos e aprender a observar raízes, folhas, rega, vaso e substrato.",
  },
  {
    id: "fase-2",
    title: "FASE 2 — COMPARAR, MANTER E AJUSTAR",
    range: "Dias 8 a 14",
    description: "Comparar os registros, acompanhar os pontos do diagnóstico, manter uma rotina simples e corrigir somente o que for necessário.",
  },
  {
    id: "fase-3",
    title: "FASE 3 — CONSOLIDAR, AVALIAR E MANTER",
    range: "Dias 15 a 21",
    description: "Reconhecer os cuidados que funcionaram, acompanhar a evolução e definir uma rotina de manutenção depois do plano.",
  },
];

export const PROTOCOL_DAYS: ProtocolDay[] = Object.values(EDITORIAL_PLAN);

export const APPLICATION_DAYS = [1, 7, 14, 21];
export const PHOTO_DAYS = [1, 7, 14, 21];

export function getProtocolDay(day: number): ProtocolDay {

  const normalized = Math.max(1, Math.min(21, Math.floor(day)));
  return EDITORIAL_PLAN[normalized] || EDITORIAL_PLAN[1];
}

export function getProtocolPhase(day: number): ProtocolPhase {
  const d = getProtocolDay(day);
  return PROTOCOL_PHASES[d.phase - 1];
}
