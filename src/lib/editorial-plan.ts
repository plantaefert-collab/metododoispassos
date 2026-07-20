import { ProtocolDay } from "./protocol-plan";

export const EDITORIAL_PLAN: Record<number, ProtocolDay> = {
  1: {
    day: 1,
    phase: 1,
    title: "Diagnóstico e início do protocolo",
    objective: "Registrar o ponto de partida, compreender as condições da planta e iniciar o Método de 2 Passos quando a aplicação estiver indicada.",
    mainAction: "Registrar orquídea, realizar diagnóstico e primeira aplicação.",
    howTo: [
      "Fotografe a planta inteira, folhas e raízes em ambiente claro.",
      "Marque sinais nas raízes, folhas, ambiente, vaso, substrato e rega.",
      "Avalie luz, ventilação, drenagem e substrato.",
      "Realize o Método de 2 Passos."
    ],
    observe: [
      "Firmeza e coloração das folhas",
      "Raízes visíveis",
      "Sinais favoráveis ou pontos de ajuste"
    ],
    avoid: [
      "Filtros em fotos",
      "Marcar respostas por suposição",
      "Trocar vaso ou substrato por impulso",
      "Aplicar diretamente nas flores"
    ],
    checklist: [
      "Registrei a orquídea",
      "Fiz o diagnóstico",
      "Avaliei ambiente e substrato",
      "Realizei o Passo 1 (Enraizar)",
      "Realizei o Passo 2 (Nutrir)"
    ],
    recordPrompt: "Registre nome, espécie (se souber), local, tipo de vaso e substrato.",
    isApplicationDay: true,
    requiresPhoto: true,
  },
  2: {
    day: 2,
    phase: 1,
    title: "Observar a resposta inicial",
    objective: "Acompanhar a planta sem realizar novas intervenções.",
    mainAction: "Observar raízes, folhas, substrato e ambiente.",
    howTo: [
      "Compare com o registro do Dia 1.",
      "Anote somente alterações visíveis.",
      "Mantenha a planta no local escolhido."
    ],
    observe: [
      "Firmeza das folhas",
      "Alteração na aparência das raízes",
      "Tempo de secagem",
      "Reação inesperada após a aplicação"
    ],
    avoid: [
      "Repetir a aplicação",
      "Mudar a planta de lugar sem necessidade",
      "Regar apenas por calendário"
    ],
    checklist: [
      "Observei as folhas",
      "Observei as raízes visíveis",
      "Verifiquei o tempo de secagem",
      "Mantive o local da planta"
    ],
    recordPrompt: "Registre se houve mudança leve ou sinal de atenção.",
  },
  3: {
    day: 3,
    phase: 1,
    title: "Entender a umidade e a rega",
    objective: "Criar critérios para decidir quando regar.",
    mainAction: "Avaliar a umidade antes de realizar qualquer rega.",
    howTo: [
      "Observe a superfície e o interior do substrato.",
      "Verifique o peso do vaso.",
      "Observe a cor das raízes (verdes vs prateadas)."
    ],
    observe: [
      "Substrato úmido ou seco",
      "Raízes prateadas (pedem água)",
      "Peso do vaso"
    ],
    avoid: [
      "Regar apenas por calendário",
      "Deixar água acumulada no cachepot",
      "Considerar somente a superfície"
    ],
    checklist: [
      "Verifiquei o peso do vaso",
      "Observei a cor das raízes",
      "Toquei no substrato",
      "Decidi se regava ou não"
    ],
    recordPrompt: "Reguei, não precisei regar ou não consegui avaliar?",
  },
  4: {
    day: 4,
    phase: 1,
    title: "Avaliar vaso e substrato",
    objective: "Verificar se as raízes possuem drenagem, estabilidade e aeração.",
    mainAction: "Observar o estado do vaso e do substrato sem desmontar a planta.",
    howTo: [
      "Confira furos e escoamento.",
      "Confira compactação e cheiro.",
      "Confira a estabilidade da planta."
    ],
    observe: [
      "Drenagem eficiente",
      "Substrato solto ou compacto",
      "Mau cheiro",
      "Planta balançando"
    ],
    avoid: [
      "Trocar o substrato sem avaliar o conjunto",
      "Apertar as raízes",
      "Manter água acumulada"
    ],
    checklist: [
      "Verifiquei a drenagem",
      "Observei a compactação",
      "Verifiquei o cheiro do substrato",
      "Conferi a estabilidade da planta"
    ],
    recordPrompt: "Condição geral: favorável, precisa acompanhamento ou avaliação especializada?",
  },
  5: {
    day: 5,
    phase: 1,
    title: "Observar as raízes",
    objective: "Acompanhar sinais de atividade e possíveis alterações no sistema radicular.",
    mainAction: "Observar as raízes visíveis (aéreas e no vaso).",
    howTo: [
      "Veja raízes aéreas e próximas à parede do vaso.",
      "Compare a firmeza e a cor.",
      "Procure por pontas verdes ou avermelhadas."
    ],
    observe: [
      "Pontas novas",
      "Firmeza",
      "Áreas secas ou escuras",
      "Partes moles"
    ],
    avoid: [
      "Cortar raízes somente pela cor",
      "Retirar a planta do vaso",
      "Manipular raízes novas"
    ],
    checklist: [
      "Observei as raízes aéreas",
      "Observei as raízes no vaso",
      "Procurei pontas novas",
      "Verifiquei a firmeza"
    ],
    recordPrompt: "Sem alterações, pontas novas, raízes firmes ou sinais de atenção?",
  },
  6: {
    day: 6,
    phase: 1,
    title: "Observar folhas, brotos e hastes",
    objective: "Acompanhar o vigor visível da planta.",
    mainAction: "Verificar firmeza, coloração e novos crescimentos.",
    howTo: [
      "Observe folhas antigas e novas separadamente.",
      "Compare com a fotografia inicial.",
      "Procure por brotação ou novas hastes."
    ],
    observe: [
      "Firmeza e enrugamento",
      "Amarelamento ou manchas",
      "Folha nova ou broto",
      "Haste em desenvolvimento"
    ],
    avoid: [
      "Retirar folhas sem compreender o contexto",
      "Confundir folha nova com haste",
      "Interpretar ausência de flor como falha"
    ],
    checklist: [
      "Observei as folhas antigas",
      "Observei as folhas novas",
      "Procurei brotos ou hastes",
      "Verifiquei manchas"
    ],
    recordPrompt: "Quais os principais sinais encontrados na parte aérea?",
  },
  7: {
    day: 7,
    phase: 1,
    title: "Primeira avaliação e segunda aplicação",
    objective: "Comparar a primeira semana com o ponto de partida e realizar a segunda aplicação.",
    mainAction: "Adicionar fotografia, comparar e aplicar o Método de 2 Passos.",
    howTo: [
      "Use iluminação semelhante ao Dia 1.",
      "Compare raízes, folhas e tempo de secagem.",
      "Realize a aplicação completa."
    ],
    observe: [
      "Mudanças nas raízes",
      "Firmeza das folhas",
      "Estabilidade geral"
    ],
    avoid: [
      "Avaliar apenas a floração",
      "Ângulos de foto muito diferentes",
      "Ignorar sinais de deterioração rápida"
    ],
    checklist: [
      "Registrei a foto do Dia 7",
      "Comparei com o Dia 1",
      "Registrei o que melhorou",
      "Realizei o Passo 1 (Enraizar)",
      "Realizei o Passo 2 (Nutrir)"
    ],
    recordPrompt: "O que melhorou, o que permaneceu igual e o que piorou?",
    isApplicationDay: true,
    requiresPhoto: true,
    evaluationType: "intermediate",
  },
  8: {
    day: 8,
    phase: 2,
    title: "Revisar o diagnóstico",
    objective: "Retomar os pontos identificados no início do plano.",
    mainAction: "Revisar as prioridades e os ajustes do diagnóstico.",
    howTo: [
      "Compare as orientações iniciais com os últimos registros.",
      "Veja quais sinais desapareceram ou surgiram.",
      "Identifique informações que agora consegue avaliar."
    ],
    observe: [
      "Sinais que continuam presentes",
      "Novos sinais observados",
      "Melhoria na percepção da planta"
    ],
    avoid: [
      "Ignorar um resultado desatualizado",
      "Tentar corrigir tudo ao mesmo tempo",
      "Mudar o plano sem necessidade"
    ],
    checklist: [
      "Revisei o diagnóstico inicial",
      "Comparei com o estado atual",
      "Identifiquei sinais que mudaram",
      "Escolhi três pontos para continuar acompanhando"
    ],
    recordPrompt: "Quais três pontos continuarei acompanhando?",
  },
  9: {
    day: 9,
    phase: 2,
    title: "Revisar a consistência da rotina",
    objective: "Identificar excessos e mudanças desnecessárias.",
    mainAction: "Revisar tudo o que foi realizado desde o Dia 1.",
    howTo: [
      "Consulte aplicações, regas e anotações.",
      "Identifique se houve rega sem verificação.",
      "Avalie se houve muitas mudanças de local."
    ],
    observe: [
      "Consistência nos registros",
      "Intervenções repetidas",
      "Excesso de produtos ou rega"
    ],
    avoid: [
      "Compensar falhas com mais produto",
      "Alterar quantidade ou frequência",
      "Misturar diferentes rotinas"
    ],
    checklist: [
      "Revisei as regas registradas",
      "Revisei as aplicações",
      "Avaliei a estabilidade do local",
      "Identifiquei um erro a evitar"
    ],
    recordPrompt: "Um hábito a manter e um erro a evitar daqui em diante.",
  },
  10: {
    day: 10,
    phase: 2,
    title: "Avaliar a luz e o ambiente",
    objective: "Confirmar se a planta está recebendo luminosidade adequada.",
    mainAction: "Observar a planta em diferentes horários do dia.",
    howTo: [
      "Verifique sol direto forte (queima).",
      "Verifique ambiente muito escuro.",
      "Verifique a ventilação do local."
    ],
    observe: [
      "Luz indireta constante",
      "Folhas voltadas para a luz",
      "Cor das folhas (clara vs escura)"
    ],
    avoid: [
      "Mudar a planta de lugar várias vezes",
      "Sol direto nas horas mais quentes",
      "Local abafado"
    ],
    checklist: [
      "Observei a luz pela manhã",
      "Observei a luz à tarde",
      "Verifiquei se há ventilação",
      "Observei a reação das folhas"
    ],
    recordPrompt: "A luz está adequada, excessiva ou insuficiente?",
  },
  11: {
    day: 11,
    phase: 2,
    title: "Acompanhar a estabilidade",
    objective: "Verificar se as condições básicas permanecem constantes.",
    mainAction: "Revisar vaso, substrato, umidade e ventilação.",
    howTo: [
      "Conferir se a orquídea continua firme no vaso.",
      "Verificar se a drenagem está funcionando.",
      "Confirmar se o local permanece o mesmo."
    ],
    observe: [
      "Substrato estável",
      "Boa circulação de ar",
      "Escoamento da água"
    ],
    avoid: [
      "Mudar local por ansiedade",
      "Ignorar água acumulada",
      "Apertar as raízes"
    ],
    checklist: [
      "Verifiquei a firmeza da planta",
      "Conferi a drenagem",
      "Observei a circulação de ar",
      "Mantive a estabilidade"
    ],
    recordPrompt: "A condição básica é favorável ou precisa de ajuste?",
  },
  12: {
    day: 12,
    phase: 2,
    title: "Observar o vigor das folhas",
    objective: "Verificar sinais de hidratação e saúde na parte aérea.",
    mainAction: "Acompanhar firmeza, cor e evolução de manchas.",
    howTo: [
      "Toque nas folhas para sentir a firmeza.",
      "Observe se as folhas novas são menores que as antigas.",
      "Verifique se manchas estão aumentando."
    ],
    observe: [
      "Firmeza e cor",
      "Evolução de manchas",
      "Novas folhas e brotos"
    ],
    avoid: [
      "Avaliar sucesso apenas pela floração",
      "Ignorar manchas em expansão",
      "Fazer mudanças bruscas de luz"
    ],
    checklist: [
      "Conferi a firmeza ao toque",
      "Observei a coloração",
      "Verifiquei manchas existentes",
      "Procurei novos crescimentos"
    ],
    recordPrompt: "Quais as principais alterações encontradas nas folhas?",
  },
  13: {
    day: 13,
    phase: 2,
    title: "Corrigir apenas o necessário",
    objective: "Evitar excesso de intervenções.",
    mainAction: "Escolher no máximo um ajuste simples, se houver necessidade.",
    howTo: [
      "Identifique qual fator está relacionado ao problema.",
      "Melhore ventilação ou retire água acumulada.",
      "Evite sol direto excessivo."
    ],
    observe: [
      "Necessidade real de mudança",
      "Sinais que já estão estáveis",
      "Impacto de ajustes anteriores"
    ],
    avoid: [
      "Trocar tudo ao mesmo tempo",
      "Realizar mudanças sem registro",
      "Mudar planta por expectativa de flor"
    ],
    checklist: [
      "Avaliei a necessidade de ajuste",
      "Escolhi no máximo uma ação",
      "Registrei o motivo do ajuste",
      "Mantive o restante estável"
    ],
    recordPrompt: "Qual ajuste foi escolhido e por quê?",
  },
  14: {
    day: 14,
    phase: 2,
    title: "Avaliação intermediária e terceira aplicação",
    objective: "Comparar os Dias 1, 7 e 14 e realizar a terceira aplicação.",
    mainAction: "Fotografar, avaliar e aplicar o Método de 2 Passos.",
    howTo: [
      "Use iluminação e enquadramento semelhantes.",
      "Compare a evolução das raízes e folhas.",
      "Conclua a aplicação conforme orientação."
    ],
    observe: [
      "Evolução das raízes",
      "Firmeza e cor das folhas",
      "Estabilidade do substrato"
    ],
    avoid: [
      "Desconsiderar pequenas evoluções",
      "Considerar ausência de flores como fracasso",
      "Ignorar sinais de piora"
    ],
    checklist: [
      "Registrei a foto do Dia 14",
      "Comparei com os Dias 1 e 7",
      "Registrei a melhor evolução",
      "Realizei o Passo 1 (Enraizar)",
      "Realizei o Passo 2 (Nutrir)"
    ],
    recordPrompt: "Melhor evolução e principal ponto pendente?",
    isApplicationDay: true,
    requiresPhoto: true,
    evaluationType: "intermediate",
  },
  15: {
    day: 15,
    phase: 3,
    title: "Identificar o que está funcionando",
    objective: "Reconhecer os cuidados que contribuíram para a estabilidade.",
    mainAction: "Revisar anotações e escolher hábitos consistentes.",
    howTo: [
      "Procure relações entre ações e sinais.",
      "Identifique o melhor critério de rega.",
      "Avalie a estabilidade do local."
    ],
    observe: [
      "Melhor drenagem",
      "Consistência nos registros",
      "Sinais favoráveis recorrentes"
    ],
    avoid: [
      "Atribuir mudança a um único fator",
      "Abandonar cuidados básicos",
      "Introduzir novos produtos agora"
    ],
    checklist: [
      "Revisei meus registros",
      "Identifiquei o hábito mais eficaz",
      "Observei sinais favoráveis",
      "Escolhi dois cuidados para manter"
    ],
    recordPrompt: "Quais dois cuidados serão mantidos?",
  },
  16: {
    day: 16,
    phase: 3,
    title: "Preparar a última aplicação",
    objective: "Verificar se a planta está pronta para a terceira aplicação.",
    mainAction: "Revisar raízes, folhas e umidade.",
    howTo: [
      "Compare sinais atuais com o diagnóstico inicial.",
      "Verifique se o substrato não está excessivamente úmido.",
      "Confirme se não houve aplicação recente de outros produtos."
    ],
    observe: [
      "Umidade do substrato",
      "Deterioração rápida (contraindicado)",
      "Condições normais da planta"
    ],
    avoid: [
      "Aplicação obrigatória se houver sinal de atenção",
      "Ignorar o rótulo",
      "Repetir produtos desnecessários"
    ],
    checklist: [
      "Revisei o histórico de aplicações",
      "Verifiquei a umidade do substrato",
      "Observei sinais de alerta",
      "Liberei ou adiei a aplicação"
    ],
    recordPrompt: "Aplicação liberada, adiada ou precisa de orientação?",
  },
  17: {
    day: 17,
    phase: 3,
    title: "Terceira aplicação",
    objective: "Concluir o ciclo previsto do Método de 2 Passos.",
    mainAction: "Realizar a aplicação conforme instruções oficiais.",
    howTo: [
      "Siga os mesmos critérios de segurança e registro.",
      "Mantenha a quantidade recomendada.",
      "Observe a resposta posterior da planta."
    ],
    observe: [
      "Condição antes da aplicação",
      "Passos realizados",
      "Sinais inesperados posteriores"
    ],
    avoid: [
      "Aumentar a quantidade por ser a última",
      "Combinar com outros fertilizantes",
      "Registrar sem realizar"
    ],
    checklist: [
      "Conferi as instruções",
      "Realizei o Passo 1 (Enraizar)",
      "Realizei o Passo 2 (Nutrir)",
      "Registrei a aplicação"
    ],
    recordPrompt: "Data, horário e observação da aplicação.",
    isApplicationDay: true,
  },
  18: {
    day: 18,
    phase: 3,
    title: "Observar sem interferir",
    objective: "Acompanhar a resposta após a última aplicação.",
    mainAction: "Observar sem realizar novas mudanças.",
    howTo: [
      "Confira os pontos avaliados nos Dias 2 e 4.",
      "Mantenha a rotina estável.",
      "Compare sinais com a avaliação do Dia 14."
    ],
    observe: [
      "Firmeza das raízes e folhas",
      "Evolução de brotos",
      "Reações inesperadas"
    ],
    avoid: [
      "Repetir a aplicação",
      "Fazer novas correções",
      "Mudar a planta de local"
    ],
    checklist: [
      "Observei a firmeza das folhas",
      "Verifiquei as raízes",
      "Mantive o local estável",
      "Registrei o sinal mais importante"
    ],
    recordPrompt: "Qual o sinal mais importante observado hoje?",
  },
  19: {
    day: 19,
    phase: 3,
    title: "Criar a rotina de manutenção",
    objective: "Planejar os cuidados depois do protocolo.",
    mainAction: "Definir uma rotina simples e clara.",
    howTo: [
      "Defina o critério de rega definitivo.",
      "Defina onde a planta ficará.",
      "Defina quando fará novos registros fotográficos."
    ],
    observe: [
      "Hábitos que funcionaram",
      "Sinais que precisam de acompanhamento",
      "Consistência do cuidado"
    ],
    avoid: [
      "Calendário rígido sem observação",
      "Abandonar os registros",
      "Misturar vários produtos"
    ],
    checklist: [
      "Defini meu critério de rega",
      "Defini o local da planta",
      "Planejei novos registros",
      "Defini meu plano de manutenção"
    ],
    recordPrompt: "Como será meu plano pessoal de manutenção?",
  },
  20: {
    day: 20,
    phase: 3,
    title: "Preparar a comparação final",
    objective: "Organizar os registros antes da conclusão.",
    mainAction: "Revisar fotos, anotações, tarefas e aplicações.",
    howTo: [
      "Consulte os marcos dos Dias 1, 7 e 14.",
      "Veja quais mudanças foram consistentes.",
      "Escolha três aspectos principais para a comparação final."
    ],
    observe: [
      "Mudanças graduais",
      "Cuidados que foram mantidos",
      "Lacunas nos registros"
    ],
    avoid: [
      "Fazer novas intervenções agora",
      "Alterar o ambiente antes da foto",
      "Considerar apenas flores"
    ],
    checklist: [
      "Revisei todas as fotos",
      "Revisei minhas anotações",
      "Conferi as aplicações",
      "Escolhi o que comparar no Dia 21"
    ],
    recordPrompt: "Quais três aspectos compararei amanhã?",
  },
  21: {
    day: 21,
    phase: 3,
    title: "Avaliação final e próximo caminho",
    objective: "Comparar o antes e depois e definir os próximos cuidados.",
    mainAction: "Adicionar a fotografia final e preencher a conclusão.",
    howTo: [
      "Repita o enquadramento do Dia 1.",
      "Compare os quatro marcos principais.",
      "Defina os cuidados que serão mantidos permanentemente."
    ],
    observe: [
      "Vigor das raízes e folhas",
      "Brotos e hastes",
      "Comportamento do substrato",
      "Consistência da rotina"
    ],
    avoid: [
      "Avaliar sucesso somente pela flor",
      "Alterar registros antigos",
      "Ignorar sinais de atenção"
    ],
    checklist: [
      "Registrei a foto final",
      "Comparei os quatro marcos",
      "Preenchi a avaliação final",
      "Defini minha classificação",
      "Realizei a aplicação de manutenção"
    ],
    recordPrompt: "O que melhorou, o que permaneceu igual e o que precisa de atenção?",
    requiresPhoto: true,
    isApplicationDay: true,
    evaluationType: "final",
  },
};

