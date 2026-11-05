import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { POST } from "@/app/api/telegram/webhook/route";
import { processarAtualizacaoTelegram } from "@/casos-de-uso/processar-atualizacao-telegram";
import { criarRegistroDeAtualizacoesSupabase } from "@/infra/supabase/registro-de-atualizacoes-supabase";
import { criarMensageiroTelegram } from "@/infra/telegram/mensageiro-telegram";
import { createAdminClient } from "@/lib/supabase/admin";

// Substitui as peças montadas pela rota: evita "server-only", banco e rede.
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/infra/supabase/registro-de-atualizacoes-supabase", () => ({
  criarRegistroDeAtualizacoesSupabase: vi.fn(),
}));
vi.mock("@/infra/telegram/mensageiro-telegram", () => ({ criarMensageiroTelegram: vi.fn() }));
vi.mock("@/casos-de-uso/processar-atualizacao-telegram", () => ({
  processarAtualizacaoTelegram: vi.fn(),
}));

// Valores FALSOS. Nunca usar segredos reais nem ler .env*.
const SEGREDO = "segredo_falso_de_teste_123";
const TOKEN = "123456:TOKEN_FALSO_DE_TESTE";
const URL_SUPABASE = "https://exemplo.supabase.co";
const CHAVE_SUPABASE = "chave_secreta_falsa_de_teste";

// Stubs: objetos marcados só para conferir que a rota repassa cada peça ao lugar certo.
const CLIENTE = { nome: "cliente-falso" };
const REGISTRO = { nome: "registro-falso" };
const MENSAGEIRO = { nome: "mensageiro-falso" };

const CORPO_VALIDO = JSON.stringify({
  update_id: 1001,
  message: { chat: { id: 4242, type: "private" }, text: "oi" },
});

function criarRequisicao(corpo: string, segredoNoCabecalho?: string): Request {
  const headers = new Headers();
  if (segredoNoCabecalho !== undefined) {
    headers.set("X-Telegram-Bot-Api-Secret-Token", segredoNoCabecalho);
  }
  return new Request("http://localhost/api/telegram/webhook", { method: "POST", headers, body: corpo });
}

// RNF-TW-02: nenhum segredo nem o cabeçalho enviado pode aparecer na resposta ou nos logs.
function esperarNenhumVazamento(
  corpoTexto: string,
  consoleError: MockInstance,
  cabecalhoEnviado?: string,
) {
  const logs = consoleError.mock.calls.flat().map(String).join(" ");
  const proibidos = [SEGREDO, TOKEN, CHAVE_SUPABASE];
  if (cabecalhoEnviado) proibidos.push(cabecalhoEnviado);
  for (const valor of proibidos) {
    expect(corpoTexto).not.toContain(valor);
    expect(logs).not.toContain(valor);
  }
}

