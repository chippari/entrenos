export type AtualizacaoTelegram = {
  update_id: number;
  message?: {
    chat: { id: number; type: string };
    text?: string;
    from?: { first_name?: string; username?: string };
  };
};

// Texto de instruções TXT-TW-01 (RB-TW-01).
export const TXT_TW_01 =
  "Olá! Eu sou o bot do EntreNós. Em breve você vai poder conectar sua conta pelo site: https://entrenos-teal.vercel.app";

// RF-TW-07 e RF-TW-08: só mensagem de texto num chat privado.
export function lerMensagemDeTextoPrivada(
  atualizacao: AtualizacaoTelegram,
): { chatId: number } | null {
  const mensagem = atualizacao.message;
  if (!mensagem || typeof mensagem.text !== "string" || mensagem.chat.type !== "private") {
    return null;
  }
  return { chatId: mensagem.chat.id };
}
