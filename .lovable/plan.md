## Escopo

Refatoração funcional profunda do app **sem tocar visualmente na tela de boas-vindas** e sem publicar. Persistência continua 100% local (localStorage). Nenhum Supabase/backend.

## Arquivos

**Alterar**
- `src/lib/protocol-store.ts` — novo schema, migração versionada, ações de diagnóstico/resultado/aplicações, compressão de fotos, guestMode em memória.
- `src/routes/protocolo-21-dias.tsx` — fluxo de onboarding em 3 passos, novas etapas do diagnóstico (5), tela de resultado, integração no painel, aplicações com histórico, toggle de conclusão, aria-*, focus trap básico.
- `src/routes/__root.tsx` — `lang="pt-BR"`, 404/erro em português.

**Criar**
- `src/lib/diagnosis-matrix.ts` — todas as alternativas + matriz de classificação (favorable/adjustment/priority/insufficient) com título, explicação, ação, tracking, avoid e warning quando aplicável.
- `src/lib/image-compress.ts` — canvas resize (max 1280 px), JPEG q≈0.78, tratamento de erro/quota.

## Modelo de estado (v2)

```ts
schemaVersion: 2
onboarded: boolean
guestMode: never persistido (memória)
plant: PlantInfo
diagnosis: {
  roots, leaves, environment,
  potAndSubstrate, wateringAndRoutine: string[]
}
diagnosisStatus: "not_started" | "in_progress" | "completed" | "outdated"
diagnosisAnswersVersion: number
diagnosisResult: DiagnosisResult | null
days: Record<number, DayEntry>  // agora com applications: ApplicationRecord[]
finalEval, currentDay
```

## Migração (v1 → v2)

`migrateProtocolState(saved)`:
- Se `schemaVersion` ausente: assumir v1.
- Copiar `roots/leaves/environment` como estão.
- Dividir `routine` antigo: itens de água acumulada/substrato/vaso → `potAndSubstrate`; demais → `wateringAndRoutine`.
- Criar `diagnosisStatus="not_started"`, `diagnosisAnswersVersion=0`, `diagnosisResult=null` se ausentes.
- `days[n].applicationDone: true` → sintetiza um `ApplicationRecord` com `completedAt` desconhecido (marcado como "registro anterior").
- Preservar plant, fotos, notas, finalEval, currentDay.
- Nunca lança; em erro retorna estado seguro mesclado com default.

## Regras de invalidação

Ao togglar uma alternativa:
1. `diagnosisAnswersVersion++`
2. Se havia `completed`, muda para `outdated` (mantém `diagnosisResult` para leitura interna, mas UI mostra banner).
3. Painel e "Meu plano" trocam o card "Seus pontos para acompanhar" pelo card "Seu diagnóstico foi alterado" com CTA **ATUALIZAR DIAGNÓSTICO**.

Ao concluir novamente: recomputa via matriz, seta `completed`, `completedAt`, atualiza `answersVersion` para o valor atual.

## Fluxos de tela

- **Boas-vindas (inalterada visualmente)**: "COMEÇAR MEU PLANO" → Cadastro (Passo 1/3). "Explorar o conteúdo" → seta `guestMode=true` (memória), abre aba Aprender; refresh volta para boas-vindas. Botão claro "Começar meu plano" visível no header em modo visitante.
- **Cadastro** Passo 1/3.
- **Diagnóstico** Passo 2/3 com 5 etapas + aviso educativo quando etapa vazia (não bloqueia).
- **Resultado** Passo 3/3: cabeçalho + 5 blocos (prioritárias aberto, ajustes/favoráveis/insuficientes em accordion) + CTA "COMEÇAR O PLANO DE 21 DIAS" no topo e no rodapé.
- **Painel/Meu plano**: card "Seus pontos para acompanhar" (3–5, derivados de `trackingPoints`) com link **VER ORIENTAÇÕES COMPLETAS** → reabre a tela de resultado.
- **Dia**: `CONCLUIR TAREFA` ↔ `TAREFA CONCLUÍDA` + ação `DESMARCAR CONCLUSÃO`. Sem apagar checklist/nota/aplicações.
- **Aplicações**: histórico com data/hora, cooldown de 10 s contra duplo clique, exibe último registro.

## Fotos

- `compressImage(file)`: redimensiona lado maior a 1280 px, JPEG 0.78; falha → mensagem "Não foi possível salvar esta fotografia no navegador. Tente utilizar uma imagem menor."
- Estado "processando" durante o resize.
- Captura `QuotaExceededError` ao salvar e reverte a foto sem afetar outros campos.

## Conteúdo

- Substituição de frases categóricas por linguagem educativa conforme item 17.
- Nomes de produtos mantidos + comentário `[VALIDAR COM A PLANTAEFERT]`.
- Cabeçalho textual/ícone botânico mantidos + comentário sobre logotipo oficial.

## Acessibilidade

- `<html lang="pt-BR">`, 404/erro traduzidos.
- `id`/`htmlFor` em todos os inputs.
- `aria-pressed` nas alternativas, `aria-current="step"` na progress, `role="dialog" aria-modal="true"` no drawer do Método de 2 Passos, Escape fecha, foco retorna ao trigger.
- `aria-label` em botões só-ícone; `focus-visible` global no CSS já existente.
- Alvos ≥44 px, textos essenciais ≥12 px.

## Preservação

Boas-vindas (imagem, tipografia, paleta, espaçamentos, cards, selo, CTAs, responsividade 360/390/430) permanece byte-a-byte no JSX. Nenhuma classe/token/asset dela é alterado. Rotas e redirecionamento `/` → `/protocolo-21-dias` preservados. Nenhum dado antigo do localStorage é apagado — apenas migrado.

## Verificação

- `tsgo` limpo.
- Playwright headless: 360/390/430 — sem scroll horizontal em boas-vindas, cadastro, diagnóstico, resultado, painel.
- Testes manuais dos 5 fluxos descritos no pedido.

## Fora de escopo

- Redesenho visual das telas internas (aguarda próxima etapa).
- Publicação.
- Backend / Supabase / auth.
- Novo logotipo ou novas embalagens.