describe("POST /api/telegram/webhook", () => {
  let consoleError: MockInstance;

  beforeEach(() => {
    vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", SEGREDO);
    vi.stubEnv("TELEGRAM_BOT_TOKEN", TOKEN);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_SUPABASE);
    vi.stubEnv("SUPABASE_SECRET_KEY", CHAVE_SUPABASE);
    vi.mocked(createAdminClient)
      .mockReset()
      .mockReturnValue(CLIENTE as unknown as ReturnType<typeof createAdminClient>);
    vi.mocked(criarRegistroDeAtualizacoesSupabase)
      .mockReset()
      .mockReturnValue(REGISTRO as unknown as ReturnType<typeof criarRegistroDeAtualizacoesSupabase>);
    vi.mocked(criarMensageiroTelegram)
      .mockReset()
      .mockReturnValue(MENSAGEIRO as unknown as ReturnType<typeof criarMensageiroTelegram>);
    // Mock do caso de uso: só confere com que argumentos a rota o chama.
    vi.mocked(processarAtualizacaoTelegram).mockReset().mockResolvedValue(undefined);
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("deve montar as peças, chamar o caso de uso e responder 200 quando o segredo e o corpo são válidos", async () => {
    // Atende RF-TW-01 (resposta), RNF-TW-02 e RNF-TW-05
    // ARRANGE
    const requisicao = criarRequisicao(CORPO_VALIDO, SEGREDO);

    // ACT
    const resposta = await POST(requisicao);
    const corpoTexto = await resposta.text();

    // ASSERT
    expect(resposta.status).toBe(200);
    expect(JSON.parse(corpoTexto)).toEqual({ ok: true });
    expect(createAdminClient).toHaveBeenCalledTimes(1);
    expect(criarRegistroDeAtualizacoesSupabase).toHaveBeenCalledWith(CLIENTE);
    expect(criarMensageiroTelegram).toHaveBeenCalledWith({ token: TOKEN, fetch: expect.any(Function) });
    expect(processarAtualizacaoTelegram).toHaveBeenCalledTimes(1);
    expect(processarAtualizacaoTelegram).toHaveBeenCalledWith(JSON.parse(CORPO_VALIDO), {
      registro: REGISTRO,
      mensageiro: MENSAGEIRO,
    });
    esperarNenhumVazamento(corpoTexto, consoleError, SEGREDO);
  });

  it.each<[string, string | undefined]>([
    ["não há cabeçalho", undefined],
    ["o cabeçalho é errado com o mesmo tamanho do segredo", "x".repeat(SEGREDO.length)],
    ["o cabeçalho é errado com tamanho diferente", "segredo-errado"],
  ])("deve responder 401 sem ler o corpo quando %s", async (_caso, cabecalho) => {
    // Atende RF-TW-02, RNF-TW-02 e RNF-TW-05
    // ARRANGE
    const requisicao = criarRequisicao("nao é json", cabecalho);

    // ACT
    const resposta = await POST(requisicao);
    const corpoTexto = await resposta.text();

    // ASSERT
    expect(resposta.status).toBe(401);
    expect(JSON.parse(corpoTexto)).toEqual({ ok: false });
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(processarAtualizacaoTelegram).not.toHaveBeenCalled();
    esperarNenhumVazamento(corpoTexto, consoleError, cabecalho);
  });

  it("deve responder 401 e registrar só o nome da variável quando TELEGRAM_WEBHOOK_SECRET não está configurado", async () => {
    // Atende RF-TW-03, RNF-TW-02 e RNF-TW-05
    // ARRANGE
    vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", undefined);
    const requisicao = criarRequisicao("nao é json", SEGREDO);

    // ACT
    const resposta = await POST(requisicao);
    const corpoTexto = await resposta.text();

    // ASSERT
    expect(resposta.status).toBe(401);
    expect(JSON.parse(corpoTexto)).toEqual({ ok: false });
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls.flat().map(String).join(" ")).toContain("TELEGRAM_WEBHOOK_SECRET");
    expect(processarAtualizacaoTelegram).not.toHaveBeenCalled();
    esperarNenhumVazamento(corpoTexto, consoleError, SEGREDO);
  });

  it.each<[string, string]>([
    ["não é JSON", "nao é json"],
    ["é vazio", ""],
    ["é null", "null"],
    ["não tem update_id", "{}"],
    ["tem update_id em texto", '{"update_id":"1001"}'],
    ["tem update_id zero", '{"update_id":0}'],
    ["tem update_id negativo", '{"update_id":-5}'],
    ["tem update_id fracionário", '{"update_id":1.5}'],
  ])("deve responder 400 sem acessar o banco quando o corpo %s", async (_caso, corpo) => {
    // Atende RF-TW-04, RNF-TW-02 e RNF-TW-05
    // ARRANGE
    const requisicao = criarRequisicao(corpo, SEGREDO);

    // ACT
    const resposta = await POST(requisicao);
    const corpoTexto = await resposta.text();

    // ASSERT
    expect(resposta.status).toBe(400);
    expect(JSON.parse(corpoTexto)).toEqual({ ok: false });
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(processarAtualizacaoTelegram).not.toHaveBeenCalled();
    esperarNenhumVazamento(corpoTexto, consoleError, SEGREDO);
  });

  it("deve responder 500 e registrar a falha em log quando o registro da atualização falha", async () => {
    // Atende RF-TW-06, RNF-TW-02 e RNF-TW-05
    // ARRANGE
    vi.mocked(processarAtualizacaoTelegram).mockRejectedValue(
      new Error("Falha ao registrar a atualização do Telegram (código 42501)"),
    );
    const requisicao = criarRequisicao(CORPO_VALIDO, SEGREDO);

    // ACT
    const resposta = await POST(requisicao);
    const corpoTexto = await resposta.text();

    // ASSERT
    expect(resposta.status).toBe(500);
    expect(JSON.parse(corpoTexto)).toEqual({ ok: false });
    expect(consoleError).toHaveBeenCalledTimes(1);
    esperarNenhumVazamento(corpoTexto, consoleError, SEGREDO);
  });

  it.each<[string, () => void, string]>([
    [
      "TELEGRAM_BOT_TOKEN não está configurado",
      () => vi.stubEnv("TELEGRAM_BOT_TOKEN", undefined),
      "TELEGRAM_BOT_TOKEN",
    ],
    [
      "a configuração do Supabase está ausente",
      () =>
        vi.mocked(createAdminClient).mockImplementation(() => {
          throw new Error("Variável de ambiente ausente: SUPABASE_SECRET_KEY");
        }),
      "SUPABASE_SECRET_KEY",
    ],
  ])("deve responder 500 sem registrar a atualização quando %s", async (_caso, configurarFalta, nomeNoLog) => {
    // Atende RF-TW-10, RNF-TW-02 e RNF-TW-05
    // ARRANGE
    configurarFalta();
    const requisicao = criarRequisicao(CORPO_VALIDO, SEGREDO);

    // ACT
    const resposta = await POST(requisicao);
    const corpoTexto = await resposta.text();

    // ASSERT
    expect(resposta.status).toBe(500);
    expect(JSON.parse(corpoTexto)).toEqual({ ok: false });
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls.flat().map(String).join(" ")).toContain(nomeNoLog);
    expect(processarAtualizacaoTelegram).not.toHaveBeenCalled();
    esperarNenhumVazamento(corpoTexto, consoleError, SEGREDO);
  });
});
