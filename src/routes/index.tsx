/**
 * Chat, outro ponto é que assim, a pessoa que já fez o login, já fez o diagnóstico, após ela fazer o login novamente, ela tem que ser dire-e-redirecionada para a página de início e não pra fazer o diagnóstico novamente. 
 * 
 * Podemos colocar um, uma sessão no início pra que ela faça o diagnóstico novamente. O que você acha? 
 * 
 * Me dê opções. 
 * 
 * Me explique como ficará esse fluxo
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/protocolo-21-dias" });
  },
  component: () => null,
});
