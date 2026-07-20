## Causa raiz

O erro **409 Conflict** não vem do `UPDATE` em `profiles` (isso é `plant_registered_at`), vem do `upsert` em `protocol_progress` que dispara logo em seguida, no mesmo salvamento do onboarding.

A tabela `protocol_progress` tem duas restrições únicas:

- `PRIMARY KEY (id)`
- `UNIQUE (user_id)` ← e o trigger `handle_new_user` já criou uma linha nessa chave para todo usuário novo

O código atual em `src/lib/protocol-cloud.ts` chama:

```ts
supabase.from("protocol_progress").upsert({ user_id, ... })
```

Sem `onConflict`, o PostgREST resolve o conflito pela PK (`id`). Como não enviamos `id`, ele tenta um `INSERT` novo, colide com a linha já existente pela `UNIQUE(user_id)` e devolve **409**. O `UPDATE` do perfil funciona; a UI só não avança porque o `Promise.all`/sequência de sync quebra no progresso.

## Correção

Arquivo único: `src/lib/protocol-cloud.ts`

- Em `saveProgressRemote`, trocar `.upsert({...})` por `.upsert({...}, { onConflict: "user_id" })` para que o `ON CONFLICT` alvo seja a chave única correta.

Nada mais precisa mudar — a linha já existe (criada pelo trigger), então o upsert vira `UPDATE` limpo e o fluxo Cadastro → Início destrava.

## Verificação

1. Rodar o onboarding no preview autenticado e confirmar avanço para a aba Início.
2. Conferir no console/network que `PATCH /protocol_progress` retorna 200/204 (não 409).
