import { createFileRoute } from "@tanstack/react-router";
import { ProtocoloShell } from "./protocolo-21-dias";

export const Route = createFileRoute("/metodo")({
  head: () => ({
    meta: [
      { title: "Método 2 Passos — Guia Prático Orquídeas Floridas" },
      { name: "description", content: "Conheça o método de 2 passos: Enraizar e Nutrir." },
      { property: "og:title", content: "Método 2 Passos — Guia Prático Orquídeas Floridas" },
      { property: "og:description", content: "Conheça o método de 2 passos: Enraizar e Nutrir." },
    ],
  }),
  component: () => <ProtocoloShell initialTab="metodo" />,
});
