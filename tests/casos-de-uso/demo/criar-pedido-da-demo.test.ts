import { afterEach, beforeEach, describe, expect, it, vi, type Mock, type MockInstance } from "vitest";
import { criarPedidoDaDemo } from "@/casos-de-uso/demo/criar-pedido-da-demo";
import type { Mensageiro } from "@/portas/mensageiro";
import { AGORA, MORADOR_1, MORADOR_2, MORADOR_3, RepositorioDaDemoFake } from "./repositorio-da-demo-fake";

// AGORA é 6/11/2026, 9h em São Paulo: o pedido é para o dia seguinte, no mesmo horário.
const DADOS_VALIDOS = {
  titulo: "  Regar as plantas da varanda  ",
  descricao: "São três vasos pequenos.",
  categoria: "regar_plantas",
  dataEHora: "2026-11-07T09:00",
};

// Chats de teste genéricos (ADR-35): números inventados.
const CHAT_1 = 111111;
const CHAT_2 = 222222;
const CHAT_3 = 333333;

const AVISO =
  "Novo pedido de ajuda na sua comunidade: Regar plantas, sábado, 7 de novembro, às 9h. Abra o EntreNós para ver.";

describe("criarPedidoDaDemo", () => {
  let repositorio: RepositorioDaDemoFake;
  let mensageiro: { enviarTexto: Mock<Mensageiro["enviarTexto"]> };
  let consoleError: MockInstance;

  beforeEach(() => {
    repositorio = new RepositorioDaDemoFake([MORADOR_1, MORADOR_2, MORADOR_3], {
      [MORADOR_1.id]: CHAT_1,
      [MORADOR_2.id]: CHAT_2,
      [MORADOR_3.id]: CHAT_3,
    });
    // Mock: registra as chamadas para conferir depois.
    mensageiro = { enviarTexto: vi.fn<Mensageiro["enviarTexto"]>(async () => {}) };
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve gravar o pedido aberto, em nome de quem pediu, e responder 201 quando os dados são válidos", async () => {
    // Atende P-02 (criação por validarNovaSolicitacao)
    // ARRANGE
    const eu = MORADOR_1.id;

    // ACT
    const resposta = await criarPedidoDaDemo(eu, DADOS_VALIDOS, { repositorio, agora: AGORA, mensageiro });

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

  it("deve responder 400 com os erros de cada campo e não gravar nem avisar quando os dados são inválidos", async () => {
    // Atende P-02 (RF-CS-03, RNF-US-10)
    // ARRANGE
    const dados = { titulo: "", descricao: null, categoria: "", dataEHora: null };

    // ACT
    const resposta = await criarPedidoDaDemo(MORADOR_1.id, dados, { repositorio, agora: AGORA, mensageiro });

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
    expect(mensageiro.enviarTexto).not.toHaveBeenCalled();
  });

  it("deve responder 400 no_passado quando o horário já passou pelo relógio recebido", async () => {
    // Atende RF-CS-06 (o relógio vem de fora)
    // ARRANGE
    const dados = { ...DADOS_VALIDOS, dataEHora: "2026-11-06T08:59" };

    // ACT
    const resposta = await criarPedidoDaDemo(MORADOR_1.id, dados, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(resposta).toEqual({ status: 400, corpo: { erros: [{ campo: "dataEHora", problema: "no_passado" }] } });
    expect(await repositorio.contarPedidos()).toBe(0);
  });

  it("deve responder 429 limite e não gravar nem avisar quando a demonstração já tem 30 pedidos", async () => {
    // Atende o limite de 30 da demonstração
    // ARRANGE
    for (let numero = 1; numero <= 30; numero++) repositorio.guardar({ solicitanteId: MORADOR_2.id });

    // ACT
    const resposta = await criarPedidoDaDemo(MORADOR_1.id, DADOS_VALIDOS, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(resposta).toEqual({ status: 429, corpo: { motivo: "limite" } });
    expect(await repositorio.contarPedidos()).toBe(30);
    expect(mensageiro.enviarTexto).not.toHaveBeenCalled();
  });

  it("deve gravar o trigésimo pedido quando a demonstração tem 29", async () => {
    // Atende o limite de 30 da demonstração (valor de fronteira)
    // ARRANGE
    for (let numero = 1; numero <= 29; numero++) repositorio.guardar({ solicitanteId: MORADOR_2.id });

    // ACT
    const resposta = await criarPedidoDaDemo(MORADOR_1.id, DADOS_VALIDOS, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(resposta.status).toBe(201);
    expect(await repositorio.contarPedidos()).toBe(30);
  });

  it("deve enviar o aviso a todos os chats cadastrados, menos o de quem pediu, quando o pedido é criado", async () => {
    // Atende a Issue #66 (aviso aos outros moradores)
    // ARRANGE
    const eu = MORADOR_1.id;

    // ACT
    await criarPedidoDaDemo(eu, DADOS_VALIDOS, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(mensageiro.enviarTexto.mock.calls).toEqual([
      [CHAT_2, AVISO],
      [CHAT_3, AVISO],
    ]);
  });

  it("deve escrever o dia e o horário de São Paulo, com os minutos, quando o horário não é hora cheia", async () => {
    // Atende a Issue #66 (dia e horário no fuso da solicitação, DEF-CS-01): 22h30 em São Paulo já é dia 8 em UTC
    // ARRANGE
    const dados = { ...DADOS_VALIDOS, categoria: "outra_ajuda", dataEHora: "2026-11-07T22:30" };

    // ACT
    await criarPedidoDaDemo(MORADOR_1.id, dados, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(mensageiro.enviarTexto).toHaveBeenCalledWith(
      CHAT_2,
      "Novo pedido de ajuda na sua comunidade: Outra ajuda, sábado, 7 de novembro, às 22h30. Abra o EntreNós para ver.",
    );
  });

  it("deve não incluir no aviso o nome, a unidade nem o telefone de quem pediu, mesmo escritos no pedido", async () => {
    // Atende P-04
    // ARRANGE
    const dados = {
      ...DADOS_VALIDOS,
      titulo: `Ajuda para ${MORADOR_1.nome}`,
      descricao: `Estou no ${MORADOR_1.unidade}, telefone ${MORADOR_1.telefone}.`,
    };

    // ACT
    await criarPedidoDaDemo(MORADOR_1.id, dados, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(mensageiro.enviarTexto).toHaveBeenCalledTimes(2);
    const textos = mensageiro.enviarTexto.mock.calls.map(([, texto]) => texto).join(" ");
    for (const proibido of [MORADOR_1.nome, MORADOR_1.unidade, MORADOR_1.telefone]) {
      expect(textos).not.toContain(proibido);
    }
  });

  it("deve criar o pedido e enviar aos outros chats quando um dos envios falha", async () => {
    // Atende a Issue #66 (falha no envio não impede a criação nem os outros envios; RF-TW-09)
    // ARRANGE
    mensageiro.enviarTexto.mockRejectedValueOnce(new Error("erro-do-envio"));

    // ACT
    const resposta = await criarPedidoDaDemo(MORADOR_1.id, DADOS_VALIDOS, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(resposta).toEqual({ status: 201, corpo: { ok: true } });
    expect(await repositorio.contarPedidos()).toBe(1);
    expect(mensageiro.enviarTexto).toHaveBeenCalledWith(CHAT_2, AVISO);
    expect(mensageiro.enviarTexto).toHaveBeenCalledWith(CHAT_3, AVISO);
  });

  it("deve registrar no log o id do pedido, sem o chat, o texto nem o erro, quando um dos envios falha", async () => {
    // Atende RNF-TW-03
    // ARRANGE
    mensageiro.enviarTexto.mockRejectedValueOnce(new Error("erro-do-envio"));

    // ACT
    await criarPedidoDaDemo(MORADOR_1.id, DADOS_VALIDOS, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(consoleError).toHaveBeenCalledTimes(1);
    const logs = consoleError.mock.calls.flat().map(String).join(" ");
    // O Fake dá o id "pedido-1" ao primeiro pedido.
    expect(logs).toContain("pedido-1");
    for (const proibido of [String(CHAT_2), String(CHAT_3), AVISO, "Regar plantas", "erro-do-envio"]) {
      expect(logs).not.toContain(proibido);
    }
  });

  it("deve não enviar nada quando nenhum outro morador tem chat cadastrado", async () => {
    // Atende a Issue #66 (morador sem chat_telegram não recebe nada e nada quebra)
    // ARRANGE
    repositorio = new RepositorioDaDemoFake([MORADOR_1, MORADOR_2, MORADOR_3], {
      [MORADOR_1.id]: CHAT_1,
      [MORADOR_2.id]: null,
    });

    // ACT
    const resposta = await criarPedidoDaDemo(MORADOR_1.id, DADOS_VALIDOS, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(resposta).toEqual({ status: 201, corpo: { ok: true } });
    expect(mensageiro.enviarTexto).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("deve criar o pedido e registrar no log só o id dele quando a busca dos chats falha", async () => {
    // Atende a Issue #66 (o aviso não impede a criação) e RNF-TW-03
    // ARRANGE
    vi.spyOn(repositorio, "chatsParaAviso").mockRejectedValue(new Error("erro-do-banco"));

    // ACT
    const resposta = await criarPedidoDaDemo(MORADOR_1.id, DADOS_VALIDOS, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(resposta).toEqual({ status: 201, corpo: { ok: true } });
    expect(await repositorio.contarPedidos()).toBe(1);
    expect(mensageiro.enviarTexto).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledTimes(1);
    const logs = consoleError.mock.calls.flat().map(String).join(" ");
    expect(logs).toContain("pedido-1");
    expect(logs).not.toContain("erro-do-banco");
  });
});
