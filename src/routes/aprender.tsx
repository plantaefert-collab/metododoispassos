import { createFileRoute } from "@tanstack/react-router";
import { ProtocoloShell } from "./protocolo-21-dias";

export const Route = createFileRoute("/aprender")({
  head: () => ({
    meta: [
      { title: "Aprender — Guia Prático Orquídeas Floridas" },
      { name: "description", content: "Conhecimento técnico do Método de 2 Passos: Enraizar e Nutrir." },
      { property: "og:title", content: "Aprender — Guia Prático Orquídeas Floridas" },
      { property: "og:description", content: "Conhecimento técnico do Método de 2 Passos: Enraizar e Nutrir." },
    ],
  }),
  component: () => <ProtocoloShell initialTab="aprender" />,
});
