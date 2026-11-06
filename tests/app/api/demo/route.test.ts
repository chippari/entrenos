import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, POST } from "@/app/api/demo/route";
import { lerSessao } from "@/app/api/demo/sessao";
import { criarPedidoDaDemo } from "@/casos-de-uso/demo/criar-pedido-da-demo";
import { limparDemo } from "@/casos-de-uso/demo/limpar-demo";
import { listarPedidosDaDemo } from "@/casos-de-uso/demo/listar-pedidos-da-demo";
import { mudarPedidoDaDemo } from "@/casos-de-uso/demo/mudar-pedido-da-demo";
import { createAdminClient } from "@/lib/supabase/admin";

// A rota só traduz a entrada (ARQ-03): a sessão, o cliente admin e os casos de uso são trocados por dublês.
vi.mock("@/app/api/demo/sessao", () => ({ lerSessao: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/casos-de-uso/demo/listar-pedidos-da-demo", () => ({ listarPedidosDaDemo: vi.fn() }));
vi.mock("@/casos-de-uso/demo/criar-pedido-da-demo", () => ({ criarPedidoDaDemo: vi.fn() }));
vi.mock("@/casos-de-uso/demo/mudar-pedido-da-demo", () => ({ mudarPedidoDaDemo: vi.fn() }));
vi.mock("@/casos-de-uso/demo/limpar-demo", () => ({ limparDemo: vi.fn() }));

const USUARIO_DA_SESSAO = "00000000-0000-4000-8000-000000000001";
const OUTRO_USUARIO = "00000000-0000-4000-8000-000000000002";
const PEDIDO_ID = "00000000-0000-4000-8000-0000000000aa";
const DEPENDENCIAS = { repositorio: expect.any(Object), agora: expect.any(Date) };
const CASOS_DE_USO = [listarPedidosDaDemo, criarPedidoDaDemo, mudarPedidoDaDemo, limparDemo];

function requisicao(metodo: "POST" | "DELETE", corpo?: unknown): Request {
  return new Request("http://localhost/api/demo", {
    method: metodo,
    body: corpo === undefined ? undefined : typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

describe("/api/demo", () => {
  beforeEach(() => {
    // Stubs: há sessão, e cada caso de uso (Mock) devolve uma resposta só dele.
    vi.mocked(lerSessao).mockResolvedValue(USUARIO_DA_SESSAO);
    vi.mocked(createAdminClient).mockReturnValue({} as ReturnType<typeof createAdminClient>);
    vi.mocked(listarPedidosDaDemo).mockResolvedValue({ status: 200, corpo: { pedidos: [] } });
    vi.mocked(criarPedidoDaDemo).mockResolvedValue({ status: 201, corpo: { ok: true } });
    vi.mocked(mudarPedidoDaDemo).mockResolvedValue({ status: 409, corpo: { motivo: "ja_aceita" } });
    vi.mocked(limparDemo).mockResolvedValue({ status: 200, corpo: { ok: true } });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it.each([
    ["GET", () => GET()],
    ["POST", () => POST(requisicao("POST", { acao: "aceitar", id: PEDIDO_ID }))],
    ["DELETE", () => DELETE()],
  ])("deve responder 401 sem montar o repositório nem chamar caso de uso quando %s chega sem sessão", async (_metodo, chamar) => {
    // Atende a Issue #64 (a): sem sessão válida → 401
    // ARRANGE
    vi.mocked(lerSessao).mockResolvedValue(null);

    // ACT
    const resposta = await chamar();

    // ASSERT
    expect(resposta.status).toBe(401);
    expect(await resposta.json()).toEqual({ motivo: "sem_sessao" });
    expect(createAdminClient).not.toHaveBeenCalled();
    for (const casoDeUso of CASOS_DE_USO) expect(casoDeUso).not.toHaveBeenCalled();
  });

  it("deve listar em nome do usuário da sessão e devolver a resposta do caso de uso quando chega GET", async () => {
    // Atende ARQ-03
    // ARRANGE (sessão e respostas no beforeEach)

    // ACT
    const resposta = await GET();

    // ASSERT
    expect(listarPedidosDaDemo).toHaveBeenCalledWith(USUARIO_DA_SESSAO, DEPENDENCIAS);
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ pedidos: [] });
  });

  it("deve criar em nome do usuário da sessão, ignorando o eu do corpo, quando a ação é criar", async () => {
    // Atende a Issue #64 (a): o corpo { eu } deixa de existir
    // ARRANGE
    const corpo = {
      eu: OUTRO_USUARIO,
      acao: "criar",
      titulo: "Regar as plantas da varanda",
      descricao: "São três vasos pequenos.",
      categoria: 7,
      dataEHora: "2026-11-07T09:00",
    };

    // ACT
    const resposta = await POST(requisicao("POST", corpo));

    // ASSERT
    expect(criarPedidoDaDemo).toHaveBeenCalledWith(
      USUARIO_DA_SESSAO,
      {
        titulo: "Regar as plantas da varanda",
        descricao: "São três vasos pequenos.",
        // Valor que não é texto chega ao caso de uso como null.
        categoria: null,
        dataEHora: "2026-11-07T09:00",
      },
      DEPENDENCIAS,
    );
    expect(resposta.status).toBe(201);
    expect(await resposta.json()).toEqual({ ok: true });
  });

  it("deve mudar o pedido em nome do usuário da sessão e devolver o status do caso de uso quando chega uma ação", async () => {
    // Atende ARQ-03 e P-02 (a rota não decide a transição)
    // ARRANGE
    const corpo = { eu: OUTRO_USUARIO, acao: "concluir", id: PEDIDO_ID, apoiadorVistoId: OUTRO_USUARIO };

    // ACT
    const resposta = await POST(requisicao("POST", corpo));

    // ASSERT
    expect(mudarPedidoDaDemo).toHaveBeenCalledWith(USUARIO_DA_SESSAO, "concluir", PEDIDO_ID, OUTRO_USUARIO, DEPENDENCIAS);
    expect(resposta.status).toBe(409);
    expect(await resposta.json()).toEqual({ motivo: "ja_aceita" });
  });

  it("deve passar null como apoiador visto quando a ação não traz esse campo", async () => {
    // Atende ARQ-03 (tradução da entrada)
    // ARRANGE
    const corpo = { acao: "aceitar", id: PEDIDO_ID };

    // ACT
    await POST(requisicao("POST", corpo));

    // ASSERT
    expect(mudarPedidoDaDemo).toHaveBeenCalledWith(USUARIO_DA_SESSAO, "aceitar", PEDIDO_ID, null, DEPENDENCIAS);
  });

  it.each([
    ["o corpo não é JSON", "isto-nao-e-json"],
    ["a ação não existe", { acao: "apagar", id: PEDIDO_ID }],
    ["falta o id", { acao: "aceitar" }],
    ["o id não é um UUID", { acao: "aceitar", id: "pedido-1" }],
  ])("deve responder 400 pedido_invalido sem chamar caso de uso quando %s", async (_caso, corpo) => {
    // Atende ARQ-03 (tradução da entrada)
    // ARRANGE
    const entrada = requisicao("POST", corpo);

    // ACT
    const resposta = await POST(entrada);

    // ASSERT
    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toEqual({ motivo: "pedido_invalido" });
    for (const casoDeUso of CASOS_DE_USO) expect(casoDeUso).not.toHaveBeenCalled();
  });

  it("deve limpar a demonstração e devolver a resposta do caso de uso quando chega DELETE com sessão", async () => {
    // Atende ARQ-03
    // ARRANGE (sessão e respostas no beforeEach)

    // ACT
    const resposta = await DELETE();

    // ASSERT
    expect(limparDemo).toHaveBeenCalledWith(DEPENDENCIAS);
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ ok: true });
  });
});
