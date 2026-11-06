import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mudarPedidoDaDemo } from "@/casos-de-uso/demo/mudar-pedido-da-demo";
import { AGORA, MORADOR_1, MORADOR_2, MORADOR_3, RepositorioDaDemoFake } from "./repositorio-da-demo-fake";

describe("mudarPedidoDaDemo", () => {
  let repositorio: RepositorioDaDemoFake;

  beforeEach(() => {
    repositorio = new RepositorioDaDemoFake([MORADOR_1, MORADOR_2, MORADOR_3]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve gravar o pedido como aceita, com quem aceitou, quando outro morador aceita um pedido aberto", async () => {
    // Atende P-02 (Aberta → Aceita)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id });

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "aceitar", pedido.id, null, { repositorio, agora: AGORA });

    // ASSERT
    expect(resposta).toEqual({ status: 200, corpo: { ok: true } });
    expect(await repositorio.lerPedido(pedido.id)).toMatchObject({ status: "aceita", apoiadorId: MORADOR_2.id });
  });

  it("deve voltar o pedido para aberta, sem apoiador, quando o apoiador desiste", async () => {
    // Atende P-02 (Aceita → Aberta)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id, apoiadorId: MORADOR_2.id, status: "aceita" });

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "desistir", pedido.id, null, { repositorio, agora: AGORA });

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
    const resposta = await mudarPedidoDaDemo(MORADOR_1.id, "aceitar", pedido.id, null, { repositorio, agora: AGORA });

    // ASSERT
    expect(resposta).toEqual({ status: 409, corpo: { motivo: "proprio_solicitante" } });
    expect(await repositorio.lerPedido(pedido.id)).toEqual(pedido);
  });

  it("deve responder 409 apoiador_mudou e não concluir quando o apoiador atual não é o que o solicitante via", async () => {
    // Atende P-02 (RF-CS-36)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id, apoiadorId: MORADOR_3.id, status: "aceita" });

    // ACT
    const resposta = await mudarPedidoDaDemo(MORADOR_1.id, "concluir", pedido.id, MORADOR_2.id, {
      repositorio,
      agora: AGORA,
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
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "aceitar", pedido.id, null, { repositorio, agora: AGORA });

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
    const resposta = await mudarPedidoDaDemo(MORADOR_2.id, "desistir", pedido.id, null, { repositorio, agora: AGORA });

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
    });

    // ASSERT
    expect(resposta).toEqual({ status: 409, corpo: { motivo: "mudou" } });
    expect(await repositorio.lerPedido(pedido.id)).toEqual(pedido);
  });
});
