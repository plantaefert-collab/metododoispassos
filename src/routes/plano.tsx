import { createFileRoute } from "@tanstack/react-router";
import { ProtocoloShell } from "./protocolo-21-dias";

export const Route = createFileRoute("/plano")({
  head: () => ({
    meta: [
      { title: "Plano — Guia Prático Orquídeas Floridas" },
      { name: "description", content: "Plano guiado dia a dia para diagnosticar, enraizar e nutrir sua orquídea." },
      { property: "og:title", content: "Plano — Guia Prático Orquídeas Floridas" },
      { property: "og:description", content: "Plano guiado dia a dia para diagnosticar, enraizar e nutrir sua orquídea." },
    ],
  }),
  component: () => <ProtocoloShell initialTab="plano" />,
});
