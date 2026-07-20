## Escopo

Etapa editorial e de UI. Sem novas validações, sem alterar tela de boas-vindas, sem publicar. Transcrição fiel do arquivo `Plano_editorial_21_dias.md` (866 linhas) para uma estrutura TypeScript rica, com adaptações autorizadas para as aplicações dos Dias 1, 7, 14 e 21.

## Arquivos

**Substituir integralmente**

- `src/lib/editorial-plan.ts` — nova estrutura tipada com `stages`, `howTo`, `observe`, `avoid`, `registerText`, `registerOptions`, `tip`, `attention`, `personalizedContext`. Transcrição fiel do arquivo anexado (sem resumir listas, sem substituir orientações).

**Atualizar**

- `src/lib/protocol-plan.ts` — expandir `ProtocolDay` com os campos novos + tipos `EditorialSection`, `RegisterOption`, `DayStage`. `APPLICATION_DAYS = [1, 7, 14, 21]`, `PHOTO_DAYS = [1, 7, 14, 21]` (já corretos).
- `src/routes/protocolo-21-dias.tsx`:
  - Remover navegação horizontal contínua dos 21 dias.
  - Adicionar seletor de semana (Semana 1/2/3) + grade responsiva de 7 dias (4+3 em 320 px), sem scroll horizontal, destacando dia atual e discretamente dias de aplicação.
  - Renderizar tela do dia com: cabeçalho (Dia, Fase, Título), Objetivo, O que fazer, Dica, Checklist, campo/opções de registro (usando `recordPrompt` e `registerOptions`).
  - Acordeões (`Accordion` shadcn já disponível) para: Como fazer, Observe, Evite, Registre, Atenção, No seu caso.
  - Dia 1: renderizar as 4 etapas (`stages`) como acordeões independentes.
  - Método de 2 Passos: novo conteúdo oficial (texto integral abaixo), exibido nos Dias 1, 7, 14 e 21. Remover `ProductPlaceholder` e frases "Inserir imagem real do produto", "Sem indicação de quantidade nesta versão.", "Siga sempre o rótulo do produto.".
  - Textos de demonstração renomeados ("Explorar dias do plano", "Escolha uma semana e um dia para consultar", "Reiniciar meu plano") + `aria-label` atualizados.
  - Bloco "No seu caso": acordeão exibindo até 3 `trackingPoints` quando diagnóstico atual; aviso curto + CTA quando `outdated`.

**Não alterar**

- `WelcomeScreen`, imagem, textos, cards, CTAs da boas-vindas.
- `protocol-store.ts` além do mínimo indispensável (armazenar `registerValue` estruturado do dia, se necessário — reaproveitar o `note` existente).
- Testes existentes; nenhum novo teste editorial.

## Adaptações editoriais autorizadas

- **Dia 1**: 4 stages independentes (Registrar, Diagnóstico guiado, Ambiente/vaso/substrato, Primeira aplicação). Preserva todos os textos do arquivo por etapa.
- **Dia 7**: título "Primeira avaliação e segunda aplicação"; conteúdo integral da avaliação + seção "Segunda aplicação" com ordem editorial (fotografar → comparar → registrar → conferir → Método 2 Passos → registrar aplicação).
- **Dia 10**: título "Acompanhar a resposta e revisar a rotina" + conteúdo novo (transcrito do prompt), **sem aplicação**.
- **Dia 14**: título "Avaliação intermediária e terceira aplicação"; avaliação intermediária integral + seção "Terceira aplicação".
- **Dia 16**: título "Revisar as condições antes da fase final" + conteúdo novo (transcrito do prompt), sem preparação de aplicação.
- **Dia 17**: título "Comparar novamente as raízes" + conteúdo novo, **`isApplicationDay: false`**.
- **Dia 18**: preserva tema "Observar sem interferir"; remove qualquer menção a "após a última aplicação" / "aplicação do Dia 17".
- **Dia 21**: título "Avaliação final, próximo caminho e quarta aplicação" + conteúdo integral da avaliação final + seção "Quarta aplicação" (usar "Quarta aplicação do plano", nunca "aplicação de manutenção").
- Demais dias (2–6, 8, 9, 11–13, 15, 19, 20): transcrição fiel do arquivo, sem resumo.

## Método de 2 Passos (conteúdo oficial)

Título, introdução, Passo 1 (Enraizar), Passo 2 (Nutrir) e lista de "Cuidados" exatamente conforme o prompt. Frequência: "Uma vez por semana." Componente sem placeholder de imagem: apenas ícone + nome da etapa + nome do produto + texto educativo.

## Navegação por semanas

```text
[ Semana 1 ] [ Semana 2 ] [ Semana 3 ]
[ 1 ][ 2 ][ 3 ][ 4 ]
[ 5 ][ 6 ][ 7 ]
```

Sem rolagem horizontal. Botões ≥44 px. Dia atual em destaque; dias de aplicação com marcador discreto (ponto magenta). Trocar de semana não muda `currentDay`.

## Acordeões

Componente `@/components/ui/accordion` (Radix) já disponível — usar `type="multiple"`. Títulos exatos: "Como fazer", "Observe", "Evite", "Registre", "Atenção", "No seu caso". Renderizados apenas quando o dado existe.

## Verificação

- `bunx tsgo --noEmit`, `bun run lint`, `bun run build`.
- Inspeção visual em 360 px (sem scroll horizontal, textos legíveis).

## Fora de escopo

Bloqueios de aplicação, proteção contra duplicidade, migração v2→v3, novos testes, publicação, alteração da boas-vindas.

## Observação

Esta é uma reescrita grande (≈2500 linhas de conteúdo editorial + refactor de UI). Se aprovar, executo em um único ciclo e reporto typecheck/lint/build reais ao final.
