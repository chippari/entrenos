import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { AuthRetryableFetchError } from "@supabase/supabase-js";
import { POST } from "@/app/api/demo/login/route";
import { gravarSessao } from "@/app/api/demo/sessao";
import { createAdminClient } from "@/lib/supabase/admin";

// Substitui o cliente admin e a gravação do cookie: sem "server-only", sem rede e sem requisição de verdade.
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/app/api/demo/sessao", () => ({ gravarSessao: vi.fn() }));

// Valores FALSOS (ADR-35). Nunca usar e-mail, senha ou tokens reais nem ler .env*.
const EMAIL = "morador1@example.com";
const SENHA = "senha-de-teste";
const USUARIO_ID = "00000000-0000-4000-8000-000000000001";
const SESSAO = { access_token: "access-token-de-teste", refresh_token: "refresh-token-de-teste" };
const LINHA_DO_MORADOR = { usuario_id: USUARIO_ID, nome: "Morador Teste 1", unidade: "Apto 101", telefone: "(11) 90000-0001" };
const ERRO_DE_CREDENCIAIS = { name: "AuthApiError", message: "Invalid login credentials", status: 400 };

type Cliente = ReturnType<typeof createAdminClient>;

function criarRequisicao(corpo: unknown): Request {
  return new Request("http://localhost/api/demo/login", {
    method: "POST",
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

describe("POST /api/demo/login", () => {
  // Stub do Auth e do banco: respostas configuráveis por teste. As funções também registram as chamadas (Mock).
  let signInWithPassword: Mock;
  let maybeSingle: Mock;
  let from: Mock;

  beforeEach(() => {
    signInWithPassword = vi.fn().mockResolvedValue({ data: { session: SESSAO, user: { id: USUARIO_ID } }, error: null });
    maybeSingle = vi.fn().mockResolvedValue({ data: LINHA_DO_MORADOR, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    from = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });
    // Dois clientes: o primeiro só tem o Auth, o segundo só tem o banco. Se a rota consultar o banco
    // com o cliente que entrou (que passa a consultar como authenticated), o teste quebra.
    vi.mocked(createAdminClient)
      .mockReturnValueOnce({ auth: { signInWithPassword } } as unknown as Cliente)
      .mockReturnValueOnce({ from } as unknown as Cliente);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("deve gravar a sessão e responder com o morador quando o e-mail e a senha conferem e há cadastro", async () => {
    // Atende a Issue #64 (a)
    // ARRANGE
    const requisicao = criarRequisicao({ email: `  ${EMAIL} `, senha: SENHA });

    // ACT
    const resposta = await POST(requisicao);

    // ASSERT
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({
      ok: true,
      morador: { id: USUARIO_ID, nome: "Morador Teste 1", unidade: "Apto 101", telefone: "(11) 90000-0001" },
    });
    expect(signInWithPassword).toHaveBeenCalledWith({ email: EMAIL, password: SENHA });
    expect(from).toHaveBeenCalledWith("demo_moradores");
    expect(gravarSessao).toHaveBeenCalledWith(SESSAO);
  });

  it.each([
    ["o corpo não é JSON", "isto-nao-e-json"],
    ["falta o e-mail", { senha: SENHA }],
    ["falta a senha", { email: EMAIL }],
    ["o e-mail só tem espaços", { email: "   ", senha: SENHA }],
    ["o e-mail não é texto", { email: 1, senha: SENHA }],
  ])("deve responder 400 dados_invalidos sem consultar o Auth quando %s", async (_caso, corpo) => {
    // Atende a Issue #64 (a): entrada inválida
    // ARRANGE
    const requisicao = criarRequisicao(corpo);

    // ACT
    const resposta = await POST(requisicao);

    // ASSERT
    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toEqual({ motivo: "dados_invalidos" });
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(gravarSessao).not.toHaveBeenCalled();
  });

  it("deve responder 401 sem gravar sessão e sem repetir o e-mail, a senha ou o erro do Auth quando a senha está errada", async () => {
    // Atende P-08 (nenhum segredo em resposta)
    // ARRANGE
    signInWithPassword.mockResolvedValue({ data: { session: null, user: null }, error: ERRO_DE_CREDENCIAIS });

    // ACT
    const resposta = await POST(criarRequisicao({ email: EMAIL, senha: SENHA }));
    const corpo = await resposta.text();

    // ASSERT
    expect(resposta.status).toBe(401);
    expect(JSON.parse(corpo)).toEqual({ motivo: "credenciais_invalidas" });
    for (const proibido of [EMAIL, SENHA, ERRO_DE_CREDENCIAIS.message]) {
      expect(corpo).not.toContain(proibido);
    }
    expect(from).not.toHaveBeenCalled();
    expect(gravarSessao).not.toHaveBeenCalled();
  });

  it("deve responder 403 sem_cadastro sem gravar sessão quando o usuário não tem cadastro de morador", async () => {
    // Atende a Issue #64 (a): sem demo_moradores → 403 sem_cadastro
    // ARRANGE
    maybeSingle.mockResolvedValue({ data: null, error: null });

    // ACT
    const resposta = await POST(criarRequisicao({ email: EMAIL, senha: SENHA }));

    // ASSERT
    expect(resposta.status).toBe(403);
    expect(await resposta.json()).toEqual({ motivo: "sem_cadastro" });
    expect(gravarSessao).not.toHaveBeenCalled();
  });

  it("deve rejeitar sem gravar sessão quando o Auth falha por rede", async () => {
    // Atende a decisão: falha de rede não é senha errada
    // ARRANGE
    signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: new AuthRetryableFetchError("fetch failed", 0),
    });

    // ACT
    const resultado = POST(criarRequisicao({ email: EMAIL, senha: SENHA }));

    // ASSERT
    await expect(resultado).rejects.toThrow("falha ao entrar");
    expect(gravarSessao).not.toHaveBeenCalled();
  });
});
