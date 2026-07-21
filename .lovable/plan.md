## Objetivo

Criar uma tela dedicada **"Minha Orquídea"** que combine em um único lugar:
1. O **cadastro da planta** (nome, espécie, local, vaso, substrato, dificuldade, foto) — salvo localmente no navegador e sincronizado com a conta quando logado.
2. Um **resumo do progresso** no protocolo de 21 dias (dia atual, % concluído, aplicações, observações, fotos, status do diagnóstico).

## Escopo

### Nova rota
- `src/routes/minha-orquidea.tsx` → renderiza `ProtocoloShell` com `initialTab="orquidea"`.
- Head meta próprio (title, description, og:title, og:description).

### Alterações em `src/routes/protocolo-21-dias.tsx`
- Adicionar `"orquidea"` ao tipo `Tab` e ao mapeamento `TAB_TO_PATH` (→ `/minha-orquidea`).
- Renderizar `<MinhaOrquideaTab />` quando `tab === "orquidea"`.
- Adicionar botão no menu inferior: mudar `grid-cols-5` para `grid-cols-6` e inserir `TabBtn` com ícone `Flower2` e label "Orquídea", logo após "Início".
- Criar componente `MinhaOrquideaTab` ao final do arquivo, reutilizando componentes existentes (`Field`, `SelectField`, `StatCard`) e helpers já disponíveis (`useProtocolStore`, `updatePlant`, `compressImage`, `registerPlantRemote`, `isDiagnosisCurrent`).

### Estrutura visual do `MinhaOrquideaTab`
1. **Cabeçalho de identidade** — foto/avatar da planta + nome + espécie.
2. **Bloco de progresso** — barra animada de %, 4 `StatCard`s (dias, aplicações, observações, fotos), indicador do diagnóstico (Atualizado/Pendente), CTAs "Ver meu plano" e "Ver resumo completo".
3. **Bloco de cadastro** — formulário com todos os campos do `plant` (nome, espécie + "não sei", local, vaso, substrato, dificuldade, foto com upload comprimido), botão "Salvar cadastro" que chama `registerPlantRemote` quando logado.

## Persistência

- Atualizações usam `updatePlant()`, que já persiste no cache local e sincroniza com `protocol_progress` na nuvem (quando `actorId !== "guest"`).
- Botão "Salvar cadastro" chama `registerPlantRemote()` para gravar os campos em `profiles` no Supabase. Sem novas tabelas, migrations ou policies — schema atual já cobre todos os campos.

## Fora de escopo

- Alterar a Home (`/`) para linkar até a nova tela.
- Novas migrations, RLS ou colunas.
- Testes automatizados.

## Verificação

1. Navegar para `/minha-orquidea` e ver o cadastro + resumo.
2. Alternar entre abas pelo menu inferior e confirmar sincronização URL ↔ aba.
3. Editar um campo → confirmar cache local e (logado) sincronização com Supabase.
4. Confirmar sem erros de TypeScript.
