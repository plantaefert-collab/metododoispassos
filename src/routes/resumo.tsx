import { createFileRoute } from "@tanstack/react-router";
import { ProtocoloShell } from "./protocolo-21-dias";

export const Route = createFileRoute("/resumo")({
  head: () => ({
    meta: [
      { title: "Resumo — Guia Prático Orquídeas Floridas" },
      { name: "description", content: "Resumo do seu progresso no plano de 21 dias." },
      { property: "og:title", content: "Resumo — Guia Prático Orquídeas Floridas" },
      { property: "og:description", content: "Resumo do seu progresso no plano de 21 dias." },
    ],
  }),
  component: () => <ProtocoloShell initialTab="resumo" />,
});
