import { beforeEach, describe, expect, it } from "vitest";
import { listarPedidosDaDemo } from "@/casos-de-uso/demo/listar-pedidos-da-demo";
import type { RespostaDaDemo } from "@/casos-de-uso/demo/dependencias";
import { AGORA, MORADOR_1, MORADOR_2, MORADOR_3, RepositorioDaDemoFake } from "./repositorio-da-demo-fake";

type PedidoNaTela = Record<string, unknown>;

const pedidosDa = (resposta: RespostaDaDemo) => (resposta.corpo as { pedidos: PedidoNaTela[] }).pedidos;

const contatoDo = ({ nome, unidade, telefone }: typeof MORADOR_1) => ({ nome, unidade, telefone });

describe("listarPedidosDaDemo", () => {
  let repositorio: RepositorioDaDemoFake;

  beforeEach(() => {
    repositorio = new RepositorioDaDemoFake([MORADOR_1, MORADOR_2, MORADOR_3]);
  });

  it("deve devolver o morador da sessão junto com a lista quando ele tem cadastro", async () => {
    // Atende a Issue #64 (b): moradores vindos do banco
    // ARRANGE
    const eu = MORADOR_1.id;

    // ACT
    const resposta = await listarPedidosDaDemo(eu, { repositorio, agora: AGORA });

    // ASSERT
    expect(resposta).toEqual({ status: 200, corpo: { morador: MORADOR_1, pedidos: [] } });
  });

  it("deve responder 403 sem_cadastro quando o usuário da sessão não tem cadastro de morador", async () => {
    // Atende a Issue #64 (b): só morador cadastrado usa a demonstração
    // ARRANGE
    repositorio.guardar({ solicitanteId: MORADOR_1.id });
    const eu = "00000000-0000-4000-8000-000000000099";

    // ACT
    const resposta = await listarPedidosDaDemo(eu, { repositorio, agora: AGORA });

    // ASSERT
    expect(resposta).toEqual({ status: 403, corpo: { motivo: "sem_cadastro" } });
  });

  it("deve listar o pedido aberto sem dizer quem pediu e sem contato quando ninguém aceitou", async () => {
    // Atende P-04 (DC-08)
    // ARRANGE
    const pedido = repositorio.guardar({ solicitanteId: MORADOR_1.id });

    // ACT
    const resposta = await listarPedidosDaDemo(MORADOR_2.id, { repositorio, agora: AGORA });

    // ASSERT
    expect(pedidosDa(resposta)).toEqual([
      {
        id: pedido.id,
        titulo: pedido.titulo,
        descricao: pedido.descricao,
        categoria: pedido.categoria,
        data_e_hora: pedido.dataEHora,
        status: "aberta",
        ehMeu: false,
        souApoiador: false,
        apoiadorId: null,
        contato: null,
      },
    ]);
    const lista = JSON.stringify(pedidosDa(resposta));
    for (const proibido of Object.values(MORADOR_1)) {
      expect(lista).not.toContain(proibido);
    }
  });

  it("deve entregar o contato da outra parte ao solicitante e ao apoiador quando o pedido está aceita", async () => {
    // Atende P-04 (DC-10)
    // ARRANGE
    repositorio.guardar({ solicitanteId: MORADOR_1.id, apoiadorId: MORADOR_2.id, status: "aceita" });

    // ACT
    const [paraQuemPediu] = pedidosDa(await listarPedidosDaDemo(MORADOR_1.id, { repositorio, agora: AGORA }));
    const [paraQuemAjuda] = pedidosDa(await listarPedidosDaDemo(MORADOR_2.id, { repositorio, agora: AGORA }));

    // ASSERT
    expect(paraQuemPediu).toMatchObject({
      ehMeu: true,
      souApoiador: false,
      apoiadorId: MORADOR_2.id,
      contato: contatoDo(MORADOR_2),
    });
    expect(paraQuemAjuda).toMatchObject({
      ehMeu: false,
      souApoiador: true,
      apoiadorId: null,
      contato: contatoDo(MORADOR_1),
    });
  });

  it("deve não entregar contato nem identificar as partes a um terceiro quando o pedido está aceita", async () => {
    // Atende P-04
    // ARRANGE
    repositorio.guardar({ solicitanteId: MORADOR_1.id, apoiadorId: MORADOR_2.id, status: "aceita" });

    // ACT
    const resposta = await listarPedidosDaDemo(MORADOR_3.id, { repositorio, agora: AGORA });

    // ASSERT
    expect(pedidosDa(resposta)[0]).toMatchObject({ ehMeu: false, souApoiador: false, apoiadorId: null, contato: null });
    const lista = JSON.stringify(pedidosDa(resposta));
    for (const proibido of [...Object.values(MORADOR_1), ...Object.values(MORADOR_2)]) {
      expect(lista).not.toContain(proibido);
    }
  });

  it.each(["concluida", "cancelada"] as const)(
    "deve deixar de entregar o contato às duas partes quando o pedido está %s",
    async (status) => {
      // Atende P-04 (contato só com o pedido aceita)
      // ARRANGE
      repositorio.guardar({ solicitanteId: MORADOR_1.id, apoiadorId: MORADOR_2.id, status });

      // ACT
      const [paraQuemPediu] = pedidosDa(await listarPedidosDaDemo(MORADOR_1.id, { repositorio, agora: AGORA }));
      const [paraQuemAjuda] = pedidosDa(await listarPedidosDaDemo(MORADOR_2.id, { repositorio, agora: AGORA }));

      // ASSERT
      expect(paraQuemPediu.contato).toBeNull();
      expect(paraQuemAjuda.contato).toBeNull();
    },
  );

  it("deve marcar o próprio pedido como ehMeu, para ele não aparecer entre os pedidos dos vizinhos", async () => {
    // Atende DT-08
    // ARRANGE
    repositorio.guardar({ solicitanteId: MORADOR_1.id, titulo: "Pedido do morador 1" });
    repositorio.guardar({ solicitanteId: MORADOR_2.id, titulo: "Pedido do morador 2" });

    // ACT
    const resposta = await listarPedidosDaDemo(MORADOR_1.id, { repositorio, agora: AGORA });

    // ASSERT
    const dosVizinhos = pedidosDa(resposta).filter((pedido) => !pedido.ehMeu);
    expect(dosVizinhos.map((pedido) => pedido.titulo)).toEqual(["Pedido do morador 2"]);
  });

  it("deve listar só os 30 pedidos mais novos quando há mais de 30", async () => {
    // Atende o limite de 30 da demonstração
    // ARRANGE
    for (let numero = 1; numero <= 31; numero++) {
      repositorio.guardar({ solicitanteId: MORADOR_2.id, titulo: `Pedido ${numero}` });
    }

    // ACT
    const resposta = await listarPedidosDaDemo(MORADOR_1.id, { repositorio, agora: AGORA });

    // ASSERT
    const titulos = pedidosDa(resposta).map((pedido) => pedido.titulo);
    expect(titulos).toHaveLength(30);
    expect(titulos[0]).toBe("Pedido 31");
    expect(titulos).not.toContain("Pedido 1");
  });
});
