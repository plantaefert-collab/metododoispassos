## Plano de correção

1. Corrigir o salvamento do resultado ao finalizar o diagnóstico
- Garantir que, ao clicar em “Ver resultado”, o resultado recém-gerado seja renderizado imediatamente na tela seguinte.
- Evitar que a tela leia uma versão antiga do estado no mesmo ciclo de renderização.

2. Blindar a sincronização com o banco
- Ajustar o carregamento remoto para não sobrescrever um diagnóstico local recém-criado com `diagnosis_result: null` vindo do banco.
- Normalizar o resultado recebido do banco antes de aplicar no estado, preservando `diagnosisStatus` e `answersVersion` corretamente.
- Após salvar o diagnóstico, sincronizar também as respostas e a versão das respostas, não apenas o objeto `diagnosisResult`.

3. Corrigir a mensagem incorreta
- Trocar a lógica da tela de resultado para nunca mostrar “Nenhum diagnóstico encontrado” quando houver respostas marcadas ou quando um resultado acabou de ser gerado.
- Se o usuário não marcou nada, ainda assim gerar um resultado educativo com os blocos de “informações insuficientes”, em vez de bloquear a visualização.

4. Garantir navegação correta depois do diagnóstico
- Após finalizar o diagnóstico, manter o usuário na tela “Seu resultado personalizado”.
- O botão “Ir para meu plano” continuará levando ao plano somente depois que a pessoa visualizar o resultado.

5. Validação
- Adicionar/ajustar testes do store para cobrir: diagnóstico salvo, resultado preservado após sync, banco com resultado nulo não apagando resultado local recente.
- Verificar no preview o fluxo completo: login/onboarding → diagnóstico → resultado personalizado visível.