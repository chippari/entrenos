import { afterEach, beforeEach, describe, expect, it, vi, type Mock, type MockInstance } from "vitest";
import { processarAtualizacaoTelegram } from "@/casos-de-uso/processar-atualizacao-telegram";
import type { AtualizacaoTelegram } from "@/dominio/telegram/atualizacao";
import type { Mensageiro } from "@/portas/mensageiro";
import type { RegistroDeAtualizacoes } from "@/portas/registro-de-atualizacoes";

// Fake: implementação real e simples da porta, em memória (sem banco).
class RegistroEmMemoria implements RegistroDeAtualizacoes {
  private readonly registrados = new Set<number>();

  constructor(private readonly eventos: string[] = []) {}

  async registrarSeNovo(updateId: number): Promise<boolean> {
    this.eventos.push(`registrar:${updateId}`);
    if (this.registrados.has(updateId)) return false;
    this.registrados.add(updateId);
    return true;
  }

  foiRegistrado(updateId: number): boolean {
    return this.registrados.has(updateId);
  }
}

const UPDATE_ID = 1001;
const CHAT_ID = 4242;

function criarAtualizacaoDeTextoPrivada(
  texto = "oi",
  from: { first_name?: string; username?: string } = {},
): AtualizacaoTelegram {
  return {
    update_id: UPDATE_ID,
    message: { chat: { id: CHAT_ID, type: "private" }, text: texto, from },
  };
}

describe("processarAtualizacaoTelegram", () => {
  let eventos: string[];
  let registro: RegistroEmMemoria;
  let mensageiro: { enviarTexto: Mock<Mensageiro["enviarTexto"]> };
  let consoleError: MockInstance;

  beforeEach(() => {
    eventos = [];
    registro = new RegistroEmMemoria(eventos);
    // Mock: registra as chamadas para conferir depois.
    mensageiro = {
      enviarTexto: vi.fn<Mensageiro["enviarTexto"]>(async (chatId) => {
        eventos.push(`enviar:${chatId}`);
      }),
    };
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve registrar o update_id antes de enviar a mensagem quando chega uma atualização nova", async () => {
    // Atende RF-TW-01
    // ARRANGE
    const atualizacao = criarAtualizacaoDeTextoPrivada();

    // ACT
    await processarAtualizacaoTelegram(atualizacao, { registro, mensageiro });

    // ASSERT
    expect(eventos).toEqual([`registrar:${UPDATE_ID}`, `enviar:${CHAT_ID}`]);
  });

  it("deve não enviar mensagem quando o update_id já foi registrado", async () => {
    // Atende RF-TW-05
    // ARRANGE
    await registro.registrarSeNovo(UPDATE_ID);
    const registrarSeNovo = vi.spyOn(registro, "registrarSeNovo");
    const atualizacao = criarAtualizacaoDeTextoPrivada();

    // ACT
    await processarAtualizacaoTelegram(atualizacao, { registro, mensageiro });

    // ASSERT
    expect(registrarSeNovo).toHaveBeenCalledWith(UPDATE_ID);
    expect(mensageiro.enviarTexto).not.toHaveBeenCalled();
  });

  it("deve enviar o texto de instruções ao chat quando chega texto num chat privado com update novo", async () => {
    // Atende RF-TW-07 e RB-TW-01
    // ARRANGE
    const atualizacao = criarAtualizacaoDeTextoPrivada();

    // ACT
    await processarAtualizacaoTelegram(atualizacao, { registro, mensageiro });

    // ASSERT
    expect(mensageiro.enviarTexto).toHaveBeenCalledTimes(1);
    expect(mensageiro.enviarTexto).toHaveBeenCalledWith(
      CHAT_ID,
      "Olá! Eu sou o bot do EntreNós. Em breve você vai poder conectar sua conta pelo site: https://entrenos-teal.vercel.app",
    );
  });

  it.each<[string, AtualizacaoTelegram]>([
    ["não há message", { update_id: UPDATE_ID }],
    ["a message não tem text", { update_id: UPDATE_ID, message: { chat: { id: CHAT_ID, type: "private" } } }],
    ["o chat é group", { update_id: UPDATE_ID, message: { chat: { id: CHAT_ID, type: "group" }, text: "oi" } }],
    ["o chat é supergroup", { update_id: UPDATE_ID, message: { chat: { id: CHAT_ID, type: "supergroup" }, text: "oi" } }],
    ["o chat é channel", { update_id: UPDATE_ID, message: { chat: { id: CHAT_ID, type: "channel" }, text: "oi" } }],
  ])("deve registrar o update_id e não enviar mensagem quando %s", async (_caso, atualizacao) => {
    // Atende RF-TW-08
    // ARRANGE (atualização vem do it.each)

    // ACT
    await processarAtualizacaoTelegram(atualizacao, { registro, mensageiro });

    // ASSERT
    expect(registro.foiRegistrado(UPDATE_ID)).toBe(true);
    expect(mensageiro.enviarTexto).not.toHaveBeenCalled();
  });

  it("deve rejeitar com o erro do registro e não enviar mensagem quando o registro falha", async () => {
    // Atende RF-TW-06 (parte do caso de uso: não enviar)
    // ARRANGE
    const erro = new Error("falha no registro");
    vi.spyOn(registro, "registrarSeNovo").mockRejectedValue(erro);
    const atualizacao = criarAtualizacaoDeTextoPrivada();

    // ACT
    const resultado = processarAtualizacaoTelegram(atualizacao, { registro, mensageiro });

    // ASSERT
    await expect(resultado).rejects.toBe(erro);
    expect(mensageiro.enviarTexto).not.toHaveBeenCalled();
  });

  it("deve resolver sem lançar e registrar a falha em log quando o envio falha", async () => {
    // Atende RF-TW-09
    // ARRANGE
    mensageiro.enviarTexto.mockRejectedValue(new Error("falha no envio"));
    const atualizacao = criarAtualizacaoDeTextoPrivada();

    // ACT
    const resultado = processarAtualizacaoTelegram(atualizacao, { registro, mensageiro });

    // ASSERT
    await expect(resultado).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it("deve não incluir no log o texto nem o nome de quem enviou quando o envio falha", async () => {
    // Atende RNF-TW-03
    // ARRANGE
    mensageiro.enviarTexto.mockRejectedValue(new Error("falha no envio"));
    const atualizacao = criarAtualizacaoDeTextoPrivada("segredo-do-morador", {
      first_name: "NomeDeTeste",
      username: "usuario_de_teste",
    });

    // ACT
    await processarAtualizacaoTelegram(atualizacao, { registro, mensageiro });

    // ASSERT
    expect(consoleError).toHaveBeenCalledTimes(1);
    const logs = consoleError.mock.calls.flat().map(String).join(" ");
    for (const proibido of ["segredo-do-morador", "NomeDeTeste", "usuario_de_teste"]) {
      expect(logs).not.toContain(proibido);
    }
  });
});
