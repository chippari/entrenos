import { lerMensagemDeTextoPrivada, TXT_TW_01, type AtualizacaoTelegram } from "@/dominio/telegram/atualizacao";
import type { Mensageiro } from "@/portas/mensageiro";
import type { RegistroDeAtualizacoes } from "@/portas/registro-de-atualizacoes";

export async function processarAtualizacaoTelegram(
  atualizacao: AtualizacaoTelegram,
  dependencias: { registro: RegistroDeAtualizacoes; mensageiro: Mensageiro },
): Promise<void> {
  // RF-TW-01: registra antes de qualquer outro processamento. RF-TW-06: o erro sobe.
  const novo = await dependencias.registro.registrarSeNovo(atualizacao.update_id);
  // RF-TW-05: repetida, nenhuma ação.
  if (!novo) return;

  // RF-TW-08: não é mensagem de texto de chat privado.
  const mensagem = lerMensagemDeTextoPrivada(atualizacao);
  if (!mensagem) return;

  try {
    // RF-TW-07 e RB-TW-01.
    await dependencias.mensageiro.enviarTexto(mensagem.chatId, TXT_TW_01);
  } catch {
    // RF-TW-09 e RNF-TW-03: só o update_id no log, nunca o erro, o texto ou quem enviou.
    console.error(`Falha ao enviar TXT-TW-01 (update_id ${atualizacao.update_id}).`);
  }
}
