/**
 * Chat, queremos que o fluxo correto fique assim: página de boas-vindas, login, início e na página de início fique o card com diagnóstico. E o diagnóstico passa a não ser mais obrigatório. Então não preci-- não precisamos mais direcionar o usuário para o cadastro da orquídea
 *
 * 1. Boas-vindas — usuário deslogado vê o método dos 2 passos (Enraizar + Nutrir).
 * 2. Login — AuthScreen com e-mail/senha e Google.
 * 3. Início + Card de Diagnóstico
 *
 * Chat, o diagnóstico passa a não ser mais obrigatório. Ele é apenas opcional
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/protocolo-21-dias" });
  },
  component: () => null,
});