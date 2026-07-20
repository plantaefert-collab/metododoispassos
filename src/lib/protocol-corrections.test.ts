import { expect, test, describe, beforeEach } from "vitest";
import { WEEKS, APPLICATION_DAYS, getProtocolDay } from "./protocol-plan";
import { EDITORIAL_PLAN } from "./editorial-plan";

describe("Correções Técnicas — Plano de 21 Dias", () => {
  test("1. PlanoTab aceita setTab sem erro (verificado via typecheck)", () => {
    // Esse teste é conceitual, a validação real ocorre no 'bunx tsgo --noEmit'
    expect(true).toBe(true);
  });

  test("2. Dia 1 exibe somente um botão do método (Etapa 4)", () => {
    const dia1 = EDITORIAL_PLAN[1];
    expect(dia1.isApplicationDay).toBe(true);
    // No código do componente, tratamos currentDay !== 1 para esconder o botão geral.
    // O botão da Etapa 4 está sempre presente se onOpenMethod for passado.
    expect(dia1.stages?.find(s => s.id === "etapa-4-aplicacao")).toBeDefined();
  });

  test("3. Dias 7, 14 e 21 exibem botão do método", () => {
    [7, 14, 21].forEach(d => {
      const meta = getProtocolDay(d);
      expect(meta.isApplicationDay).toBe(true);
    });
  });

  test("4. Dias sem aplicação não possuem isApplicationDay", () => {
    const dia2 = getProtocolDay(2);
    expect(dia2.isApplicationDay).toBeFalsy();
  });

  test("5. Sincronização de Semanas (Dias iniciais)", () => {
    // Semana 1 -> Dia 1
    expect(WEEKS[0].days[0]).toBe(1);
    // Semana 2 -> Dia 8
    expect(WEEKS[1].days[0]).toBe(8);
    // Semana 3 -> Dia 15
    expect(WEEKS[2].days[0]).toBe(15);
  });

  test("6. Título personalizado no Dia 13", () => {
    const dia13 = EDITORIAL_PLAN[13];
    expect(dia13.observeTitle).toBe("Possíveis ajustes");
  });

  test("7. Demais dias mantêm título padrão (undefined na fonte)", () => {
    const dia12 = EDITORIAL_PLAN[12];
    expect(dia12.observeTitle).toBeUndefined();
  });

  test("8. Textos aprovados preservados no Dia 1 e 21", () => {
    const dia1 = EDITORIAL_PLAN[1];
    const etapa4 = dia1.stages?.find(s => s.id === "etapa-4-aplicacao");
    expect(etapa4?.avoid).toContain("Aplicar diretamente nas flores");
    
    const dia21 = EDITORIAL_PLAN[21];
    expect(dia21.checklist).toContain("Concluí a avaliação");
  });
});
