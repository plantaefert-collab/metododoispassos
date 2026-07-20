import { ProtocolDay } from "./protocol-plan";

export const EDITORIAL_PLAN: Record<number, ProtocolDay> = {
  1: {
    day: 1,
    phase: 1,
    title: "Diagnóstico e início do protocolo",
    objective: "Registrar o ponto de partida, compreender as condições da planta e iniciar o Método de 2 Passos quando a aplicação estiver indicada.",
    mainAction: "Registrar orquídea, realizar diagnóstico e primeira aplicação.",
    howTo: [
      "Fotografe a planta inteira, folhas e raízes em ambiente claro.",
      "Marque sinais nas raízes, folhas, ambiente, vaso, substrato e rega.",
      "Avalie luz, ventilação, drenagem e substrato.",
      "Realize o Método de 2 Passos."
    ],
    observe: [
      "Firmeza e coloração das folhas",
      "Raízes visíveis",
      "Sinais favoráveis ou pontos de ajuste"
    ],
    avoid: [
      "Filtros em fotos",
      "Marcar respostas por suposição",
      "Trocar vaso ou substrato por impulso",
      "Aplicar diretamente nas flores"
    ],
    checklist: [
      "Registrei a orquídea",
      "Fiz o diagnóstico",
      "Avaliei ambiente e substrato",
      "Realizei o Passo 1 (Enraizar)",
      "Realizei o Passo 2 (Nutrir)"
    ],
    recordPrompt: "Registre nome, espécie (se souber), local, tipo de vaso e substrato.",
    isApplicationDay: true,
    requiresPhoto: true,
  },
  // Add other days similarly
};
