import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { setGuestActive } from "@/lib/protocol-cache";

export const Route = createFileRoute("/bem-vindo")({
  head: () => ({
    meta: [
      { title: "Bem-vindo — Guia Prático Orquídeas Floridas" },
      {
        name: "description",
        content:
          "Comece seu plano guiado de 21 dias para orquídeas floridas: diagnóstico, cuidados e acompanhamento em um só lugar.",
      },
      { property: "og:title", content: "Bem-vindo — Guia Prático Orquídeas Floridas" },
      {
        property: "og:description",
        content:
          "Comece seu plano guiado de 21 dias para orquídeas floridas: diagnóstico, cuidados e acompanhamento em um só lugar.",
      },
    ],
  }),
  component: BemVindoPage,
});

function BemVindoPage() {
  const navigate = useNavigate();
  return (
    <WelcomeScreen
      onStart={() => navigate({ to: "/protocolo-21-dias" })}
      onExplore={() => {
        setGuestActive(true);
        navigate({ to: "/protocolo-21-dias" });
      }}
      onRegisterOrchid={() => navigate({ to: "/protocolo-21-dias" })}
    />
  );
}
