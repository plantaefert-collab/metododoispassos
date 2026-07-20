/**
 * Chat, após clicar em "Salvar e fazer diagnóstico" no passo um, cadastro da orquídea, 
 * ocorre um erro e não somos direcionados para a página inicial, para o início. Conserte isso
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/protocolo-21-dias" });
  },
  component: () => null,
});