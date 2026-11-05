import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { criarMensageiroTelegram } from "@/infra/telegram/mensageiro-telegram";
import type { Mensageiro } from "@/portas/mensageiro";

// Valores FALSOS. Nunca usar o token real nem ler .env*.
const TOKEN_FALSO = "123456:TOKEN_FALSO_DE_TESTE";
const CHAT_ID = 4242;
const TEXTO = "texto de teste";

function respostaJson(corpo: unknown, status: number): Response {
  return new Response(JSON.stringify(corpo), { status });
}

const RESPOSTA_BLOQUEADO = {
  ok: false,
  error_code: 403,
  description: "Forbidden: bot was blocked by the user",
};

describe("criarMensageiroTelegram", () => {
  let fetch: Mock<typeof globalThis.fetch>;
  let mensageiro: Mensageiro;

  beforeEach(() => {
    // Stub/Mock do fetch, injetado na fábrica: sem rede.
    fetch = vi.fn<typeof globalThis.fetch>();
    mensageiro = criarMensageiroTelegram({ token: TOKEN_FALSO, fetch });
  });

  it("deve enviar POST ao sendMessage com chat_id e texto quando a Bot API responde ok", async () => {
    // Atende RF-TW-07
    // ARRANGE
    fetch.mockResolvedValue(respostaJson({ ok: true, result: {} }, 200));

    // ACT
    const resultado = mensageiro.enviarTexto(CHAT_ID, TEXTO);

    // ASSERT
    await expect(resultado).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.telegram.org/bot123456:TOKEN_FALSO_DE_TESTE/sendMessage",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: 4242, text: "texto de teste" }),
      },
    );
  });

  it("deve rejeitar com o status quando a Bot API responde erro", async () => {
    // Atende RF-TW-09
    // ARRANGE
    fetch.mockResolvedValue(respostaJson(RESPOSTA_BLOQUEADO, 403));

    // ACT
    const resultado = mensageiro.enviarTexto(CHAT_ID, TEXTO);

    // ASSERT
    await expect(resultado).rejects.toThrow("403");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("deve rejeitar quando o fetch falha por erro de rede", async () => {
    // Atende RF-TW-09
    // ARRANGE
    fetch.mockRejectedValue(new TypeError("fetch failed"));

    // ACT
    const resultado = mensageiro.enviarTexto(CHAT_ID, TEXTO);

    // ASSERT
    await expect(resultado).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("deve rejeitar sem a URL, o token e a causa quando o erro de rede traz a URL", async () => {
    // Atende RNF-TW-02
    // ARRANGE
    fetch.mockRejectedValue(
      new TypeError("fetch failed: https://api.telegram.org/bot123456:TOKEN_FALSO_DE_TESTE/sendMessage"),
    );

    // ACT
    const erro = await mensageiro.enviarTexto(CHAT_ID, TEXTO).catch((e: unknown) => e);

    // ASSERT
    expect(erro).toBeInstanceOf(Error);
    expect((erro as Error).message).not.toContain("TOKEN_FALSO_DE_TESTE");
    expect((erro as Error).message).not.toContain("api.telegram.org");
    expect((erro as Error).cause).toBeUndefined();
  });

  it("deve rejeitar sem o token e sem a descrição da Bot API quando ela responde erro", async () => {
    // Atende RNF-TW-02
    // ARRANGE
    fetch.mockResolvedValue(respostaJson(RESPOSTA_BLOQUEADO, 403));

    // ACT
    const erro = await mensageiro.enviarTexto(CHAT_ID, TEXTO).catch((e: unknown) => e);

    // ASSERT
    expect(erro).toBeInstanceOf(Error);
    expect((erro as Error).message).not.toContain("TOKEN_FALSO_DE_TESTE");
    expect((erro as Error).message).not.toContain("blocked by the user");
  });
});
