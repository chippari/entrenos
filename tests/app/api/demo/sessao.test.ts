import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { AuthRetryableFetchError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { apagarSessao, gravarSessao, lerSessao } from "@/app/api/demo/sessao";
import { createAdminClient } from "@/lib/supabase/admin";

// Substitui os cookies do Next e o cliente admin: sem requisição de verdade, sem "server-only" e sem rede.
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

// Valores FALSOS. Nunca usar tokens reais nem ler .env*.
const USUARIO_ID = "00000000-0000-4000-8000-000000000001";
const TOKENS = { access_token: "access-token-de-teste", refresh_token: "refresh-token-de-teste" };
const TOKENS_NOVOS = { access_token: "access-token-novo-de-teste", refresh_token: "refresh-token-novo-de-teste" };
const OPCOES_DO_COOKIE = { httpOnly: true, secure: true, sameSite: "lax", path: "/" };
// Erro como o Auth devolve para token expirado: não é falha de rede.
const ERRO_DE_TOKEN = { name: "AuthApiError", message: "token is expired", status: 403 };

describe("sessão da demonstração", () => {
  // Fake dos cookies: guarda os valores em memória. As funções também registram as chamadas (Mock).
  let guardados: Map<string, string>;
  let cookiesFalsos: { get: Mock; set: Mock; delete: Mock };
  // Stub do Auth: resposta configurável por teste.
  let auth: { getUser: Mock; refreshSession: Mock };

  beforeEach(() => {
    guardados = new Map();
    cookiesFalsos = {
      get: vi.fn((nome: string) => (guardados.has(nome) ? { name: nome, value: guardados.get(nome) } : undefined)),
      set: vi.fn((nome: string, valor: string) => void guardados.set(nome, valor)),
      delete: vi.fn((nome: string) => void guardados.delete(nome)),
    };
    vi.mocked(cookies).mockResolvedValue(cookiesFalsos as unknown as Awaited<ReturnType<typeof cookies>>);
    auth = {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: USUARIO_ID } }, error: null }),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: null, user: null }, error: ERRO_DE_TOKEN }),
    };
    vi.mocked(createAdminClient).mockReturnValue({ auth } as unknown as ReturnType<typeof createAdminClient>);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("deve gravar só os dois tokens num cookie httpOnly, secure, sameSite lax e path / quando a sessão é gravada", async () => {
    // Atende P-08 e a Issue #64 (a)
    // ARRANGE
    const sessaoDoAuth = { ...TOKENS, expires_in: 3600, user: { id: USUARIO_ID, email: "morador1@example.com" } };

    // ACT
    await gravarSessao(sessaoDoAuth);

    // ASSERT
    expect(cookiesFalsos.set).toHaveBeenCalledTimes(1);
    expect(cookiesFalsos.set).toHaveBeenCalledWith("demo_sessao", JSON.stringify(TOKENS), OPCOES_DO_COOKIE);
  });

  it("deve apagar o cookie quando a sessão é apagada", async () => {
    // Atende a Issue #64 (a): sair
    // ARRANGE
    guardados.set("demo_sessao", JSON.stringify(TOKENS));

    // ACT
    await apagarSessao();

    // ASSERT
    expect(cookiesFalsos.delete).toHaveBeenCalledWith("demo_sessao");
    expect(guardados.has("demo_sessao")).toBe(false);
  });

  it.each([
    ["não há cookie", undefined],
    ["o cookie não é JSON", "isto-nao-e-json"],
    ["o cookie não traz os dois tokens", JSON.stringify({ access_token: "access-token-de-teste" })],
    ["um token do cookie não é texto", JSON.stringify({ access_token: 1, refresh_token: "refresh-token-de-teste" })],
  ])("deve devolver null sem consultar o Auth quando %s", async (_caso, valor) => {
    // Atende a Issue #64 (a): sem sessão válida → 401
    // ARRANGE
    if (valor !== undefined) guardados.set("demo_sessao", valor);

    // ACT
    const usuarioId = await lerSessao();

    // ASSERT
    expect(usuarioId).toBeNull();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("deve devolver o usuario_id sem renovar nem regravar o cookie quando o access_token é válido", async () => {
    // Atende a Issue #64 (a): o "eu" é o usuario_id da sessão
    // ARRANGE
    guardados.set("demo_sessao", JSON.stringify(TOKENS));

    // ACT
    const usuarioId = await lerSessao();

    // ASSERT
    expect(usuarioId).toBe(USUARIO_ID);
    expect(auth.getUser).toHaveBeenCalledWith(TOKENS.access_token);
    expect(auth.refreshSession).not.toHaveBeenCalled();
    expect(cookiesFalsos.set).not.toHaveBeenCalled();
  });

  it("deve renovar a sessão e regravar o cookie com os tokens novos quando o access_token expirou", async () => {
    // Atende a Issue #64 (a): se expirou, refreshSession e regrava o cookie
    // ARRANGE
    guardados.set("demo_sessao", JSON.stringify(TOKENS));
    auth.getUser.mockResolvedValue({ data: { user: null }, error: ERRO_DE_TOKEN });
    auth.refreshSession.mockResolvedValue({
      data: { session: { ...TOKENS_NOVOS, expires_in: 3600 }, user: { id: USUARIO_ID } },
      error: null,
    });

    // ACT
    const usuarioId = await lerSessao();

    // ASSERT
    expect(usuarioId).toBe(USUARIO_ID);
    expect(auth.refreshSession).toHaveBeenCalledWith({ refresh_token: TOKENS.refresh_token });
    expect(cookiesFalsos.set).toHaveBeenCalledWith("demo_sessao", JSON.stringify(TOKENS_NOVOS), OPCOES_DO_COOKIE);
  });

  it("deve devolver null sem regravar o cookie quando o access_token expirou e a renovação é recusada", async () => {
    // Atende a Issue #64 (a): sem sessão válida → 401
    // ARRANGE
    guardados.set("demo_sessao", JSON.stringify(TOKENS));
    auth.getUser.mockResolvedValue({ data: { user: null }, error: ERRO_DE_TOKEN });

    // ACT
    const usuarioId = await lerSessao();

    // ASSERT
    expect(usuarioId).toBeNull();
    expect(cookiesFalsos.set).not.toHaveBeenCalled();
  });

  it("deve rejeitar sem tentar renovar quando a conferência do access_token falha por rede", async () => {
    // Atende a decisão: falha de rede não é sessão inválida
    // ARRANGE
    guardados.set("demo_sessao", JSON.stringify(TOKENS));
    auth.getUser.mockResolvedValue({ data: { user: null }, error: new AuthRetryableFetchError("fetch failed", 0) });

    // ACT
    const resultado = lerSessao();

    // ASSERT
    await expect(resultado).rejects.toThrow("falha ao conferir a sessão");
    expect(auth.refreshSession).not.toHaveBeenCalled();
  });

  it("deve rejeitar sem regravar o cookie quando a renovação falha por rede", async () => {
    // Atende a decisão: falha de rede não é sessão inválida
    // ARRANGE
    guardados.set("demo_sessao", JSON.stringify(TOKENS));
    auth.getUser.mockResolvedValue({ data: { user: null }, error: ERRO_DE_TOKEN });
    auth.refreshSession.mockResolvedValue({
      data: { session: null, user: null },
      error: new AuthRetryableFetchError("fetch failed", 0),
    });

    // ACT
    const resultado = lerSessao();

    // ASSERT
    await expect(resultado).rejects.toThrow("falha ao renovar a sessão");
    expect(cookiesFalsos.set).not.toHaveBeenCalled();
  });
});
