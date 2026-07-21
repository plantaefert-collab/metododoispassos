import { createFileRoute } from "@tanstack/react-router";
import { ProtocoloShell } from "./protocolo-21-dias";

export const Route = createFileRoute("/diario")({
  head: () => ({
    meta: [
      { title: "Diário — Guia Prático Orquídeas Floridas" },
      { name: "description", content: "Registre observações, fotos e a evolução da sua orquídea a cada dia." },
      { property: "og:title", content: "Diário — Guia Prático Orquídeas Floridas" },
      { property: "og:description", content: "Registre observações, fotos e a evolução da sua orquídea a cada dia." },
    ],
  }),
  component: () => <ProtocoloShell initialTab="diario" />,
});
