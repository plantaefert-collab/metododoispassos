import { createFileRoute } from "@tanstack/react-router";
import { ProtocoloShell } from "./protocolo-21-dias";

export const Route = createFileRoute("/diagnostico")({
  head: () => ({
    meta: [
      { title: "Diagnóstico — Guia Prático Orquídeas Floridas" },
      { name: "description", content: "Diagnóstico rápido da sua orquídea para personalizar o plano de 21 dias." },
      { property: "og:title", content: "Diagnóstico — Guia Prático Orquídeas Floridas" },
      { property: "og:description", content: "Diagnóstico rápido da sua orquídea para personalizar o plano de 21 dias." },
    ],
  }),
  component: () => <ProtocoloShell initialTab="diagnostico" />,
});
