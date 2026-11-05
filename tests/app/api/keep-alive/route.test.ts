import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { GET } from "@/app/api/keep-alive/route";
import { createAdminClient } from "@/lib/supabase/admin";

// Substitui o cliente admin: evita carregar "server-only" e qualquer acesso real ao banco.
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

// Valores FALSOS. Nunca usar segredos reais nem ler .env*.
const SEGREDO_CRON = "segredo-de-teste";
const CHAVE_SUPABASE = "chave-secreta-de-teste";
const URL_SUPABASE = "http://supabase-falso.local";
const AGORA = "2026-11-05T09:00:00.000Z";

type ResultadoBanco = { data: { pinged_at: string } | null; error: { message: string } | null };

// Cliente Supabase falso: Stub (resposta configurável) + Mock (registra os argumentos da cadeia para conferir).
function criarClienteFalso(resultado: ResultadoBanco) {
  const single = vi.fn().mockResolvedValue(resultado);
  const select = vi.fn().mockReturnValue({ single });
  const eq = vi.fn().mockReturnValue({ select });
  const update = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ update });
  const cliente = { from } as unknown as ReturnType<typeof createAdminClient>;
  return { cliente, from, update, eq, select, single };
}

function criarRequisicao(authorization?: string): Request {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("http://localhost/api/keep-alive", { method: "GET", headers });
}

// RNF-KA-02: nenhum segredo nem o cabeçalho enviado pode aparecer na resposta ou nos logs.
function esperarNenhumVazamento(
  corpo: string,
  consoleError: MockInstance,
  authorizationEnviado?: string,
) {
  const logs = consoleError.mock.calls.flat().map(String).join(" ");
  const proibidos = [SEGREDO_CRON, CHAVE_SUPABASE];
  if (authorizationEnviado) proibidos.push(authorizationEnviado);
  for (const valor of proibidos) {
    expect(corpo).not.toContain(valor);
    expect(logs).not.toContain(valor);
  }
}

describe("GET /api/keep-alive", () => {
  let consoleError: MockInstance;

  beforeEach(() => {
    // Padrão: cliente falso que funciona. Se a rota acessar o banco quando não deveria,
    // o teste falha pela asserção (status/corpo), não por um erro de "undefined".
    vi.mocked(createAdminClient)
      .mockReset()
      .mockReturnValue(criarClienteFalso({ data: { pinged_at: AGORA }, error: null }).cliente);
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("CRON_SECRET", SEGREDO_CRON);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_SUPABASE);
    vi.stubEnv("SUPABASE_SECRET_KEY", CHAVE_SUPABASE);
    vi.useFakeTimers();
    vi.setSystemTime(new Date(AGORA));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("deve atualizar pinged_at da linha 1 e responder 200 quando o cabeçalho tem o segredo correto", async () => {
    // Atende RF-KA-01 e RNF-KA-02
    // ARRANGE
    const authorization = `Bearer ${SEGREDO_CRON}`;
    const falso = criarClienteFalso({ data: { pinged_at: AGORA }, error: null });
    vi.mocked(createAdminClient).mockReturnValue(falso.cliente);

    // ACT
    const resposta = await GET(criarRequisicao(authorization));
    const corpo = await resposta.text();

    // ASSERT
    expect(resposta.status).toBe(200);
    expect(JSON.parse(corpo)).toEqual({ ok: true, pinged_at: AGORA });
    expect(falso.from).toHaveBeenCalledWith("keep_alive");
    expect(falso.update).toHaveBeenCalledWith({ pinged_at: AGORA });
    expect(falso.eq).toHaveBeenCalledWith("id", 1);
    expect(falso.single).toHaveBeenCalledTimes(1);
    esperarNenhumVazamento(corpo, consoleError, authorization);
  });

  it("deve responder 500 sem acessar o banco quando CRON_SECRET não está configurado", async () => {
    // Atende RF-KA-02 e RNF-KA-02
    // ARRANGE
    vi.stubEnv("CRON_SECRET", undefined);
    const authorization = `Bearer ${SEGREDO_CRON}`;

    // ACT
    const resposta = await GET(criarRequisicao(authorization));
    const corpo = await resposta.text();

    // ASSERT
    expect(resposta.status).toBe(500);
    expect(JSON.parse(corpo)).toEqual({ ok: false, error: "CRON_SECRET não configurado" });
    expect(createAdminClient).not.toHaveBeenCalled();
    esperarNenhumVazamento(corpo, consoleError, authorization);
  });

  it.each([
    { caso: "o cabeçalho está ausente", authorization: undefined },
    {
      caso: "o segredo está errado com o mesmo tamanho",
      authorization: `Bearer ${"x".repeat(SEGREDO_CRON.length)}`,
    },
    { caso: "o segredo está errado com tamanho diferente", authorization: "Bearer outro" },
    { caso: "o segredo está certo mas sem o prefixo Bearer", authorization: SEGREDO_CRON },
  ])("deve responder 401 sem acessar o banco quando $caso", async ({ authorization }) => {
    // Atende RF-KA-03 e RNF-KA-02
    // ARRANGE
    const requisicao = criarRequisicao(authorization);

    // ACT
    const resposta = await GET(requisicao);
    const corpo = await resposta.text();

    // ASSERT
    expect(resposta.status).toBe(401);
    expect(JSON.parse(corpo)).toEqual({ ok: false });
    expect(createAdminClient).not.toHaveBeenCalled();
    esperarNenhumVazamento(corpo, consoleError, authorization);
  });

  it("deve responder 500 e registrar só o nome da variável quando falta configuração do Supabase", async () => {
    // Atende RF-KA-04 e RNF-KA-02
    // ARRANGE
    vi.stubEnv("SUPABASE_SECRET_KEY", undefined);
    const authorization = `Bearer ${SEGREDO_CRON}`;
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error("Variável de ambiente ausente: SUPABASE_SECRET_KEY");
    });

    // ACT
    const resposta = await GET(criarRequisicao(authorization));
    const corpo = await resposta.text();

    // ASSERT
    expect(resposta.status).toBe(500);
    expect(JSON.parse(corpo)).toEqual({ ok: false, error: "configuração do Supabase ausente" });
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0].map(String).join(" ")).toContain("SUPABASE_SECRET_KEY");
    esperarNenhumVazamento(corpo, consoleError, authorization);
  });

  it("deve responder 500 quando o banco devolve erro na atualização", async () => {
    // Atende RF-KA-05 e RNF-KA-02
    // ARRANGE
    const authorization = `Bearer ${SEGREDO_CRON}`;
    const falso = criarClienteFalso({ data: null, error: { message: "relation does not exist" } });
    vi.mocked(createAdminClient).mockReturnValue(falso.cliente);

    // ACT
    const resposta = await GET(criarRequisicao(authorization));
    const corpo = await resposta.text();

    // ASSERT
    expect(resposta.status).toBe(500);
    expect(JSON.parse(corpo)).toEqual({ ok: false, error: "falha ao atualizar keep_alive" });
    esperarNenhumVazamento(corpo, consoleError, authorization);
  });
});
