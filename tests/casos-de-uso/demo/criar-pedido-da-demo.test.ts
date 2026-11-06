import { beforeEach, describe, expect, it } from "vitest";
import { criarPedidoDaDemo } from "@/casos-de-uso/demo/criar-pedido-da-demo";
import { AGORA, MORADOR_1, MORADOR_2, RepositorioDaDemoFake } from "./repositorio-da-demo-fake";

// AGORA é 6/11/2026, 9h em São Paulo: o pedido é para o dia seguinte, no mesmo horário.
const DADOS_VALIDOS = {
  titulo: "  Regar as plantas da varanda  ",
  descricao: "São três vasos pequenos.",
  categoria: "regar_plantas",
  dataEHora: "2026-11-07T09:00",
};

describe("criarPedidoDaDemo", () => {
  let repositorio: RepositorioDaDemoFake;

  beforeEach(() => {
    repositorio = new RepositorioDaDemoFake([MORADOR_1, MORADOR_2]);
  });

  it("deve gravar o pedido aberto, em nome de quem pediu, e responder 201 quando os dados são válidos", async () => {
    // Atende P-02 (criação por validarNovaSolicitacao)
    // ARRANGE
    const eu = MORADOR_1.id;

    // ACT
    const resposta = await criarPedidoDaDemo(eu, DADOS_VALIDOS, { repositorio, agora: AGORA });

    // ASSERT
    expect(resposta).toEqual({ status: 201, corpo: { ok: true } });
    expect(await repositorio.listarPedidos(30)).toEqual([
      expect.objectContaining({
        titulo: "Regar as plantas da varanda",
        descricao: "São três vasos pequenos.",
        categoria: "regar_plantas",
        dataEHora: "2026-11-07T12:00:00.000Z",
        status: "aberta",
        solicitanteId: MORADOR_1.id,
        apoiadorId: null,
      }),
    ]);
  });

  it("deve responder 400 com os erros de cada campo e não gravar nada quando os dados são inválidos", async () => {
    // Atende P-02 (RF-CS-03, RNF-US-10)
    // ARRANGE
    const dados = { titulo: "", descricao: null, categoria: "", dataEHora: null };

    // ACT
    const resposta = await criarPedidoDaDemo(MORADOR_1.id, dados, { repositorio, agora: AGORA });

    // ASSERT
    expect(resposta).toEqual({
      status: 400,
      corpo: {
        erros: [
          { campo: "titulo", problema: "vazio" },
          { campo: "descricao", problema: "vazio" },
          { campo: "categoria", problema: "vazio" },
          { campo: "dataEHora", problema: "vazio" },
        ],
      },
    });
    expect(await repositorio.contarPedidos()).toBe(0);
  });

  it("deve responder 400 no_passado quando o horário já passou pelo relógio recebido", async () => {
    // Atende RF-CS-06 (o relógio vem de fora)
    // ARRANGE
    const dados = { ...DADOS_VALIDOS, dataEHora: "2026-11-06T08:59" };

    // ACT
    const resposta = await criarPedidoDaDemo(MORADOR_1.id, dados, { repositorio, agora: AGORA });

    // ASSERT
    expect(resposta).toEqual({ status: 400, corpo: { erros: [{ campo: "dataEHora", problema: "no_passado" }] } });
    expect(await repositorio.contarPedidos()).toBe(0);
  });

  it("deve responder 429 limite e não gravar quando a demonstração já tem 30 pedidos", async () => {
    // Atende o limite de 30 da demonstração
    // ARRANGE
    for (let numero = 1; numero <= 30; numero++) repositorio.guardar({ solicitanteId: MORADOR_2.id });

    // ACT
    const resposta = await criarPedidoDaDemo(MORADOR_1.id, DADOS_VALIDOS, { repositorio, agora: AGORA });

    // ASSERT
    expect(resposta).toEqual({ status: 429, corpo: { motivo: "limite" } });
    expect(await repositorio.contarPedidos()).toBe(30);
  });

  it("deve gravar o trigésimo pedido quando a demonstração tem 29", async () => {
    // Atende o limite de 30 da demonstração (valor de fronteira)
    // ARRANGE
    for (let numero = 1; numero <= 29; numero++) repositorio.guardar({ solicitanteId: MORADOR_2.id });

    // ACT
    const resposta = await criarPedidoDaDemo(MORADOR_1.id, DADOS_VALIDOS, { repositorio, agora: AGORA });

    // ASSERT
    expect(resposta.status).toBe(201);
    expect(await repositorio.contarPedidos()).toBe(30);
  });
});
