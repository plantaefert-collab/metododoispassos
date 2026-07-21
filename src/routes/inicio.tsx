import { createFileRoute } from "@tanstack/react-router";
import { ProtocoloShell } from "./protocolo-21-dias";

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Início — Guia Prático Orquídeas Floridas" },
      { name: "description", content: "Foco do dia, próximo passo e progresso do seu plano de 21 dias." },
      { property: "og:title", content: "Início — Guia Prático Orquídeas Floridas" },
      { property: "og:description", content: "Foco do dia, próximo passo e progresso do seu plano de 21 dias." },
    ],
  }),
  component: () => <ProtocoloShell initialTab="inicio" />,
});
