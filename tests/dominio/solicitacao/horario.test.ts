import { describe, expect, it } from "vitest";
import { horarioPassou, lerDataEHoraLocal } from "@/dominio/solicitacao/horario";

// 12:00 em São Paulo.
const AGORA = new Date("2026-11-06T15:00:00.000Z");

describe("horarioPassou", () => {
  // Atende DEF-CS-01, RF-CS-22
  it("deve devolver false quando a data e hora é 1 ms depois do momento atual", () => {
    // ARRANGE
    const dataEHora = new Date(AGORA.getTime() + 1);

    // ACT
    const resultado = horarioPassou(dataEHora, AGORA);

    // ASSERT
    expect(resultado).toBe(false);
  });

  // Atende DEF-CS-01, RF-CS-22
  it("deve devolver true quando a data e hora é igual ao momento atual", () => {
    // ARRANGE
    const dataEHora = new Date(AGORA.getTime());

    // ACT
    const resultado = horarioPassou(dataEHora, AGORA);

    // ASSERT
    expect(resultado).toBe(true);
  });

  // Atende DEF-CS-01, RF-CS-22
  it("deve devolver true quando a data e hora é 1 ms antes do momento atual", () => {
    // ARRANGE
    const dataEHora = new Date(AGORA.getTime() - 1);

    // ACT
    const resultado = horarioPassou(dataEHora, AGORA);

    // ASSERT
    expect(resultado).toBe(true);
  });
});

describe("lerDataEHoraLocal", () => {
  // Atende DEF-CS-01
  it("deve devolver o instante em UTC quando o texto é uma data e hora válida de São Paulo", () => {
    // ARRANGE
    const texto = "2026-11-07T10:00";

    // ACT
    const resultado = lerDataEHoraLocal(texto);

    // ASSERT
    expect(resultado).toEqual(new Date("2026-11-07T13:00:00.000Z"));
  });

  // Atende DEF-CS-01
  it("deve devolver o instante do dia seguinte em UTC quando a hora em São Paulo é perto da meia-noite", () => {
    // ARRANGE
    const texto = "2026-11-06T23:30";

    // ACT
    const resultado = lerDataEHoraLocal(texto);

    // ASSERT
    expect(resultado).toEqual(new Date("2026-11-07T02:30:00.000Z"));
  });

  // Atende RF-CS-03
  it.each([
    { nome: "o dia não existe", texto: "2026-02-30T10:00" },
    { nome: "a hora não existe", texto: "2026-11-07T24:00" },
    { nome: "falta o T entre a data e a hora", texto: "2026-11-07 10:00" },
    { nome: "o texto não está no formato", texto: "amanhã às 10" },
    { nome: "o texto está vazio", texto: "" },
  ])("deve devolver null quando $nome", ({ texto }) => {
    // ARRANGE
    const entrada = texto;

    // ACT
    const resultado = lerDataEHoraLocal(entrada);

    // ASSERT
    expect(resultado).toBeNull();
  });
});
