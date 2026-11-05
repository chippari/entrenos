import { timingSafeEqual } from "node:crypto";
import { processarAtualizacaoTelegram } from "@/casos-de-uso/processar-atualizacao-telegram";
import type { AtualizacaoTelegram } from "@/dominio/telegram/atualizacao";
import { criarRegistroDeAtualizacoesSupabase } from "@/infra/supabase/registro-de-atualizacoes-supabase";
import { criarMensageiroTelegram } from "@/infra/telegram/mensageiro-telegram";
import { createAdminClient } from "@/lib/supabase/admin";

// RNF-TW-01: comparação em tempo constante.
function segredoConfere(cabecalho: string | null, segredo: string): boolean {
  if (!cabecalho) return false;
  const recebido = Buffer.from(cabecalho);
  const esperado = Buffer.from(segredo);
  if (recebido.length !== esperado.length) return false;
  return timingSafeEqual(recebido, esperado);
}

// RF-TW-04: só objeto não nulo com update_id inteiro positivo.
function temUpdateIdValido(corpo: unknown): corpo is AtualizacaoTelegram {
  if (typeof corpo !== "object" || corpo === null) return false;
  const updateId = (corpo as { update_id?: unknown }).update_id;
  return typeof updateId === "number" && Number.isInteger(updateId) && updateId > 0;
}

// RNF-TW-05: todas as respostas são { ok: true } ou { ok: false }.
export async function POST(request: Request) {
  // RF-TW-03: sem segredo configurado, ninguém é autorizado.
  const segredo = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!segredo) {
    console.error("telegram-webhook: variável de ambiente ausente: TELEGRAM_WEBHOOK_SECRET");
    return Response.json({ ok: false }, { status: 401 });
  }

  // RF-TW-02: o corpo só é lido depois do segredo conferido.
  if (!segredoConfere(request.headers.get("X-Telegram-Bot-Api-Secret-Token"), segredo)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  // RF-TW-04: request.json() rejeita com SyntaxError quando o corpo não é JSON (inclusive vazio).
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!temUpdateIdValido(corpo)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  // RF-TW-10: configuração ausente responde 500 antes de registrar a atualização.
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("telegram-webhook: variável de ambiente ausente: TELEGRAM_BOT_TOKEN");
    return Response.json({ ok: false }, { status: 500 });
  }

  let cliente: ReturnType<typeof createAdminClient>;
  try {
    cliente = createAdminClient();
  } catch (e) {
    // A mensagem de createAdminClient traz só o nome da variável ausente.
    console.error(
      "telegram-webhook: configuração do Supabase ausente:",
      e instanceof Error ? e.message : "erro desconhecido",
    );
    return Response.json({ ok: false }, { status: 500 });
  }

  // RF-TW-01: a regra fica no caso de uso (ARQ-03).
  try {
    await processarAtualizacaoTelegram(corpo, {
      registro: criarRegistroDeAtualizacoesSupabase(cliente),
      mensageiro: criarMensageiroTelegram({ token, fetch }),
    });
  } catch {
    // RF-TW-06 e RNF-TW-02: só o update_id no log, nunca o erro original.
    console.error(`telegram-webhook: falha ao processar a atualização (update_id ${corpo.update_id}).`);
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ ok: true });
}
