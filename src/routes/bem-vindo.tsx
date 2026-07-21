import { createFileRoute, redirect } from "@tanstack/react-router";

// Caminho dedicado para a tela de boas-vindas.
// A WelcomeScreen é renderizada dentro de /protocolo-21-dias quando o
// usuário está signed_out, então este alias apenas encaminha para lá.
export const Route = createFileRoute("/bem-vindo")({
  beforeLoad: () => {
    throw redirect({ to: "/protocolo-21-dias" });
  },
  component: () => null,
});
