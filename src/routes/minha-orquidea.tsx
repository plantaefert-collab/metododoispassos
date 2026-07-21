import { createFileRoute } from "@tanstack/react-router";
import { ProtocoloShell } from "./protocolo-21-dias";

export const Route = createFileRoute("/minha-orquidea")({
  head: () => ({
    meta: [
      { title: "Minha Orquídea — Guia Prático Orquídeas Floridas" },
      { name: "description", content: "Cadastro da sua orquídea e resumo do seu progresso no protocolo de 21 dias." },
      { property: "og:title", content: "Minha Orquídea — PlantaeFert" },
      { property: "og:description", content: "Cadastre sua orquídea e acompanhe seu progresso no protocolo de 21 dias." },
    ],
  }),
  component: () => <ProtocoloShell initialTab="orquidea" />,
});
