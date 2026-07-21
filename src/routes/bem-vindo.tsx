import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
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
  useEffect(() => {
    try {
      localStorage.setItem("pf_welcomed", "1");
    } catch {}
  }, []);
  return (
    <WelcomeScreen
      onStart={() => navigate({ to: "/diagnostico" })}
      onExplore={() => {
        setGuestActive(true);
        navigate({ to: "/inicio" });
      }}
      onRegisterOrchid={() => navigate({ to: "/minha-orquidea" })}
    />
  );
}
