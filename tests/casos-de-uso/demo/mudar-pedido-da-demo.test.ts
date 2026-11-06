import { afterEach, beforeEach, describe, expect, it, vi, type Mock, type MockInstance } from "vitest";
import { mudarPedidoDaDemo } from "@/casos-de-uso/demo/mudar-pedido-da-demo";
import type { Mensageiro } from "@/portas/mensageiro";
import { AGORA, MORADOR_1, MORADOR_2, MORADOR_3, RepositorioDaDemoFake } from "./repositorio-da-demo-fake";

// Chats de teste genéricos (ADR-35): números inventados.
const CHAT_1 = 111111;
const CHAT_2 = 222222;
const CHAT_3 = 333333;

// O pedido guardado pelo Fake é de "regar_plantas", para 7/11/2026, 9h em São Paulo.
const AVISO_DO_ACEITE =
  "Um vizinho aceitou o seu pedido: Regar plantas, sábado, 7 de novembro, às 9h. Abra o EntreNós para ver o contato.";

describe("mudarPedidoDaDemo", () => {
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

  it("deve gravar o pedido como aceita, com quem aceitou, quando outro morador aceita um pedido aberto", async () => {
    // Atende P-02 (Aberta → Aceita)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id });

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "aceitar", pedido.id, null, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(resposta).toEqual({ status: 200, corpo: { ok: true } });
    expect(await repositorio.lerPedido(pedido.id)).toMatchObject({ status: "aceita", apoiadorId: MORADOR_2.id });
  });

  it("deve voltar o pedido para aberta, sem apoiador, quando o apoiador desiste", async () => {
    // Atende P-02 (Aceita → Aberta)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id, apoiadorId: MORADOR_2.id, status: "aceita" });

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "desistir", pedido.id, null, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(resposta).toEqual({ status: 200, corpo: { ok: true } });
    expect(await repositorio.lerPedido(pedido.id)).toMatchObject({ status: "aberta", apoiadorId: null });
  });

  it("deve gravar o pedido como concluida, mantendo o apoiador, quando o solicitante conclui com o apoiador que via", async () => {
    // Atende P-02 (Aceita → Concluída) e RF-CS-36
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id, apoiadorId: MORADOR_2.id, status: "aceita" });

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_1.id, "concluir", pedido.id, MORADOR_2.id, {
      repositorio,
      agora: AGORA,
      mensageiro,
    });

    // ASSERT
    expect(resposta).toEqual({ status: 200, corpo: { ok: true } });
    expect(await repositorio.lerPedido(pedido.id)).toMatchObject({ status: "concluida", apoiadorId: MORADOR_2.id });
  });

  it("deve responder 404 nao_encontrado quando o pedido não existe", async () => {
    // Atende a recusa de pedido inexistente
    // ARRANGE
    const gravarTransicao = vi.spyOn(repositorio, "gravarTransicao");

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "aceitar", "pedido-que-nao-existe", null, {
      repositorio,
      agora: AGORA,
      mensageiro,
    });

    // ASSERT
    expect(resposta).toEqual({ status: 404, corpo: { motivo: "nao_encontrado" } });
    expect(gravarTransicao).not.toHaveBeenCalled();
  });

  it("deve responder 409 proprio_solicitante e não mudar nada quando quem pediu tenta aceitar o próprio pedido", async () => {
    // Atende P-02 (RF-CS-19)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id });

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_1.id, "aceitar", pedido.id, null, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(resposta).toEqual({ status: 409, corpo: { motivo: "proprio_solicitante" } });
    expect(await repositorio.lerPedido(pedido.id)).toEqual(pedido);
    expect(mensageiro.enviarTexto).not.toHaveBeenCalled();
  });

  it("deve responder 409 apoiador_mudou e não concluir quando o apoiador atual não é o que o solicitante via", async () => {
    // Atende P-02 (RF-CS-36)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id, apoiadorId: MORADOR_3.id, status: "aceita" });

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_1.id, "concluir", pedido.id, MORADOR_2.id, {
      repositorio,
      agora: AGORA,
      mensageiro,
    });

    // ASSERT
    expect(resposta).toEqual({ status: 409, corpo: { motivo: "apoiador_mudou" } });
    expect(await repositorio.lerPedido(pedido.id)).toEqual(pedido);
  });

  it("deve responder 409 ja_aceita quando outro morador aceita entre a leitura e a gravação", async () => {
    // Atende P-01 (gravação condicionada ao status lido)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id, apoiadorId: MORADOR_3.id, status: "aceita" });
    // Stub da leitura: devolve o pedido como estava antes de o morador 3 aceitar.
    vi.spyOn(repositorio, "lerPedido").mockResolvedValueOnce({ ...pedido, status: "aberta", apoiadorId: null });

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "aceitar", pedido.id, null, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(resposta).toEqual({ status: 409, corpo: { motivo: "ja_aceita" } });
    expect(await repositorio.lerPedido(pedido.id)).toEqual(pedido);
  });

  it("deve responder 409 mudou quando o pedido muda de status entre a leitura e a gravação de outra ação", async () => {
    // Atende P-01 (gravação condicionada ao status lido)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id, apoiadorId: MORADOR_2.id, status: "cancelada" });
    // Stub da leitura: devolve o pedido como estava antes de o solicitante cancelar.
    vi.spyOn(repositorio, "lerPedido").mockResolvedValueOnce({ ...pedido, status: "aceita" });

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "desistir", pedido.id, null, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(resposta).toEqual({ status: 409, corpo: { motivo: "mudou" } });
    expect(await repositorio.lerPedido(pedido.id)).toEqual(pedido);
  });

  it("deve responder 409 mudou e não concluir quando o apoiador troca entre a leitura e a gravação", async () => {
    // Atende P-01 (na conclusão, gravação condicionada também ao apoiador visto)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id, apoiadorId: MORADOR_3.id, status: "aceita" });
    // Stub da leitura: o status é o mesmo (aceita), mas com o apoiador de antes da troca.
    vi.spyOn(repositorio, "lerPedido").mockResolvedValueOnce({ ...pedido, apoiadorId: MORADOR_2.id });

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_1.id, "concluir", pedido.id, MORADOR_2.id, {
      repositorio,
      agora: AGORA,
      mensageiro,
    });

    // ASSERT
    expect(resposta).toEqual({ status: 409, corpo: { motivo: "mudou" } });
    expect(await repositorio.lerPedido(pedido.id)).toEqual(pedido);
  });

  it("deve enviar o aviso do aceite só ao chat de quem pediu quando outro morador aceita o pedido", async () => {
    // Atende a Issue #68 (aviso do aceite ao solicitante)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id });

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "aceitar", pedido.id, null, {
      repositorio,
      agora: AGORA,
      mensageiro,
    });

    // ASSERT
    expect(resposta).toEqual({ status: 200, corpo: { ok: true } });
    expect(mensageiro.enviarTexto.mock.calls).toEqual([[CHAT_1, AVISO_DO_ACEITE]]);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("deve escrever o dia e o horário de São Paulo, com os minutos, quando o horário do pedido aceito não é hora cheia", async () => {
    // Atende a Issue #68 (mesmo formato da #66; DEF-CS-01): 22h30 em São Paulo já é dia 8 em UTC
    // ARRANGE
    const pedido = repositorio.guardar({
      solicitanteId: MORADOR_1.id,
      categoria: "outra_ajuda",
      dataEHora: "2026-11-08T01:30:00+00:00",
    });

    // ACT
    await mudarPedidoDaDemo(MORADOR_2.id, "aceitar", pedido.id, null, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(mensageiro.enviarTexto).toHaveBeenCalledWith(
      CHAT_1,
      "Um vizinho aceitou o seu pedido: Outra ajuda, sábado, 7 de novembro, às 22h30. Abra o EntreNós para ver o contato.",
    );
  });

  it("deve não incluir no aviso o nome, a unidade nem o telefone de quem aceitou nem de quem pediu", async () => {
    // Atende P-04
    // ARRANGE
    const pedido = repositorio.guardar({
      solicitanteId: MORADOR_1.id,
      titulo: `Ajuda para ${MORADOR_1.nome}`,
      descricao: `Estou no ${MORADOR_1.unidade}, telefone ${MORADOR_1.telefone}.`,
    });
    // Spy: o caso de uso nem lê os dados dos moradores.
    const moradorPorId = vi.spyOn(repositorio, "moradorPorId");

    // ACT
    await mudarPedidoDaDemo(MORADOR_2.id, "aceitar", pedido.id, null, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(mensageiro.enviarTexto).toHaveBeenCalledTimes(1);
    const [, texto] = mensageiro.enviarTexto.mock.calls[0];
    for (const morador of [MORADOR_2, MORADOR_1]) {
      for (const proibido of [morador.nome, morador.unidade, morador.telefone]) expect(texto).not.toContain(proibido);
    }
    expect(moradorPorId).not.toHaveBeenCalled();
  });

  it("deve usar o rótulo Outra ajuda, sem repetir o texto gravado, quando a categoria do pedido não é uma das sete", async () => {
    // Atende P-04 (texto fora das categorias fixas, D-03, não vai para o aviso)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id, categoria: "categoria_desconhecida" });

    // ACT
    await mudarPedidoDaDemo(MORADOR_2.id, "aceitar", pedido.id, null, { repositorio, agora: AGORA, mensageiro });

    // ASSERT
    expect(mensageiro.enviarTexto.mock.calls).toEqual([
      [CHAT_1, "Um vizinho aceitou o seu pedido: Outra ajuda, sábado, 7 de novembro, às 9h. Abra o EntreNós para ver o contato."],
    ]);
  });

  it("deve não enviar aviso quando o aceite é recusado porque outro morador aceitou antes", async () => {
    // Atende a Issue #68 (só avisa se a gravação condicionada teve sucesso; P-01)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id, apoiadorId: MORADOR_3.id, status: "aceita" });
    // Stub da leitura: devolve o pedido como estava antes de o morador 3 aceitar.
    vi.spyOn(repositorio, "lerPedido").mockResolvedValueOnce({ ...pedido, status: "aberta", apoiadorId: null });
    const chatDoMorador = vi.spyOn(repositorio, "chatDoMorador");

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "aceitar", pedido.id, null, {
      repositorio,
      agora: AGORA,
      mensageiro,
    });

    // ASSERT
    expect(resposta).toEqual({ status: 409, corpo: { motivo: "ja_aceita" } });
    expect(chatDoMorador).not.toHaveBeenCalled();
    expect(mensageiro.enviarTexto).not.toHaveBeenCalled();
  });

  it.each([
    ["desistir", MORADOR_2.id, null],
    ["cancelar", MORADOR_1.id, null],
    ["concluir", MORADOR_1.id, MORADOR_2.id],
  ] as const)("deve não enviar aviso quando a ação é %s", async (acao, autor, apoiadorVisto) => {
    // Atende a Issue #68 (só o aceite avisa)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id, apoiadorId: MORADOR_2.id, status: "aceita" });
    const chatDoMorador = vi.spyOn(repositorio, "chatDoMorador");

    // ACT
    const resposta = await mudarPedidoDaDemo(autor, acao, pedido.id, apoiadorVisto, {
      repositorio,
      agora: AGORA,
      mensageiro,
    });

    // ASSERT
    expect(resposta).toEqual({ status: 200, corpo: { ok: true } });
    expect(chatDoMorador).not.toHaveBeenCalled();
    expect(mensageiro.enviarTexto).not.toHaveBeenCalled();
  });

  it("deve aceitar o pedido sem enviar nada quando quem pediu não tem chat cadastrado", async () => {
    // Atende a Issue #68 (solicitante sem chat_telegram não recebe nada e nada quebra)
    // ARRANGE
    repositorio = new RepositorioDaDemoFake([MORADOR_1, MORADOR_2, MORADOR_3], {
      [MORADOR_1.id]: null,
      [MORADOR_2.id]: CHAT_2,
    });
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id });

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "aceitar", pedido.id, null, {
      repositorio,
      agora: AGORA,
      mensageiro,
    });

    // ASSERT
    expect(resposta).toEqual({ status: 200, corpo: { ok: true } });
    expect(await repositorio.lerPedido(pedido.id)).toMatchObject({ status: "aceita", apoiadorId: MORADOR_2.id });
    expect(mensageiro.enviarTexto).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("deve manter a resposta 200 e registrar no log só o id do pedido quando o envio do aviso falha", async () => {
    // Atende a Issue #68 (falha no envio não muda a resposta; RF-TW-09) e RNF-TW-03
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id });
    mensageiro.enviarTexto.mockRejectedValueOnce(new Error("erro-do-envio"));

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "aceitar", pedido.id, null, {
      repositorio,
      agora: AGORA,
      mensageiro,
    });

    // ASSERT
    expect(resposta).toEqual({ status: 200, corpo: { ok: true } });
    expect(await repositorio.lerPedido(pedido.id)).toMatchObject({ status: "aceita", apoiadorId: MORADOR_2.id });
    expect(consoleError).toHaveBeenCalledTimes(1);
    const logs = consoleError.mock.calls.flat().map(String).join(" ");
    expect(logs).toContain(pedido.id);
    const proibidos = [String(CHAT_1), AVISO_DO_ACEITE, "Regar plantas", "erro-do-envio", MORADOR_1.id, MORADOR_2.id];
    for (const proibido of proibidos) expect(logs).not.toContain(proibido);
  });

  it("deve manter a resposta 200 e registrar no log só o id do pedido quando a busca do chat falha", async () => {
    // Atende a Issue #68 (o aviso não desfaz o aceite) e RNF-TW-03
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id });
    vi.spyOn(repositorio, "chatDoMorador").mockRejectedValue(new Error("erro-do-banco"));

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "aceitar", pedido.id, null, {
      repositorio,
      agora: AGORA,
      mensageiro,
    });

    // ASSERT
    expect(resposta).toEqual({ status: 200, corpo: { ok: true } });
    expect(await repositorio.lerPedido(pedido.id)).toMatchObject({ status: "aceita", apoiadorId: MORADOR_2.id });
    expect(mensageiro.enviarTexto).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledTimes(1);
    const logs = consoleError.mock.calls.flat().map(String).join(" ");
    expect(logs).toContain(pedido.id);
    for (const proibido of ["erro-do-banco", MORADOR_1.id, MORADOR_2.id]) expect(logs).not.toContain(proibido);
  });
});
