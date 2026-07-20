/**
 * Chat, é, confirme isso pra mim, pois eu estou sendo direcionado diretamente para o diagnóstico, 
 * 
 * A página inicial tem que ser o método-- aquela página do método onde tem uma imagem de uma raiz e depois fala do, do método dois passos
 * 
 * Chat, antes a gente tinha uma outra página inicial, né? Tinha uma imagem, falava sobre os dois passos, o me-- certo?

 * 
 * Chat, eu quero mudar esse fluxo. Eu quero que esta página de boas-vindas, que fala sobre o método dois passos, seja a página inicial, a pess-- depois vem login, página de login e lá dentro do início, a pessoa-- o primeiro passo tem que ser fazer-- a gente tem que ter uma seção, um card lá dentro do início pra ela fazer o diagnóstico e depois ter acesso ao plano. Como que a gente pode fazer isso?
 * 
 * Qual que é a página inicial do meu aplicativo?
 * Chat, outro ponto é que assim, a pessoa que já fez o login, já fez o diagnóstico, após ela fazer o login novamente, ela tem que ser dire-e-redirecionada para a página de início e não pra fazer o diagnóstico novamente. 


 * Chat, outro ponto é que assim, a pessoa que já fez o login, já fez o diagnóstico, após ela fazer o login novamente, ela tem que ser dire-e-redirecionada para a página de início e não pra fazer o diagnóstico novamente. 

 * 
 * Podemos colocar um, uma sessão no início pra que ela faça o diagnóstico novamente. O que você acha? 
 * 
 * Me dê opções. 
 * 
 * Me explique como ficará esse fluxo
 * 
 * Adicionar um teste automatizado no Playwright para confirmar que, após salvar a orquídea, eu avanço sempre para a tela Início e recebo status 2xx no PATCH /protocol_progress.
 * Implementar um teste automatizado no Playwright para confirmar que, após salvar a orquídea, eu sempre avanço para a tela Início e recebo status 2xx no PATCH /protocol_progress.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/protocolo-21-dias" });
  },
  component: () => null,
});
